const HISTORY_KEY = 'qr_history'
const MAX_HISTORY = 100

function getHistory() {
  return wx.getStorageSync(HISTORY_KEY) || []
}

function saveRecord(record) {
  const history = getHistory()
  const item = {
    id: Date.now().toString(),
    type: record.type || 'generate',
    title: record.title || '未命名',
    content: record.content || '',
    qrData: record.qrData || '',
    beautify: record.beautify || null,
    createTime: new Date().toISOString(),
    ...record
  }
  history.unshift(item)
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY
  }
  wx.setStorageSync(HISTORY_KEY, history)
  return item
}

function deleteRecord(id) {
  const history = getHistory().filter(item => item.id !== id)
  wx.setStorageSync(HISTORY_KEY, history)
}

function clearHistory(type) {
  if (type) {
    const history = getHistory().filter(item => item.type !== type)
    wx.setStorageSync(HISTORY_KEY, history)
  } else {
    wx.removeStorageSync(HISTORY_KEY)
  }
}

function getRecordsByType(type) {
  return getHistory().filter(item => item.type === type)
}

module.exports = {
  getHistory,
  saveRecord,
  deleteRecord,
  clearHistory,
  getRecordsByType
}
