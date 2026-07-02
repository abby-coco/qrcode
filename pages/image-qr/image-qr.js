const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')

Page({
  data: {
    imagePath: '',
    title: '图片二维码',
    generating: false
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ imagePath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  generate() {
    const { imagePath, title } = this.data
    if (!imagePath) {
      wx.showToast({ title: '请选择图片', icon: 'none' })
      return
    }
    if (this.data.generating) return

    this.setData({ generating: true })
    wx.showLoading({ title: '上传图片中...', mask: true })

    cloud.prepareCombineForCloud([{
      type: 'image',
      name: title,
      content: imagePath,
      filePath: imagePath
    }])
      .then((payload) => cloud.generateAndGo(payload, title, 'image'))
      .then((result) => {
        this.setData({ generating: false })
        saveRecord({
          type: 'image',
          title,
          content: result.rawContent,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title,
          type: 'image',
          isCloudLink: result.isCloudLink,
          linkType: result.linkType,
          cloudId: result.cloudId
        })
      })
      .catch((err) => {
        this.setData({ generating: false })
        wx.showModal({
          title: '生成失败',
          content: (err && err.message) || '请检查云开发及 contentBaseUrl 配置',
          showCancel: false
        })
      })
  }
})
