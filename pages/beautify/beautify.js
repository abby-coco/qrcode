const { drawQRCode } = require('../../utils/qrcode')

function normalizeHex(value) {
  let v = String(value || '').trim()
  if (!v) return null
  if (!v.startsWith('#')) v = `#${v}`
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase()
  return null
}

Page({
  data: {
    qrData: '',
    previewImage: '',
    canvasSize: 240,
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    fgHexInput: '#000000',
    bgHexInput: '#ffffff',
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
    const app = getApp()
    const config = app.globalData.beautifyConfig
    const qrData = app.globalData.beautifyPreviewQrData || ''

    this.setData({
      qrData,
      foregroundColor: config.foregroundColor,
      backgroundColor: config.backgroundColor,
      fgHexInput: config.foregroundColor,
      bgHexInput: config.backgroundColor,
      logoPath: config.logoPath,
      logoShape: config.logoShape,
      logoSize: Math.round(config.logoSize * 100),
      errorCorrectionLevel: config.errorCorrectionLevel
    })
  },

  onReady() {
    this.renderPreview()
  },

  updatePreview(patch) {
    const next = { ...patch }
    if (patch.foregroundColor) next.fgHexInput = patch.foregroundColor
    if (patch.backgroundColor) next.bgHexInput = patch.backgroundColor
    this.setData(next, () => this.schedulePreview())
  },

  schedulePreview() {
    if (this._previewTimer) clearTimeout(this._previewTimer)
    this._previewTimer = setTimeout(() => {
      this._previewTimer = null
      this.renderPreview()
    }, 50)
  },

  exportPreviewImage() {
    wx.canvasToTempFilePath({
      canvasId: 'previewCanvas',
      success: (res) => {
        this.setData({ previewImage: res.tempFilePath })
      }
    }, this)
  },

  renderPreview() {
    const {
      qrData,
      canvasSize,
      foregroundColor,
      backgroundColor,
      logoPath,
      logoShape,
      logoSize,
      errorCorrectionLevel
    } = this.data

    if (!qrData) return

    drawQRCode({
      canvasId: 'previewCanvas',
      text: qrData,
      width: canvasSize,
      height: canvasSize,
      foreground: foregroundColor,
      background: backgroundColor,
      logoPath,
      logoShape,
      logoSize: logoSize / 100,
      errorCorrectionLevel,
      component: this,
      callback: () => {
        this.exportPreviewImage()
      }
    })
  },

  onFgHexInput(e) {
    const raw = e.detail.value
    this.setData({ fgHexInput: raw })
    const color = normalizeHex(raw)
    if (color) this.updatePreview({ foregroundColor: color })
  },

  onBgHexInput(e) {
    const raw = e.detail.value
    this.setData({ bgHexInput: raw })
    const color = normalizeHex(raw)
    if (color) this.updatePreview({ backgroundColor: color })
  },

  applyFgHex() {
    const color = normalizeHex(this.data.fgHexInput)
    if (color) {
      this.updatePreview({ foregroundColor: color })
      return
    }
    this.setData({ fgHexInput: this.data.foregroundColor })
    wx.showToast({ title: '请输入 #RRGGBB', icon: 'none' })
  },

  applyBgHex() {
    const color = normalizeHex(this.data.bgHexInput)
    if (color) {
      this.updatePreview({ backgroundColor: color })
      return
    }
    this.setData({ bgHexInput: this.data.backgroundColor })
    wx.showToast({ title: '请输入 #RRGGBB', icon: 'none' })
  },

  selectPresetColor(e) {
    this.updatePreview({ foregroundColor: e.currentTarget.dataset.color })
  },

  selectShape(e) {
    this.updatePreview({ logoShape: e.currentTarget.dataset.value })
  },

  selectLevel(e) {
    this.updatePreview({ errorCorrectionLevel: e.currentTarget.dataset.value })
  },

  onLogoSizeChange(e) {
    this.updatePreview({ logoSize: e.detail.value })
  },

  onLogoSizeChanging(e) {
    this.setData({ logoSize: e.detail.value })
    this.schedulePreview()
  },

  chooseLogo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.updatePreview({ logoPath: res.tempFiles[0].tempFilePath })
      }
    })
  },

  removeLogo() {
    this.updatePreview({ logoPath: '' })
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
