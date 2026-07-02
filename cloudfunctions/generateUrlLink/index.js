const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { id, envVersion = 'develop' } = event

  if (!id) {
    return { success: false, errMsg: '缺少内容 ID' }
  }

  // URL Link 最长 30 天有效
  const expireTime = Math.floor(Date.now() / 1000) + 30 * 24 * 3600

  try {
    const result = await cloud.openapi.urllink.generate({
      path: 'pages/view/view',
      query: `id=${id}`,
      isExpire: true,
      expireType: 0,
      expireTime,
      envVersion
    })

    if (!result.urlLink && !result.url_link) {
      return { success: false, errMsg: 'URL Link 生成失败' }
    }

    return {
      success: true,
      urlLink: result.urlLink || result.url_link,
      cloudId: id,
      expireTime
    }
  } catch (err) {
    const errMsg = err.errMsg || err.message || 'URL Link 生成失败'
    const errCode = err.errCode

    return {
      success: false,
      errMsg,
      errCode,
      hint: errCode === 85407 || String(errMsg).includes('no scheme permission')
        ? '个人主体小程序不支持 URL Link。请改用小程序码，或注册企业/个体户主体后再用方形二维码'
        : '请确认 generateUrlLink 已部署，并开启 urllink.generate 权限'
    }
  }
}
