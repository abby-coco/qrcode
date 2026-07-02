const { drawQRCode, saveQRCodeToAlbum } = require('../../utils/qrcode')

Page({
  data: {
    mode: 'qrcode',
    qrData: '',
    rawContent: '',
    title: '',
    type: 'generate',
    isCloudLink: false,
    linkType: '',
    isWxacode: false,
    wxacodeUrl: '',
    canvasSize: 280,
    showCanvas: false,
    rawPreview: ''
  },

  buildRawPreview(rawContent) {
    if (!rawContent) return ''
    try {
      const data = JSON.parse(rawContent)
      if (data.type === 'combine' && Array.isArray(data.items)) {
        const labels = { image: '图片', video: '视频', audio: '音频', file: '文件', text: '文字' }
        const parts = data.items.map((item) => labels[item.type] || item.type)
        return `组合内容：${parts.join('、')}`
      }
      if (data.type === 'image') return `图片：${data.title || '图片二维码'}`
      if (data.type === 'video') return `视频：${data.title || '视频二维码'}`
    } catch (e) {
      // plain text
    }
    return rawContent
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

    const rawPreview = this.buildRawPreview(rawContent)

    this.setData({
      mode: isWxacode ? 'wxacode' : 'qrcode',
      qrData,
      title,
      type,
      rawContent,
      rawPreview,
      isCloudLink,
      linkType,
      isWxacode,
      showCanvas: !isWxacode && !!qrData
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
        this.setData({ wxacodeUrl: filePath })
      },
      fail: () => {
        wx.showToast({ title: '小程序码加载失败', icon: 'none' })
      }
    })
  },

  onReady() {
    if (this.data.mode === 'qrcode' && this.data.qrData) {
      this.renderQR()
    }
  },

  onShow() {
    if (this.data.mode === 'qrcode' && this.data.qrData) {
      this.renderQR()
    }
  },

  renderQR() {
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
        if (err) wx.showToast({ title: '二维码绘制失败', icon: 'none' })
      }
    })
  },

  goBeautify() {
    if (this.data.isWxacode) {
      wx.showToast({ title: '小程序码暂不支持美化', icon: 'none' })
      return
    }
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
  }
})
