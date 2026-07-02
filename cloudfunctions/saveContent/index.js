const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { content, title, type } = event || {}

    if (!content || !String(content).trim()) {
      return { success: false, errMsg: '内容不能为空' }
    }

    if (String(content).length > 50000) {
      return { success: false, errMsg: '内容过长，请控制在 50000 字以内' }
    }

    const res = await db.collection('qr_contents').add({
      data: {
        content: String(content),
        title: title || '',
        type: type || 'text',
        createTime: db.serverDate()
      }
    })

    return { success: true, id: res._id }
  } catch (err) {
    const errMsg = err.message || err.errMsg || '保存失败'
    let hint = ''

    if (errMsg.includes('collection not exists') || errMsg.includes('DATABASE_COLLECTION_NOT_EXIST') || err.code === -502005) {
      hint = '请在云开发控制台 → 数据库 → 新建集合 qr_contents'
    } else if (errMsg.includes('wx-server-sdk') || errMsg.includes('Cannot find module')) {
      hint = '请重新部署 saveContent，选择「上传并部署：云端安装依赖」'
    }

    return { success: false, errMsg, hint, errCode: err.code || err.errCode }
  }
}
