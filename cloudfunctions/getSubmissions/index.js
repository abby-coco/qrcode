const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { templateId } = event || {}

    if (!templateId) {
      return { success: false, errMsg: '缺少 templateId' }
    }

    const where = { templateId: String(templateId) }
    const countRes = await db.collection('qr_submissions').where(where).count()
    const listRes = await db.collection('qr_submissions')
      .where(where)
      .orderBy('submitTime', 'desc')
      .limit(200)
      .get()

    const list = (listRes.data || []).map((item) => ({
      id: item._id,
      data: item.data || {},
      submitTime: item.submitTime
    }))

    return {
      success: true,
      total: countRes.total || list.length,
      list
    }
  } catch (err) {
    const errMsg = err.message || err.errMsg || '获取失败'
    let hint = ''

    if (errMsg.includes('collection not exists') || errMsg.includes('DATABASE_COLLECTION_NOT_EXIST') || err.code === -502005) {
      hint = '请在云开发控制台 → 数据库 → 新建集合 qr_submissions'
    }

    return { success: false, errMsg, hint, errCode: err.code || err.errCode }
  }
}
