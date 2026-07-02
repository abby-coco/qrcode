Page({
  data: {
    quickEntries: [
      { icon: '🔍', label: '解码解析', bgColor: '#fef3c7', url: '/pages/decode/decode' },
      { icon: '👤', label: '名片二维码', bgColor: '#f0edff', url: '/pages/vcard/vcard' },
      { icon: '📶', label: 'WiFi二维码', bgColor: '#ecfdf5', url: '/pages/wifi/wifi' },
      { icon: '📋', label: '历史记录', bgColor: '#fce7f3', url: '/pages/history/history' }
    ],
    templates: [
      { icon: '🎉', title: '活动报名', desc: '快速创建活动报名表单二维码', bgColor: '#fef3c7', type: 'registration' },
      { icon: '✅', title: '签到打卡', desc: '活动现场扫码签到', bgColor: '#ecfdf5', type: 'checkin' },
      { icon: '💬', title: '意见反馈', desc: '收集用户意见和建议', bgColor: '#eff6ff', type: 'feedback' }
    ]
  },

  goCombine() {
    wx.navigateTo({ url: '/pages/combine/combine' })
  },

  goGenerate(e) {
    const type = e && e.currentTarget && e.currentTarget.dataset.type
    const routes = {
      image: '/pages/image-qr/image-qr',
      video: '/pages/video-qr/video-qr',
      file: '/pages/generate/generate?mode=file',
      url: '/pages/url-qr/url-qr'
    }
    wx.navigateTo({ url: routes[type] || '/pages/generate/generate' })
  },

  goDecode() {
    wx.navigateTo({ url: '/pages/decode/decode' })
  },

  goTemplates() {
    wx.switchTab({ url: '/pages/templates/templates' })
  }
})
