const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')
const MEDIA_TYPES = [
  { type: 'text', icon: '📝', label: '文字', color: '#f0edff' },
  { type: 'image', icon: '🖼️', label: '图片', color: '#fff7ed' },
  { type: 'video', icon: '🎬', label: '视频', color: '#fce7f3' },
  { type: 'audio', icon: '🎵', label: '音频', color: '#ecfdf5' },
  { type: 'file', icon: '📁', label: '文件', color: '#eff6ff' }
]

Page({
  data: {
    mediaTypes: MEDIA_TYPES,
    items: [],
    title: '我的组合二维码'
  },

  onLoad() {
    const app = getApp()
    if (app.globalData.lastCombineItems.length) {
      this.setData({ items: app.globalData.lastCombineItems })
    }
  },

  addItem(e) {
    const type = e.currentTarget.dataset.type
    const typeInfo = MEDIA_TYPES.find(t => t.type === type)

    if (type === 'text') {
      this.addTextItem()
    } else if (type === 'image') {
      this.chooseMedia('image', typeInfo)
    } else if (type === 'video') {
      this.chooseMedia('video', typeInfo)
    } else if (type === 'audio') {
      this.chooseMedia('audio', typeInfo)
    } else if (type === 'file') {
      this.chooseFile(typeInfo)
    }
  },

  addTextItem() {
    wx.showModal({
      title: '添加文字',
      editable: true,
      placeholderText: '请输入文字内容',
      success: (res) => {
        if (res.confirm && res.content) {
          this.pushItem({ type: 'text', icon: '📝', label: '文字', name: '文字', content: res.content })
        }
      }
    })
  },

  chooseMedia(mediaType, typeInfo) {
    const sourceType = mediaType === 'image' ? ['album', 'camera'] : ['album']
    wx.chooseMedia({
      count: 1,
      mediaType: [mediaType],
      sourceType,
      success: (res) => {
        const file = res.tempFiles[0]
        this.pushItem({
          type: mediaType,
          icon: typeInfo.icon,
          label: typeInfo.label,
          name: `${typeInfo.label}${this.data.items.length + 1}`,
          content: file.tempFilePath,
          filePath: file.tempFilePath,
          size: file.size
        })
      }
    })
  },

  chooseFile(typeInfo) {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        this.pushItem({
          type: 'file',
          icon: typeInfo.icon,
          label: typeInfo.label,
          name: file.name,
          content: file.path,
          filePath: file.path,
          size: file.size
        })
      }
    })
  },

  pushItem(item) {
    const items = [...this.data.items, { ...item, id: Date.now() }]
    this.setData({ items })
  },

  removeItem(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ items: this.data.items.filter(item => item.id !== id) })
  },

  moveUp(e) {
    const index = e.currentTarget.dataset.index
    if (index <= 0) return
    const items = [...this.data.items]
    ;[items[index - 1], items[index]] = [items[index], items[index - 1]]
    this.setData({ items })
  },

  generate() {
    const { items, title } = this.data
    if (!items.length) {
      wx.showToast({ title: '请至少添加一项内容', icon: 'none' })
      return
    }

    getApp().globalData.lastCombineItems = items
    wx.showLoading({ title: '上传媒体中...', mask: true })

    cloud.prepareCombineForCloud(items)
      .then((payload) => cloud.generateAndGo(payload, title, 'combine'))
      .then((result) => {
        saveRecord({
          type: 'combine',
          title,
          content: result.rawContent,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title,
          type: 'combine',
          isCloudLink: result.isCloudLink,
          linkType: result.linkType,
          cloudId: result.cloudId
        })
      })
      .catch((err) => {
        wx.showModal({
          title: '生成失败',
          content: err.message || '请检查云开发、云存储及 contentBaseUrl 配置',
          showCancel: false
        })
      })
  }
})
