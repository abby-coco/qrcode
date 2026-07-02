const cloudConfig = require('../config/cloud.js')

function isHttpUrl(text) {
  return /^https?:\/\/.+/i.test(String(text).trim())
}

function isCloudReady() {
  return !!wx.cloud
}

function formatCloudError(name, err) {
  const msg = String((err && (err.errMsg || err.message)) || '调用失败')
  const codeMatch = msg.match(/errCode:\s*(-?\d+)/)
  const code = (err && err.errCode) || (codeMatch && codeMatch[1])

  if (msg.includes('FUNCTION_NOT_FOUND') || msg.includes('-501000') || code === -501000 || code === '-501000') {
    return `[${name}] 云函数不存在\n\n请在微信开发者工具中：\ncloudfunctions/${name} → 右键 → 上传并部署：云端安装依赖`
  }
  if (msg.includes('Environment') || code === -501001 || code === '-501001') {
    return `[${name}] 云环境不匹配\n\n请确认 config/cloud.js 的 envId 与开发者工具「云开发」里选中的环境一致`
  }
  if (msg.includes('cloud init') || msg.includes('未开通云开发')) {
    return `[${name}] 云开发未初始化\n\n请用正式 AppID 打开项目，并点击顶部「云开发」开通`
  }
  if (code === -1 || code === '-1' || msg.includes('system error')) {
    return `[${name}] 云函数执行失败\n\n请确认 ${name} 已正确部署，且数据库集合 qr_contents 已创建`
  }

  return `[${name}] ${msg}${code ? `\n(errCode: ${code})` : ''}`
}

function callCloud(name, data, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    if (!isCloudReady()) {
      reject(new Error('当前环境不支持云开发，请使用微信开发者工具并开通云开发'))
      return
    }

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`[${name}] 请求超时，请确认云函数已部署`))
    }, timeoutMs)

    const request = {
      name,
      data,
      success: (res) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (!res || res.result === undefined) {
          reject(new Error(`[${name}] 云函数无返回，请重新部署`))
          return
        }
        resolve(res.result)
      },
      fail: (err) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(new Error(formatCloudError(name, err)))
      }
    }

    if (cloudConfig.envId) {
      request.config = { env: cloudConfig.envId }
    }

    wx.cloud.callFunction(request)
  })
}

function buildContentUrl(id) {
  const base = (cloudConfig.contentBaseUrl || '').replace(/\/$/, '')
  if (!base || !id) return null
  return `${base}?id=${encodeURIComponent(id)}`
}

function getCloudExt(item) {
  const path = item.filePath || item.content || item.name || ''
  const match = String(path).match(/\.([a-zA-Z0-9]+)$/)
  if (match) return match[1].toLowerCase()
  const defaults = { image: 'jpg', video: 'mp4', audio: 'mp3', file: 'bin' }
  return defaults[item.type] || 'bin'
}

function needsCloudUpload(path) {
  if (!path) return false
  const str = String(path)
  if (str.startsWith('cloud://')) return false
  if (isHttpUrl(str)) return false
  return true
}

