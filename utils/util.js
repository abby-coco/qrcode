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

module.exports = {
  formatTime,
  truncate,
  validateUrl,
  generateCombinePayload,
  generateAddressGeo,
  generateAddressUrl,
  TYPE_LABELS
}
