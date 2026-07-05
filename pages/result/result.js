const { drawQRCode, saveQRCodeToAlbum } = require('../../utils/qrcode')
const cloud = require('../../utils/cloud')
const { buildContentPreview, formatError } = require('../../utils/util')

Page({
  data: {
    mode: 'qrcode',
    qrData: '',
    rawContent: '',
    title: '',
    type: 'generate',
    cloudId: '',
    templateType: '',
    isCloudLink: false,
    linkType: '',
    isWxacode: false,
    wxacodeUrl: '',
    canvasSize: 280,
    showCanvas: false,
    qrLoading: false,
    rawPreview: ''
  },

  onLoad(options) {
    const app = getApp()
    const pending = app.globalData.pendingResult || {}
    app.globalData.pendingResult = null

    const title = decodeURIComponent(options.title || '二维码')
    const type = options.type || 'generate'
    const isCloudLink = options.cloud === '1' || !!pending.isCloudLink
    const linkType = options.linkType || pending.linkType || ''
    const isWxacode = options.mode === 'wxacode' || !!pending.isWxacode
    let qrData = pending.qrData || ''
    let rawContent = pending.rawContent || ''

    if (!qrData && options.data) {
      try {
        qrData = decodeURIComponent(options.data)
      } catch (e) {
        qrData = options.data
      }
      if (!rawContent) rawContent = qrData
    }

    let cloudId = pending.cloudId || cloud.extractCloudId(qrData)
    let templateType = pending.templateType || ''

    if (!templateType && rawContent) {
      try {
        const parsed = JSON.parse(rawContent)
        if (parsed.type === 'template-form') {
          templateType = parsed.templateType || ''
        }
      } catch (e) {
        // ignore
      }
    }

    const rawPreview = buildContentPreview(rawContent, { templateType, qrData })

    this.setData({
      mode: isWxacode ? 'wxacode' : 'qrcode',
      qrData,
      title,
      type,
      rawContent,
      rawPreview,
      cloudId,
      templateType,
      isCloudLink,
      linkType,
      isWxacode,
      showCanvas: !isWxacode && !!qrData,
      qrLoading: isWxacode ? !!pending.wxacodeBase64 : !!qrData
    })
    wx.setNavigationBarTitle({ title })

    if (isWxacode && pending.wxacodeBase64) {
      this.loadWxacodeImage(pending.wxacodeBase64)
    }
  },

  loadWxacodeImage(base64) {
    const filePath = `${wx.env.USER_DATA_PATH}/wxacode_${Date.now()}.png`
    wx.getFileSystemManager().writeFile({
      filePath,
      data: base64,
      encoding: 'base64',
      success: () => {
        this.setData({ wxacodeUrl: filePath, qrLoading: false })
      },
      fail: () => {
        this.setData({ qrLoading: false })
        wx.showToast({ title: '小程序码加载失败', icon: 'none' })
      }
    })
  },

  onReady() {
    if (this.data.mode === 'qrcode' && this.data.qrData) {
      this.scheduleRenderQR()
    }
  },

  onShow() {
    if (this.data.mode === 'qrcode' && this.data.qrData) {
      this.scheduleRenderQR()
    }
  },

  scheduleRenderQR() {
    if (this._renderTimer) clearTimeout(this._renderTimer)
    this._renderTimer = setTimeout(() => {
      this._renderTimer = null
      this.renderQR()
    }, 150)
  },

  renderQR() {
    if (!this.data.showCanvas || !this.data.qrData) return

    const app = getApp()
    const config = app.globalData.beautifyConfig
    const { qrData, canvasSize } = this.data

    drawQRCode({
      canvasId: 'qrCanvas',
      text: qrData,
      width: canvasSize,
      height: canvasSize,
      foreground: config.foregroundColor,
      background: config.backgroundColor,
      logoPath: config.logoPath,
      logoShape: config.logoShape,
      logoSize: config.logoSize,
      errorCorrectionLevel: config.errorCorrectionLevel,
      component: this,
      callback: (err) => {
        this.setData({ qrLoading: false })
        if (err) {
          wx.showModal({
            title: '二维码绘制失败',
            content: formatError(err, '请稍后重试'),
            showCancel: false
          })
        }
      }
    })
  },

  goBeautify() {
    if (this.data.isWxacode) {
      wx.showToast({ title: '小程序码暂不支持美化', icon: 'none' })
      return
    }
    getApp().globalData.beautifyPreviewQrData = this.data.qrData
    wx.navigateTo({ url: '/pages/beautify/beautify' })
  },

  saveImage() {
    if (this.data.isWxacode) {
      if (!this.data.wxacodeUrl) {
        wx.showToast({ title: '图片未就绪', icon: 'none' })
        return
      }
      wx.saveImageToPhotosAlbum({
        filePath: this.data.wxacodeUrl,
        success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
        fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
      })
      return
    }

    saveQRCodeToAlbum('qrCanvas', this, (err) => {
      if (!err) wx.showToast({ title: '已保存到相册', icon: 'success' })
    })
  },

  copyContent() {
    const data = this.data.rawContent || this.data.qrData
    wx.setClipboardData({
      data,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  copyLink() {
    wx.setClipboardData({
      data: this.data.qrData,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    })
  },

  goSubmissions() {
    const { cloudId, title, templateType } = this.data
    if (!cloudId) {
      wx.showToast({ title: '无法查看汇总', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/template-submissions/template-submissions?templateId=${cloudId}&title=${encodeURIComponent(title)}&templateType=${templateType || ''}`
    })
  }
})
