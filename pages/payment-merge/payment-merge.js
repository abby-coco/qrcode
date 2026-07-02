const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')

Page({
  data: {
    codes: [],
    layout: 'vertical',
    title: '收款码合并'
  },

  addWechatCode() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const codes = [...this.data.codes, {
          id: Date.now(),
          type: 'wechat',
          label: '微信收款',
          icon: '💚',
          path: res.tempFiles[0].tempFilePath
        }]
        this.setData({ codes })
      }
    })
  },

  addAlipayCode() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const codes = [...this.data.codes, {
          id: Date.now(),
          type: 'alipay',
          label: '支付宝收款',
          icon: '💙',
          path: res.tempFiles[0].tempFilePath
        }]
        this.setData({ codes })
      }
    })
  },

  removeCode(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ codes: this.data.codes.filter(c => c.id !== id) })
  },

  selectLayout(e) {
    this.setData({ layout: e.currentTarget.dataset.layout })
  },

  generate() {
    const { codes, title } = this.data
    if (codes.length < 2) {
      wx.showToast({ title: '请至少添加两个收款码', icon: 'none' })
      return
    }

    wx.showLoading({ title: '上传收款码...', mask: true })

    cloud.preparePaymentMergeForCloud(codes, this.data.layout, title)
      .then((payload) => cloud.generateAndGo(payload, title, 'payment'))
      .then((result) => {
        saveRecord({
          type: 'payment',
          title,
          content: result.rawContent,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title,
          type: 'payment',
          isCloudLink: result.isCloudLink,
          linkType: result.linkType,
          cloudId: result.cloudId
        })
      })
      .catch((err) => {
        wx.hideLoading()
        wx.showModal({
          title: '生成失败',
          content: err.message || '请检查云开发、云存储及 contentBaseUrl 配置',
          showCancel: false
        })
      })
  }
})
