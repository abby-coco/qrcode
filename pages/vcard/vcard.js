const { generateVCard } = require('../../utils/vcard')
const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')

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
    const cardTitle = `${name} 的名片`

    cloud.generateAndGo(vcard, cardTitle, 'vcard')
      .then((result) => {
        saveRecord({
          type: 'vcard',
          title: name,
          content: vcard,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: vcard,
          title: cardTitle,
          type: 'vcard',
          isCloudLink: result.isCloudLink,
          linkType: result.linkType,
          cloudId: result.cloudId
        })
      })
      .catch((err) => {
        wx.showModal({
          title: '生成失败',
          content: err.message || '请检查云开发及 contentBaseUrl 配置',
          showCancel: false
        })
      })
  }
})
