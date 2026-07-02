const { saveRecord } = require('../../utils/storage')

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

    const payload = JSON.stringify({
      type: 'payment-merge',
      title,
      codes: codes.map(c => ({ type: c.type, label: c.label, path: c.path })),
      layout: this.data.layout
    })

    saveRecord({
      type: 'payment',
      title,
      content: payload,
      qrData: payload
    })

    wx.showModal({
      title: '收款码合并',
      content: '合并后的收款码图片已准备好。实际项目中可将多张图片合成为一张后生成二维码。当前已保存配置并生成跳转二维码。',
      showCancel: false,
      success: () => {
        wx.navigateTo({
          url: `/pages/result/result?data=${encodeURIComponent(payload)}&title=${encodeURIComponent(title)}&type=payment`
        })
      }
    })
  }
})
