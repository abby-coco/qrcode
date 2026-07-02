const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>')
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;')
}

function isHttpUrl(str) {
  return /^https?:\/\/.+/i.test(String(str || ''))
}

function parseCombineContent(content) {
  try {
    const data = JSON.parse(content)
    if (data && data.type === 'combine' && Array.isArray(data.items)) {
      return data
    }
  } catch (e) {
    // not combine json
  }
  return null
}

async function resolveFileUrls(items) {
  const fileIDs = items
    .map((item) => item.fileID || item.content)
    .filter((id) => id && String(id).startsWith('cloud://'))

  const urlMap = {}
  if (!fileIDs.length) return urlMap

  const unique = [...new Set(fileIDs)]
  const res = await cloud.getTempFileURL({ fileList: unique })
  ;(res.fileList || []).forEach((file) => {
    if (file.fileID && file.tempFileURL) {
      urlMap[file.fileID] = file.tempFileURL
    }
  })
  return urlMap
}

function getItemUrl(item, urlMap) {
  const id = item.fileID || item.content
  if (id && urlMap[id]) return urlMap[id]
  if (isHttpUrl(id)) return id
  return ''
}

function buildItemHtml(item, urlMap) {
  const name = escapeHtml(item.name || '')
  const url = getItemUrl(item, urlMap)

  switch (item.type) {
    case 'image':
      if (url) {
        return `<section class="item"><div class="item-name">${name || '图片'}</div><img class="media-img" src="${escapeAttr(url)}" alt="${name}"/></section>`
      }
      return `<section class="item"><div class="item-name">${name || '图片'}</div><p class="item-missing">图片无法加载（请重新生成并上传）</p></section>`
    case 'video':
      if (url) {
        return `<section class="item"><div class="item-name">${name || '视频'}</div><video class="media-video" src="${escapeAttr(url)}" controls playsinline></video></section>`
      }
      return `<section class="item"><div class="item-name">${name || '视频'}</div><p class="item-missing">视频无法加载</p></section>`
    case 'audio':
      if (url) {
        return `<section class="item"><div class="item-name">${name || '音频'}</div><audio class="media-audio" src="${escapeAttr(url)}" controls></audio></section>`
      }
      return `<section class="item"><div class="item-name">${name || '音频'}</div><p class="item-missing">音频无法加载</p></section>`
    case 'file':
      if (url) {
        return `<section class="item"><div class="item-name">${name || '文件'}</div><a class="file-link" href="${escapeAttr(url)}" target="_blank" rel="noopener">点击下载文件</a></section>`
      }
      return `<section class="item"><div class="item-name">${name || '文件'}</div><p class="item-missing">文件无法加载</p></section>`
    case 'text':
    default:
      return `<section class="item"><div class="item-name">${name || '文字'}</div><div class="text-block">${escapeHtml(item.content || '')}</div></section>`
  }
}

function wrapPageHtml(title, bodyHtml, badgeLabel) {
  const safeTitle = escapeHtml(title || '二维码内容')
  const badge = escapeHtml(badgeLabel || '组合内容')
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
      background: linear-gradient(160deg, #f5f3ff 0%, #fafafa 50%, #f0fdf4 100%);
      min-height: 100vh;
      padding: 32px 20px;
      color: #1a1a1a;
    }
    .card {
      max-width: 480px;
      margin: 0 auto;
      background: #fff;
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: 0 8px 32px rgba(124, 108, 240, 0.12);
    }
    .badge {
      display: inline-block;
      font-size: 12px;
      color: #7c6cf0;
      background: #f0edff;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .item { margin-bottom: 24px; }
    .item:last-child { margin-bottom: 0; }
    .item-name {
      font-size: 13px;
      color: #888;
      margin-bottom: 10px;
    }
    .text-block, .content {
      font-size: 16px;
      line-height: 1.8;
      color: #333;
      word-break: break-all;
      white-space: pre-wrap;
      background: #f8f9fc;
      border-radius: 12px;
      padding: 16px;
    }
    .media-img {
      display: block;
      width: 100%;
      max-width: 100%;
      border-radius: 12px;
      background: #f8f9fc;
    }
    .media-video, .media-audio {
      width: 100%;
      border-radius: 12px;
    }
    .file-link {
      display: inline-block;
      color: #7c6cf0;
      font-size: 16px;
      text-decoration: none;
      padding: 12px 16px;
      background: #f0edff;
      border-radius: 12px;
    }
    .item-missing {
      color: #999;
      font-size: 14px;
      padding: 12px;
      background: #f8f9fc;
      border-radius: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">二维码工具 · ${badge}</div>
    <h1>${safeTitle}</h1>
    ${bodyHtml}
  </div>
  <p class="footer">由云开发提供内容托管</p>
</body>
</html>`
}

function buildPlainHtml(title, content) {
  const safeContent = escapeHtml(content || '')
  return wrapPageHtml(title, `<div class="content">${safeContent}</div>`, '云内容')
}

async function buildCombineHtml(title, combineData) {
  const urlMap = await resolveFileUrls(combineData.items)
  const itemsHtml = combineData.items.map((item) => buildItemHtml(item, urlMap)).join('')
  return wrapPageHtml(title, itemsHtml)
}

async function resolveCombineItems(items) {
  const urlMap = await resolveFileUrls(items)
  return items.map((item) => ({
    ...item,
    url: getItemUrl(item, urlMap)
  }))
}

exports.main = async (event) => {
  const id = event.id || (event.queryStringParameters && event.queryStringParameters.id)
  const isHttp = !!(event.httpMethod || event.queryStringParameters)

  if (!id) {
    if (isHttp) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: '<h3>缺少内容 ID</h3>'
      }
    }
    return { success: false, errMsg: '缺少 id' }
  }

  try {
    const doc = await db.collection('qr_contents').doc(id).get()
    const { content, title } = doc.data
    const combineData = parseCombineContent(content)

    if (isHttp) {
      const body = combineData
        ? await buildCombineHtml(title, combineData)
        : buildPlainHtml(title, content)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body
      }
    }

    if (combineData) {
      const items = await resolveCombineItems(combineData.items)
      return {
        success: true,
        title: title || '组合内容',
        contentType: 'combine',
        items,
        content,
        id
      }
    }

    return { success: true, content, title, contentType: 'text', id }
  } catch (err) {
    if (isHttp) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: '<h3>内容不存在或已删除</h3>'
      }
    }
    return { success: false, errMsg: '内容不存在' }
  }
}
