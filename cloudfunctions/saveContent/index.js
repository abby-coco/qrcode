const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const RISKY_CONTENT_MSG = '所发布内容含违规信息'
const TEXT_CHECK_SCENE = 2
const TEXT_CHECK_CHUNK_SIZE = 2500

function getCheckResult(res) {
  if (!res) return {}
  return res.result || res
}

function isRiskyCheckResult(res) {
  const result = getCheckResult(res)
  const errCode = result.errCode != null ? result.errCode : result.errcode
  return errCode === 87014 || result.suggest === 'risky'
}

function isSecurityApiUnavailable(err) {
  const msg = err && (err.message || err.errMsg || String(err))
  const code = err && (err.errCode || err.errcode || err.code)
  return code === 40001 ||
    code === 48001 ||
    code === 45009 ||
    /api unauthorized|not authorized|invalid credential|access_token/i.test(msg || '')
}

async function checkText(text, openid) {
  const content = String(text || '').trim()
  if (!content) return

  if (content.length > TEXT_CHECK_CHUNK_SIZE) {
    for (let i = 0; i < content.length; i += TEXT_CHECK_CHUNK_SIZE) {
      await checkText(content.slice(i, i + TEXT_CHECK_CHUNK_SIZE), openid)
    }
    return
  }

  try {
    const res = await cloud.openapi.security.msgSecCheck({
      content,
      version: 2,
      scene: TEXT_CHECK_SCENE,
      openid
    })
    if (isRiskyCheckResult(res)) {
      const err = new Error(RISKY_CONTENT_MSG)
      err.isContentRisk = true
      throw err
    }
  } catch (err) {
    if (err && (err.isContentRisk || err.errCode === 87014 || err.errcode === 87014)) {
      const riskErr = new Error(RISKY_CONTENT_MSG)
      riskErr.isContentRisk = true
      throw riskErr
    }
    if (isSecurityApiUnavailable(err)) {
      err.hint = '请在微信公众平台确认内容安全接口权限，并重新部署 saveContent 云函数'
    }
    throw err
  }
}

async function checkImage(fileID) {
  const id = String(fileID || '').trim()
  if (!id || !id.startsWith('cloud://')) return

  try {
    const file = await cloud.downloadFile({ fileID: id })
    const res = await cloud.openapi.security.imgSecCheck({
      media: file.fileContent
    })
    if (isRiskyCheckResult(res)) {
      const err = new Error(RISKY_CONTENT_MSG)
      err.isContentRisk = true
      throw err
    }
  } catch (err) {
    if (err && (err.isContentRisk || err.errCode === 87014 || err.errcode === 87014)) {
      const riskErr = new Error(RISKY_CONTENT_MSG)
      riskErr.isContentRisk = true
      throw riskErr
    }
    if (isSecurityApiUnavailable(err)) {
      err.hint = '请在微信公众平台确认内容安全接口权限，并重新部署 saveContent 云函数'
    }
    throw err
  }
}

function parseContent(content) {
  try {
    return JSON.parse(content)
  } catch (e) {
    return null
  }
}

function collectSecurityTargets(content, title) {
  const targets = {
    texts: [title],
    images: []
  }
  const parsed = parseContent(content)

  if (!parsed || typeof parsed !== 'object') {
    targets.texts.push(content)
    return targets
  }

  if (parsed.title) targets.texts.push(parsed.title)
  if (parsed.description) targets.texts.push(parsed.description)
  if (parsed.type === 'image') targets.images.push(parsed.fileID || parsed.content)

  if (parsed.type === 'combine' && Array.isArray(parsed.items)) {
    parsed.items.forEach((item) => {
      if (!item) return
      if (item.name) targets.texts.push(item.name)
      if (item.type === 'text' && item.content) targets.texts.push(item.content)
      if (item.type === 'image') targets.images.push(item.fileID || item.content)
    })
  }

  if (parsed.type === 'payment-merge' && Array.isArray(parsed.codes)) {
    parsed.codes.forEach((code) => {
      if (!code) return
      if (code.label) targets.texts.push(code.label)
      if (code.fileID) targets.images.push(code.fileID)
    })
  }

  return targets
}

async function checkContentSecurity(content, title) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const targets = collectSecurityTargets(content, title)

  const uniqueTexts = Array.from(new Set(targets.texts.map((text) => String(text || '').trim()).filter(Boolean)))
  for (let i = 0; i < uniqueTexts.length; i += 1) {
    await checkText(uniqueTexts[i], openid)
  }

  const uniqueImages = Array.from(new Set(targets.images.map((id) => String(id || '').trim()).filter(Boolean)))
  for (let i = 0; i < uniqueImages.length; i += 1) {
    await checkImage(uniqueImages[i])
  }
}

exports.main = async (event) => {
  try {
    const { content, title, type } = event || {}

    if (!content || !String(content).trim()) {
      return { success: false, errMsg: '内容不能为空' }
    }

    if (String(content).length > 50000) {
      return { success: false, errMsg: '内容过长，请控制在 50000 字以内' }
    }

    await checkContentSecurity(String(content), title || '')

    const res = await db.collection('qr_contents').add({
      data: {
        content: String(content),
        title: title || '',
        type: type || 'text',
        createTime: db.serverDate()
      }
    })

    return { success: true, id: res._id }
  } catch (err) {
    const errMsg = err.message || err.errMsg || '保存失败'
    let hint = ''

    if (err && err.isContentRisk) {
      return { success: false, errMsg: RISKY_CONTENT_MSG, errCode: 87014 }
    }

    if (errMsg.includes('collection not exists') || errMsg.includes('DATABASE_COLLECTION_NOT_EXIST') || err.code === -502005) {
      hint = '请在云开发控制台 → 数据库 → 新建集合 qr_contents'
    } else if (errMsg.includes('wx-server-sdk') || errMsg.includes('Cannot find module')) {
      hint = '请重新部署 saveContent，选择“上传并部署：云端安装依赖”'
    } else if (err && err.hint) {
      hint = err.hint
    }

    return { success: false, errMsg, hint, errCode: err.code || err.errCode }
  }
}
