const { generateVCard } = require('../../utils/vcard')
const { saveRecord } = require('../../utils/storage')

Page({
  data: {
    name: '',
    phone: '',
    email: '',
    company: '',
    title: '',
    address: '',
    website: '',
    note: ''
  },

  generate() {
    const { name, phone } = this.data
    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }

    const vcard = generateVCard(this.data)
    saveRecord({
      type: 'vcard',
      title: name,
      content: vcard,
      qrData: vcard
    })

    wx.navigateTo({
      url: `/pages/result/result?data=${encodeURIComponent(vcard)}&title=${encodeURIComponent(name + ' 的名片')}&type=vcard`
    })
  }
})
