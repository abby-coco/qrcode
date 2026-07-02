const { validateUrl } = require('../../utils/util')
const { saveRecord } = require('../../utils/storage')

Page({
  data: {
    url: '',
    title: '网址二维码'
  },

  generate() {
    let { url, title } = this.data
    url = url.trim()
    if (!url) {
      wx.showToast({ title: '请输入网址', icon: 'none' })
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }

    saveRecord({ type: 'url', title, content: url, qrData: url })

    wx.navigateTo({
      url: `/pages/result/result?data=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&type=url`
    })
  }
})
