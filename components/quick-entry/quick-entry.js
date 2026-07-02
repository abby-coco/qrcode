Component({
  properties: {
    icon: { type: String, value: '📱' },
    label: { type: String, value: '' },
    bgColor: { type: String, value: '#f0edff' },
    url: { type: String, value: '' }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap')
      const { url } = this.properties
      if (url) {
        if (url.startsWith('/pages/') && !url.includes('?')) {
          const tabPages = ['/pages/index/index', '/pages/templates/templates', '/pages/history/history', '/pages/quotes/quotes']
          if (tabPages.some(p => url.startsWith(p))) {
            wx.switchTab({ url: url.split('?')[0] })
            return
          }
        }
        wx.navigateTo({ url })
      }
    }
  }
})
