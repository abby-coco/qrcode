const drawQrcode = require('./weapp.qrcode.js')
const { toError } = require('./util.js')

const CORRECT_LEVEL = { L: 1, M: 0, Q: 3, H: 2 }

function buildLogoConfig(innerSize, logoPath, logoShape, logoSize, background, margin) {
  const size = innerSize * logoSize
  const dx = (innerSize - size) / 2 + margin
  const dy = (innerSize - size) / 2 + margin
  return {
    imageResource: logoPath,
    dx,
    dy,
    dWidth: size,
    dHeight: size,
    shape: logoShape,
    background: background || '#ffffff'
  }
}

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
    padding = 0.08,
    component = null,
    callback
  } = options

  if (!text) {
    callback && callback(new Error('内容不能为空'))
    return
  }

  if (!wx.createCanvasContext) {
    callback && callback(new Error('当前环境不支持 canvas 绘制，请升级微信版本'))
    return
  }

  const margin = Math.round(Math.min(width, height) * padding)
  const innerSize = Math.min(width, height) - margin * 2

  const imageConfig = logoPath
    ? buildLogoConfig(innerSize, logoPath, logoShape, logoSize, background, margin)
    : undefined

  try {
    drawQrcode({
      width: innerSize,
      height: innerSize,
      canvasWidth: width,
      canvasHeight: height,
      x: margin,
      y: margin,
      canvasId,
      text,
      foreground,
      background,
      correctLevel: CORRECT_LEVEL[errorCorrectionLevel] ?? 0,
      _this: component,
      image: imageConfig,
      callback: (drawErr) => {
        callback && callback(drawErr ? toError(drawErr, '二维码绘制失败') : null)
      }
    })
  } catch (err) {
    callback && callback(toError(err, '二维码绘制失败'))
  }
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
