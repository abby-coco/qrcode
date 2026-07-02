const drawQrcode = require('./weapp.qrcode.js')

const CORRECT_LEVEL = { L: 1, M: 0, Q: 3, H: 2 }

function drawQRCode(options) {
  const {
    canvasId,
    text,
    width = 280,
    height = 280,
    foreground = '#000000',
    background = '#ffffff',
    logoPath = '',
    logoShape = 'square',
    logoSize = 0.2,
    errorCorrectionLevel = 'M',
    component = null,
    callback
  } = options

  if (!text) {
    callback && callback(new Error('内容不能为空'))
    return
  }

  const imageConfig = logoPath ? buildLogoConfig(width, logoPath, logoShape, logoSize) : undefined

  drawQrcode({
    width,
    height,
    canvasId,
    text,
    foreground,
    background,
    correctLevel: CORRECT_LEVEL[errorCorrectionLevel] ?? 0,
    _this: component,
    image: imageConfig,
    callback: (err) => {
      callback && callback(err || null)
    }
  })
}

function buildLogoConfig(width, logoPath, logoShape, logoSize) {
  const size = width * logoSize
  const dx = (width - size) / 2
  const dy = (width - size) / 2
  const config = {
    imageResource: logoPath,
    dx,
    dy,
    dWidth: size,
    dHeight: size
  }
  if (logoShape === 'circle' || logoShape === 'round') {
    config.round = true
  }
  return config
}

function saveQRCodeToAlbum(canvasId, component, callback) {
  wx.canvasToTempFilePath({
    canvasId,
    success: (res) => {
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => callback && callback(null, res.tempFilePath),
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要您授权保存相册权限',
              success: (modalRes) => {
                if (modalRes.confirm) wx.openSetting()
              }
            })
          }
          callback && callback(err)
        }
      })
    },
    fail: (err) => callback && callback(err)
  }, component)
}

module.exports = {
  drawQRCode,
  saveQRCodeToAlbum,
  CORRECT_LEVEL
}
