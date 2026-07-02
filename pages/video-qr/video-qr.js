const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')

Page({
  data: {
    videoPath: '',
    title: '视频二维码',
    mode: 'single',
    generating: false
  },

  chooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({ videoPath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  selectMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode })
  },

  generate() {
    const { videoPath, title } = this.data
    if (!videoPath) {
      wx.showToast({ title: '请选择视频', icon: 'none' })
      return
    }
    if (this.data.generating) return

    this.setData({ generating: true })
    wx.showLoading({ title: '上传视频中...', mask: true })

    cloud.prepareCombineForCloud([{
      type: 'video',
      name: title,
      content: videoPath,
      filePath: videoPath
    }])
      .then((payload) => cloud.generateAndGo(payload, title, 'video'))
      .then((result) => {
        this.setData({ generating: false })
        saveRecord({
          type: 'video',
          title,
          content: result.rawContent,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title,
          type: 'video',
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
  },

  goDecode() {
    wx.navigateTo({ url: '/pages/decode/decode' })
  }
})
