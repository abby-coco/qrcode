const { getHistory, deleteRecord, clearHistory } = require('../../utils/storage')
const { formatTime, truncate, TYPE_LABELS } = require('../../utils/util')

Page({
  data: {
    history: [],
    filter: 'all',
    filters: [
      { value: 'all', label: '全部' },
      { value: 'generate', label: '生成' },
      { value: 'decode', label: '解析' },
      { value: 'combine', label: '组合' }
    ]
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    let history = getHistory()
    const { filter } = this.data
    if (filter !== 'all') {
      history = history.filter(item => item.type === filter)
    }
    history = history.map(item => ({
      ...item,
      typeLabel: TYPE_LABELS[item.type] || item.type,
      timeStr: formatTime(item.createTime),
      preview: truncate(item.content, 40)
    }))
    this.setData({ history })
  },

  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.value }, () => this.loadHistory())
  },

  viewItem(e) {
    const item = this.data.history[e.currentTarget.dataset.index]
    const app = getApp()
    app.globalData.pendingResult = {
      qrData: item.qrData || item.content,
      rawContent: item.content || '',
      isCloudLink: /^https?:\/\//i.test(item.qrData || ''),
      cloudId: ''
    }
    const isCloud = app.globalData.pendingResult.isCloudLink
    wx.navigateTo({
      url: `/pages/result/result?title=${encodeURIComponent(item.title)}&type=${item.type}${isCloud ? '&cloud=1' : ''}`
    })
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          deleteRecord(id)
          this.loadHistory()
        }
      }
    })
  },

  clearAll() {
    wx.showModal({
      title: '清空记录',
      content: '确定清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          clearHistory()
          this.loadHistory()
        }
      }
    })
  }
})
