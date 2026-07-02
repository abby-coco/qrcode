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

function parsePaymentMergeContent(content) {
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content
    if (data && data.type === 'payment-merge' && Array.isArray(data.codes)) {
      return data
    }
  } catch (e) {
    // not payment merge json
  }
  return null
}

function parseVCard(content) {
  const text = String(content || '')
  if (!text.includes('BEGIN:VCARD')) return null

  const fields = {}
  text.split(/\r?\n/).forEach((line) => {
    if (!line || line === 'BEGIN:VCARD' || line === 'END:VCARD') return
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).split(';')[0].toUpperCase()
    const value = line.slice(idx + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';')
    if (key === 'FN') fields.name = value
    if (key === 'TEL') fields.phone = value
    if (key === 'EMAIL') fields.email = value
    if (key === 'ORG') fields.company = value
    if (key === 'TITLE') fields.jobTitle = value
    if (key === 'URL') fields.website = value
    if (key === 'NOTE') fields.note = value
    if (key === 'ADR') fields.address = value.split(';').filter(Boolean).pop() || value
  })

  return fields.name || fields.phone ? fields : null
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
    .contact-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .contact-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: #f8f9fc;
      border-radius: 12px;
    }
    .contact-label {
      flex: 0 0 56px;
      font-size: 14px;
      color: #888;
    }
    .contact-value, .contact-link {
      flex: 1;
      font-size: 16px;
      color: #333;
      word-break: break-all;
      text-decoration: none;
    }
    .contact-link { color: #7c6cf0; }
    .payment-grid {
      display: flex;
      gap: 16px;
    }
    .payment-grid--vertical {
      flex-direction: column;
    }
    .payment-grid--horizontal {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .payment-card {
      flex: 1;
      min-width: 140px;
      background: #f8f9fc;
      border-radius: 16px;
      padding: 16px;
      text-align: center;
    }
    .payment-badge {
      display: inline-block;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 10px;
      color: #fff;
    }
    .payment-badge--wechat { background: #22c55e; }
    .payment-badge--alipay { background: #3b82f6; }
    .payment-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }
    .payment-img {
      width: 100%;
      max-width: 220px;
      border-radius: 12px;
      background: #fff;
    }
    .payment-tip {
      margin-top: 20px;
      font-size: 13px;
      color: #999;
      text-align: center;
    }
    .form-desc {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
      padding: 12px 14px;
      background: #f8f9fc;
      border-radius: 12px;
    }
    .submit-form { display: flex; flex-direction: column; gap: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 8px; }
    .form-label { font-size: 14px; color: #666; }
    .form-input, .form-textarea {
      width: 100%; box-sizing: border-box; border: 1px solid #e8e8ef;
      border-radius: 12px; padding: 12px 14px; font-size: 16px; background: #fff; color: #333;
    }
    .form-textarea { min-height: 96px; resize: vertical; }
    .submit-btn {
      margin-top: 8px; border: none; border-radius: 999px; padding: 14px 0;
      font-size: 16px; font-weight: 600; color: #fff;
      background: linear-gradient(135deg, #7c6cf0, #a78bfa);
    }
    .form-msg { text-align: center; font-size: 14px; color: #888; min-height: 20px; }
    .form-msg--error { color: #ef4444; }
    .success-icon { font-size: 48px; text-align: center; margin: 12px 0; }
    .success-text { text-align: center; color: #666; line-height: 1.6; font-size: 16px; }
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

function buildVCardHtml(title, contact) {
  const rows = []
  if (contact.name) rows.push(`<div class="contact-row"><span class="contact-label">姓名</span><span class="contact-value">${escapeHtml(contact.name)}</span></div>`)
  if (contact.phone) rows.push(`<div class="contact-row"><span class="contact-label">手机</span><a class="contact-link" href="tel:${escapeAttr(contact.phone)}">${escapeHtml(contact.phone)}</a></div>`)
  if (contact.email) rows.push(`<div class="contact-row"><span class="contact-label">邮箱</span><a class="contact-link" href="mailto:${escapeAttr(contact.email)}">${escapeHtml(contact.email)}</a></div>`)
  if (contact.company) rows.push(`<div class="contact-row"><span class="contact-label">公司</span><span class="contact-value">${escapeHtml(contact.company)}</span></div>`)
  if (contact.jobTitle) rows.push(`<div class="contact-row"><span class="contact-label">职位</span><span class="contact-value">${escapeHtml(contact.jobTitle)}</span></div>`)
  if (contact.address) rows.push(`<div class="contact-row"><span class="contact-label">地址</span><span class="contact-value">${escapeHtml(contact.address)}</span></div>`)
  if (contact.website) rows.push(`<div class="contact-row"><span class="contact-label">网站</span><a class="contact-link" href="${escapeAttr(contact.website)}" target="_blank" rel="noopener">${escapeHtml(contact.website)}</a></div>`)
  if (contact.note) rows.push(`<div class="contact-row"><span class="contact-label">备注</span><span class="contact-value">${escapeHtml(contact.note)}</span></div>`)

  const bodyHtml = `<div class="contact-card">${rows.join('')}</div>`
  return wrapPageHtml(title, bodyHtml, '电子名片')
}

async function buildPaymentMergeHtml(title, mergeData) {
  const items = mergeData.codes.map((code) => ({
    type: 'image',
    name: code.label,
    fileID: code.fileID,
    content: code.fileID
  }))
  const urlMap = await resolveFileUrls(items)
  const layoutClass = mergeData.layout === 'horizontal' ? 'payment-grid--horizontal' : 'payment-grid--vertical'
  const cardsHtml = mergeData.codes.map((code) => {
    const url = urlMap[code.fileID] || ''
    const label = escapeHtml(code.label || (code.type === 'wechat' ? '微信收款' : '支付宝收款'))
    const badgeClass = code.type === 'wechat' ? 'payment-badge--wechat' : 'payment-badge--alipay'
    const badgeText = code.type === 'wechat' ? '微信' : '支付宝'
    if (!url) {
      return `<div class="payment-card"><div class="payment-badge ${badgeClass}">${badgeText}</div><p class="item-missing">${label} 无法加载</p></div>`
    }
    return `<div class="payment-card"><div class="payment-badge ${badgeClass}">${badgeText}</div><div class="payment-label">${label}</div><img class="payment-img" src="${escapeAttr(url)}" alt="${label}"/></div>`
  }).join('')

  const bodyHtml = `<div class="payment-grid ${layoutClass}">${cardsHtml}</div><p class="payment-tip">长按收款码图片可识别或保存</p>`
  return wrapPageHtml(title || mergeData.title || '收款码合并', bodyHtml, '收款码合并')
}

async function resolveCombineItems(items) {
  const urlMap = await resolveFileUrls(items)
  return items.map((item) => ({
    ...item,
    url: getItemUrl(item, urlMap)
  }))
}

function parseTemplateForm(content) {
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content
    if (data && data.type === 'template-form' && Array.isArray(data.fields)) {
      return data
    }
  } catch (e) {
    // not template form
  }
  return null
}

function parsePostBody(event) {
  let body = event.body || ''
  if (event.isBase64Encoded && body) {
    body = Buffer.from(body, 'base64').toString('utf8')
  }
  if (!body) return {}
  try {
    return JSON.parse(body)
  } catch (e) {
    const params = {}
    body.split('&').forEach((pair) => {
      const idx = pair.indexOf('=')
      if (idx === -1) return
      const key = decodeURIComponent(pair.slice(0, idx).replace(/\+/g, ' '))
      const value = decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '))
      params[key] = value
    })
    return params
  }
}

function buildTemplateFormHtml(templateId, templateData, docTitle, errorMsg) {
  const title = escapeHtml(templateData.title || docTitle || '表单填写')
  const desc = templateData.description
    ? `<p class="form-desc">${escapeHtml(templateData.description)}</p>`
    : ''
  const errorHtml = errorMsg
    ? `<p class="form-msg form-msg--error">${escapeHtml(errorMsg)}</p>`
    : ''
  const fieldsHtml = templateData.fields.map((field) => {
    const label = escapeHtml(field.label || field.key)
    const required = field.required ? ' required' : ''
    const name = escapeAttr(field.key)
    if (field.inputType === 'textarea') {
      return `<label class="form-field"><span class="form-label">${label}${field.required ? ' *' : ''}</span><textarea class="form-textarea" name="${name}"${required} placeholder="请输入${label}"></textarea></label>`
    }
    const inputType = field.key === 'phone' ? 'tel' : field.key === 'email' ? 'email' : 'text'
    return `<label class="form-field"><span class="form-label">${label}${field.required ? ' *' : ''}</span><input class="form-input" type="${inputType}" name="${name}"${required} placeholder="请输入${label}"/></label>`
  }).join('')

  const bodyHtml = `${desc}${errorHtml}<form class="submit-form" method="POST" action="?id=${escapeAttr(templateId)}">
<input type="hidden" name="action" value="submit"/>
<input type="hidden" name="templateId" value="${escapeAttr(templateId)}"/>
${fieldsHtml}
<button type="submit" class="submit-btn">提交</button>
</form>`

  return wrapPageHtml(title, bodyHtml, '表单填写')
}

function buildSubmitSuccessHtml(title) {
  const safeTitle = escapeHtml(title || '表单')
  return wrapPageHtml('提交成功', `<div class="success-icon">✅</div><p class="success-text">${safeTitle} 已提交成功<br/>感谢你的填写！</p>`, '提交成功')
}

function extractSubmitData(payload, templateData) {
  if (payload.data && typeof payload.data === 'object') {
    return payload.data
  }

  const submitData = {}
  const reserved = { action: 1, templateId: 1, data: 1, id: 1 }
  Object.keys(payload || {}).forEach((key) => {
    if (!reserved[key]) submitData[key] = payload[key]
  })

  if (templateData && Array.isArray(templateData.fields)) {
    templateData.fields.forEach((field) => {
      if (payload[field.key] !== undefined && submitData[field.key] === undefined) {
        submitData[field.key] = payload[field.key]
      }
    })
  }

  return submitData
}

function getHttpId(event, payload) {
  return (event.queryStringParameters && event.queryStringParameters.id)
    || payload.templateId
    || payload.id
    || event.id
    || ''
}

function isHttpPost(event) {
  return String(event.httpMethod || '').toUpperCase() === 'POST'
}

async function handleTemplateSubmit(templateId, payload) {
  const doc = await db.collection('qr_contents').doc(templateId).get()
  const templateData = parseTemplateForm(doc.data.content)
  if (!templateData) {
    return { success: false, errMsg: '模板不存在或已失效' }
  }

  const submitData = extractSubmitData(payload, templateData)
  for (const field of templateData.fields) {
    if (field.required && !String(submitData[field.key] || '').trim()) {
      return { success: false, errMsg: `请填写${field.label}`, templateData }
    }
  }

  try {
    await db.collection('qr_submissions').add({
      data: {
        templateId,
        templateType: templateData.templateType || '',
        templateTitle: templateData.title || doc.data.title || '',
        data: submitData,
        submitTime: db.serverDate()
      }
    })
  } catch (err) {
    const errMsg = err.message || err.errMsg || '保存失败'
    if (errMsg.includes('collection not exists') || errMsg.includes('DATABASE_COLLECTION_NOT_EXIST') || err.code === -502005) {
      return {
        success: false,
        errMsg: '提交失败：请先在云开发控制台创建集合 qr_submissions',
        templateData
      }
    }
    throw err
  }

  return { success: true, title: templateData.title || doc.data.title || '表单' }
}

exports.main = async (event) => {
  const isHttp = !!(event.httpMethod || event.queryStringParameters)
  const postPayload = isHttpPost(event) ? parsePostBody(event) : {}
  const id = getHttpId(event, postPayload)

  if (isHttp && isHttpPost(event)) {
    try {
      if (postPayload.action === 'submit' && id) {
        const result = await handleTemplateSubmit(id, postPayload)
        if (!result.success) {
          if (result.templateData) {
            const doc = await db.collection('qr_contents').doc(id).get()
            return {
              statusCode: 400,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              body: buildTemplateFormHtml(id, result.templateData, doc.data.title, result.errMsg)
            }
          }
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            body: `<h3>${escapeHtml(result.errMsg || '提交失败')}</h3>`
          }
        }
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          body: buildSubmitSuccessHtml(result.title)
        }
      }
      if (!id) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          body: '<h3>缺少内容 ID</h3>'
        }
      }
    } catch (err) {
      const errMsg = err.message || err.errMsg || '提交失败，请稍后重试'
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: `<h3>${escapeHtml(errMsg)}</h3>`
      }
    }
  }

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
    const paymentData = parsePaymentMergeContent(content)
    const vcardData = parseVCard(content)
    const templateData = parseTemplateForm(content)

    if (isHttp) {
      let body
      if (templateData) {
        body = buildTemplateFormHtml(id, templateData, title)
      } else if (combineData) {
        body = await buildCombineHtml(title, combineData)
      } else if (paymentData) {
        body = await buildPaymentMergeHtml(title, paymentData)
      } else if (vcardData) {
        body = buildVCardHtml(title, vcardData)
      } else {
        body = buildPlainHtml(title, content)
      }
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
