function formatTime(isoString) {
  const date = new Date(isoString)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function truncate(str, len = 30) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function isUselessMessage(value) {
  if (!value || typeof value !== 'string') return true
  const text = value.trim()
  return !text || text.includes('[object Object]')
}

function formatError(err, fallback = '操作失败') {
  if (err == null || err === '') return fallback
  if (typeof err === 'string') return isUselessMessage(err) ? fallback : err

  const candidates = [err.errMsg, err.message, err.msg, err.error, err.hint, err.reason]
  for (let i = 0; i < candidates.length; i += 1) {
    const c = candidates[i]
    if (!c) continue
    if (typeof c === 'string' && !isUselessMessage(c)) return c
    if (typeof c === 'object') {
      const nested = formatError(c, '')
      if (nested) return nested
    }
  }

  const code = err.errCode != null ? err.errCode : err.code
  if (code != null) return `${fallback} (code: ${code})`

  try {
    const json = JSON.stringify(err)
    if (json && json !== '{}') return json
  } catch (e) { /* ignore */ }

  return fallback
}

function toError(err, fallback = '操作失败') {
  if (err instanceof Error && !isUselessMessage(err.message)) return err
  const error = new Error(formatError(err, fallback))
  if (err && err.hint) error.hint = err.hint
  return error
}

function validateUrl(url) {
  return /^https?:\/\/.+/i.test(url)
}

function generateCombinePayload(items) {
  return JSON.stringify({
    type: 'combine',
    version: 1,
    items: items.map(item => ({
      type: item.type,
      name: item.name,
      content: item.content,
      filePath: item.filePath || ''
    })),
    createTime: new Date().toISOString()
  })
}

function generateAddressGeo(address) {
  const encoded = encodeURIComponent(address.name || address.address)
  return `geo:${address.latitude || 0},${address.longitude || 0}?q=${encoded}`
}

function generateAddressUrl(address) {
  if (address.latitude && address.longitude) {
    return `https://uri.amap.com/marker?position=${address.longitude},${address.latitude}&name=${encodeURIComponent(address.name || '')}`
  }
  return address.address || ''
}

const TYPE_LABELS = {
  generate: '生成',
  decode: '解析',
  combine: '组合码',
  image: '图片码',
  video: '视频码',
  url: '网址码',
  vcard: '名片码',
  wifi: 'WiFi码',
  address: '地址码',
  payment: '收款码',
  template: '模板码'
}

function buildContentPreview(content, extras = {}) {
  const { templateType, qrData } = extras

  if (!content) {
    if (qrData && /^https?:\/\//i.test(qrData)) return truncate(qrData, 40)
    return qrData || ''
  }

  try {
    const data = JSON.parse(content)
    if (data.type === 'combine' && Array.isArray(data.items)) {
      const labels = { image: '图片', video: '视频', audio: '音频', file: '文件', text: '文字' }
      const parts = data.items.map((item) => labels[item.type] || item.type)
      return `组合内容：${parts.join('、')}`
    }
    if (data.type === 'image') return `图片：${data.title || '图片二维码'}`
    if (data.type === 'video') return `视频：${data.title || '视频二维码'}`
    if (data.type === 'payment-merge') {
      const count = Array.isArray(data.codes) ? data.codes.length : 0
      return `收款码合并：${count} 个收款码`
    }
    if (data.type === 'template-form') {
      const { getTemplateConfig } = require('./template')
      const config = getTemplateConfig(data.templateType || templateType)
      if (data.description) return truncate(data.description, 40)
      return `${config.title} · 扫码填写`
    }
  } catch (e) {
    // plain text or other formats
  }

  if (content.includes('BEGIN:VCARD')) return '电子名片'
  if (/^https?:\/\//i.test(content)) return truncate(content, 40)
  return truncate(content, 40)
}

module.exports = {
  formatTime,
  truncate,
  formatError,
  toError,
  validateUrl,
  generateCombinePayload,
  generateAddressGeo,
  generateAddressUrl,
  TYPE_LABELS,
  buildContentPreview
}
