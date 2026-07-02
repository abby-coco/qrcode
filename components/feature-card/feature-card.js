Component({
  properties: {
    icon: { type: String, value: '📱' },
    title: { type: String, value: '' },
    desc: { type: String, value: '' },
    btnText: { type: String, value: '' },
    bgColor: { type: String, value: '#7c6cf0' },
    titleColor: { type: String, value: '#ffffff' },
    descColor: { type: String, value: 'rgba(255,255,255,0.85)' },
    btnBg: { type: String, value: 'rgba(255,255,255,0.25)' },
    btnColor: { type: String, value: '#ffffff' },
    size: { type: String, value: 'large' },
    url: { type: String, value: '' }
  },

  methods: {
    onTap() {
      const { url } = this.properties
      this.triggerEvent('tap')
      if (url) {
        wx.navigateTo({ url })
      }
    }
  }
})
