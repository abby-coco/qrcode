const { generateWiFiString } = require('../../utils/wifi')
const { saveRecord } = require('../../utils/storage')

Page({
  data: {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false,
    encryptions: ['WPA', 'WEP', 'nopass']
  },

  selectEncryption(e) {
    this.setData({ encryption: e.currentTarget.dataset.value })
  },

  toggleHidden(e) {
    this.setData({ hidden: e.detail.value })
  },

  generate() {
    const { ssid } = this.data
    if (!ssid.trim()) {
      wx.showToast({ title: '请输入 WiFi 名称', icon: 'none' })
      return
    }

    const wifiStr = generateWiFiString(this.data)
    saveRecord({
      type: 'wifi',
      title: ssid,
      content: wifiStr,
      qrData: wifiStr
    })

    wx.navigateTo({
      url: `/pages/result/result?data=${encodeURIComponent(wifiStr)}&title=${encodeURIComponent('WiFi: ' + ssid)}&type=wifi`
    })
  }
})
