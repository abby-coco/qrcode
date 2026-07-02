Component({
  properties: {
    icon: { type: String, value: '📋' },
    title: { type: String, value: '' },
    desc: { type: String, value: '' },
    bgColor: { type: String, value: '#f0edff' },
    type: { type: String, value: '' }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { type: this.properties.type })
      wx.navigateTo({
        url: `/pages/template-form/template-form?type=${this.properties.type}`
      })
    }
  }
})
