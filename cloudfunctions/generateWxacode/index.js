const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { id, envVersion = 'develop' } = event

  if (!id) {
    return { success: false, errMsg: '缺少内容 ID', step: 'generateWxacode' }
  }

  const scene = String(id)
  if (scene.length > 32) {
    return { success: false, errMsg: '内容 ID 过长', step: 'generateWxacode' }
  }

  try {
    const wxacodeResult = await cloud.openapi.wxacode.getUnlimited({
      scene,
      page: 'pages/view/view',
      width: 430,
      checkPath: false,
      envVersion
    })

    const buffer = wxacodeResult.buffer || wxacodeResult
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return {
        success: false,
        errMsg: '小程序码图片数据为空，请确认已部署云函数并授权 openapi',
        step: 'generateWxacode'
      }
    }

    return {
      success: true,
      base64: buffer.toString('base64'),
      cloudId: id,
      envVersion
    }
  } catch (err) {
    const errMsg = [
      err.errMsg || err.message || '小程序码生成失败',
      err.errCode ? `(errCode: ${err.errCode})` : ''
    ].filter(Boolean).join(' ')

    return {
      success: false,
      errMsg,
      step: 'generateWxacode',
      hint: err.errCode === -604101
        ? '请在云开发控制台为云函数开启 openapi 权限（wxacode.getUnlimited）'
        : '请确认 generateWxacode 已上传部署，且 wxacodeEnvVersion 与当前小程序版本一致'
    }
  }
}
