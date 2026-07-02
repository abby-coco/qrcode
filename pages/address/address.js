const { generateAddressUrl } = require('../../utils/util')
const { saveRecord } = require('../../utils/storage')

Page({
  data: {
    name: '',
    address: '',
    latitude: '',
    longitude: ''
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          name: res.name || res.address,
          address: res.address,
          latitude: String(res.latitude),
          longitude: String(res.longitude)
        })
      }
    })
  },

  generate() {
    const { name, address, latitude, longitude } = this.data
    if (!address.trim() && !name.trim()) {
      wx.showToast({ title: '请输入或选择地址', icon: 'none' })
      return
    }

    const url = generateAddressUrl({ name, address, latitude, longitude })
    saveRecord({
      type: 'address',
      title: name || address,
      content: url,
      qrData: url
    })

    wx.navigateTo({
      url: `/pages/result/result?data=${encodeURIComponent(url)}&title=${encodeURIComponent(name || '地址二维码')}&type=address`
    })
  }
})
