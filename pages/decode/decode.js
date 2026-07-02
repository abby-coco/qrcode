const { saveRecord } = require('../../utils/storage')

Page({
  data: {
    result: '',
    history: []
  },

  scanCode() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        const result = res.result || ''
        this.setData({ result })
        saveRecord({
          type: 'decode',
          title: result.slice(0, 30),
          content: result,
          qrData: result
        })
        wx.showToast({ title: '解析成功', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '扫描取消', icon: 'none' })
      }
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '识别中...' })
        // 小程序无法直接解析图片中的二维码，需借助云函数或第三方 API
        // 此处提示用户使用扫码功能
        wx.hideLoading()
        wx.showModal({
          title: '提示',
          content: '图片识别功能需接入云函数或第三方 OCR 服务。当前请使用「扫码解析」功能。',
          showCancel: false
        })
      }
    })
  },

  copyResult() {
    if (!this.data.result) return
    wx.setClipboardData({
      data: this.data.result,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  openUrl() {
    const { result } = this.data
    if (/^https?:\/\//i.test(result)) {
      wx.setClipboardData({
        data: result,
        success: () => wx.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' })
      })
    }
  }
})
