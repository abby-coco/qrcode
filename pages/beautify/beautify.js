Page({
  data: {
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    logoPath: '',
    logoShape: 'square',
    logoSize: 20,
    errorCorrectionLevel: 'M',
    shapeOptions: [
      { value: 'square', label: '原图' },
      { value: 'round', label: '圆角' },
      { value: 'circle', label: '圆形' }
    ],
    levelOptions: [
      { value: 'L', label: '低' },
      { value: 'M', label: '中' },
      { value: 'Q', label: '较高' },
      { value: 'H', label: '高' }
    ],
    presetColors: ['#000000', '#7c6cf0', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b']
  },

  onLoad() {
    const config = getApp().globalData.beautifyConfig
    this.setData({
      foregroundColor: config.foregroundColor,
      backgroundColor: config.backgroundColor,
      logoPath: config.logoPath,
      logoShape: config.logoShape,
      logoSize: Math.round(config.logoSize * 100),
      errorCorrectionLevel: config.errorCorrectionLevel
    })
  },

  onFgColorChange(e) {
    this.setData({ foregroundColor: e.detail.value })
  },

  onBgColorChange(e) {
    this.setData({ backgroundColor: e.detail.value })
  },

  selectPresetColor(e) {
    this.setData({ foregroundColor: e.currentTarget.dataset.color })
  },

  selectShape(e) {
    this.setData({ logoShape: e.currentTarget.dataset.value })
  },

  selectLevel(e) {
    this.setData({ errorCorrectionLevel: e.currentTarget.dataset.value })
  },

  onLogoSizeChange(e) {
    this.setData({ logoSize: e.detail.value })
  },

  chooseLogo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({ logoPath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  removeLogo() {
    this.setData({ logoPath: '' })
  },

  saveConfig() {
    const { foregroundColor, backgroundColor, logoPath, logoShape, logoSize, errorCorrectionLevel } = this.data
    getApp().globalData.beautifyConfig = {
      foregroundColor,
      backgroundColor,
      logoPath,
      logoShape,
      logoSize: logoSize / 100,
      errorCorrectionLevel
    }
    wx.showToast({ title: '设置已保存', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  }
})