function uploadMediaFile(filePath, item) {
  const ext = getCloudExt(item)
  const cloudPath = `combine/${item.type}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  return new Promise((resolve, reject) => {
    const options = {
      cloudPath,
      filePath,
      success: (res) => resolve(res.fileID),
      fail: (err) => reject(new Error(err.errMsg || '文件上传失败'))
    }
    if (cloudConfig.envId) {
      options.config = { env: cloudConfig.envId }
    }
    wx.cloud.uploadFile(options)
  })
}

/**
 * 组合码：先将图片/视频/音频/文件上传云存储，再生成 JSON
 */
function prepareCombineForCloud(items) {
  if (!items || !items.length) {
    return Promise.reject(new Error('请至少添加一项内容'))
  }

  let chain = Promise.resolve([])

  items.forEach((item) => {
    chain = chain.then((acc) => {
      if (item.type === 'text') {
        acc.push({
          type: 'text',
          name: item.name || '文字',
          content: item.content || ''
        })
        return acc
      }

      const localPath = item.filePath || item.content
      if (needsCloudUpload(localPath)) {
        return uploadMediaFile(localPath, item).then((fileID) => {
          acc.push({
            type: item.type,
            name: item.name || item.label || item.type,
            content: fileID,
            fileID
          })
          return acc
        })
      }

      acc.push({
        type: item.type,
        name: item.name || item.label || item.type,
        content: localPath,
        fileID: localPath.startsWith('cloud://') ? localPath : ''
      })
      return acc
    })
  })

  return chain.then((uploadedItems) => JSON.stringify({
    type: 'combine',
    version: 2,
    items: uploadedItems,
    createTime: new Date().toISOString()
  }))
}

/**
 * 收款码合并：先将收款码图片上传云存储，再生成 JSON
 */
function preparePaymentMergeForCloud(codes, layout, title) {
  if (!codes || codes.length < 2) {
    return Promise.reject(new Error('请至少添加两个收款码'))
  }

  let chain = Promise.resolve([])

  codes.forEach((code) => {
    chain = chain.then((acc) => {
      const localPath = code.path
      if (needsCloudUpload(localPath)) {
        return uploadMediaFile(localPath, { type: 'image', name: code.label }).then((fileID) => {
          acc.push({
            type: code.type,
            label: code.label,
            fileID
          })
          return acc
        })
      }

      acc.push({
        type: code.type,
        label: code.label,
        fileID: localPath.startsWith('cloud://') ? localPath : ''
      })
      return acc
    })
  })

  return chain.then((uploadedCodes) => JSON.stringify({
    type: 'payment-merge',
    title: title || '收款码合并',
    layout: layout || 'vertical',
    codes: uploadedCodes,
    createTime: new Date().toISOString()
  }))
}

function saveContent(content, title, type) {
  return callCloud('saveContent', { content, title: title || '', type: type || 'text' })
    .then((result) => {
      if (result.success && result.id) {
        return result
      }
      const err = new Error(result.errMsg || '[saveContent] 保存失败')
      err.hint = result.hint || '请在云开发控制台创建集合 qr_contents'
      throw err
    })
}

/**
 * 纯文本 → saveContent → HTTP 链接 → 方形二维码
 * 网址（http/https）直接生成二维码
 */
function prepareQrData(content, title, type) {
  const trimmed = String(content || '').trim()
  if (!trimmed) {
    return Promise.reject(new Error('内容不能为空'))
  }

  if (isHttpUrl(trimmed)) {
    return Promise.resolve({
      qrData: trimmed,
      rawContent: trimmed,
      isCloudLink: false,
      linkType: 'direct'
    })
  }

  if (!cloudConfig.contentBaseUrl) {
    return Promise.reject(new Error(
      '请先在 config/cloud.js 配置 contentBaseUrl\n\n' +
      '步骤：云开发控制台 → HTTP 访问服务 → 关联 getContent → 复制地址\n' +
      '详见 CLOUD_SETUP.md'
    ))
  }

  return saveContent(trimmed, title, type).then((saveResult) => {
    const httpUrl = buildContentUrl(saveResult.id)
    if (!httpUrl) {
      return Promise.reject(new Error('contentBaseUrl 配置无效，请检查 config/cloud.js'))
    }
    return {
      qrData: httpUrl,
      rawContent: trimmed,
      cloudId: saveResult.id,
      isCloudLink: true,
      linkType: 'http'
    }
  })
}

function navigateToResult(options) {
  const app = getApp()
  app.globalData.pendingResult = {
    qrData: options.qrData || '',
    rawContent: options.rawContent || '',
    isCloudLink: !!options.isCloudLink,
    linkType: options.linkType || '',
    cloudId: options.cloudId || ''
  }

  const title = encodeURIComponent(options.title || '二维码')
  const type = options.type || 'generate'
  const cloud = options.isCloudLink ? '&cloud=1' : ''
  const linkType = options.linkType ? `&linkType=${options.linkType}` : ''

  wx.navigateTo({
    url: `/pages/result/result?title=${title}&type=${type}${cloud}${linkType}`,
    fail: (err) => {
      wx.showModal({
        title: '跳转失败',
        content: (err && err.errMsg) || '无法打开结果页',
        showCancel: false
      })
    }
  })
}

function generateAndGo(content, title, type) {
  wx.showLoading({ title: '生成中...', mask: true })
  return prepareQrData(content, title, type)
    .then((result) => {
      wx.hideLoading()
      return result
    })
    .catch((err) => {
      wx.hideLoading()
      throw err
    })
}

module.exports = {
  isHttpUrl,
  isCloudReady,
  buildContentUrl,
  saveContent,
  prepareQrData,
  prepareCombineForCloud,
  preparePaymentMergeForCloud,
  navigateToResult,
  generateAndGo
}
