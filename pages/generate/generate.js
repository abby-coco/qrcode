const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')
const { formatError } = require('../../utils/util')

Page({
  data: {
    content: '',
    maxLength: 300,
    mode: 'text',
    generating: false
  },

  onLoad(options) {
    if (options.mode) {
      this.setData({ mode: options.mode })
      wx.setNavigationBarTitle({
        title: options.mode === 'file' ? '文件二维码' : '生成二维码'
      })
    }
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  generate() {
    const content = (this.data.content || '').trim()
    if (!content) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    if (this.data.generating) return

    this.setData({ generating: true })

    cloud.generateAndGo(content, content.slice(0, 20), 'text')
      .then((result) => {
        this.setData({ generating: false })
        saveRecord({
          type: 'generate',
          title: content.slice(0, 20),
          content: result.rawContent,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title: result.isCloudLink ? '云链接二维码' : '静态二维码',
          type: 'generate',
          isCloudLink: result.isCloudLink,
          linkType: result.linkType,
          cloudId: result.cloudId
        })
      })
      .catch((err) => {
        this.setData({ generating: false })
        const hint = err.hint ? `\n\n${err.hint}` : ''
        wx.showModal({
          title: '生成失败',
          content: formatError(err, '请检查云开发配置') + hint,
          showCancel: false
        })
      })
  },

  goDecode() {
    wx.navigateTo({ url: '/pages/decode/decode' })
  },

  goBeautify() {
    wx.navigateTo({ url: '/pages/beautify/beautify' })
  }
})
