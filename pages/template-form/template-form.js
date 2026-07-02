const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')
const { updateField } = require('../../utils/form')

const TEMPLATE_CONFIG = {
  registration: {
    title: '活动报名',
    icon: '🎉',
    fields: [
      { key: 'eventName', label: '活动名称', required: true },
      { key: 'name', label: '姓名', required: true },
      { key: 'phone', label: '手机号', required: true },
      { key: 'email', label: '邮箱', required: false },
      { key: 'note', label: '备注', required: false }
    ]
  },
  checkin: {
    title: '签到打卡',
    icon: '✅',
    fields: [
      { key: 'eventName', label: '活动/会议名称', required: true },
      { key: 'name', label: '姓名', required: true },
      { key: 'phone', label: '手机号', required: true },
      { key: 'department', label: '部门', required: false }
    ]
  },
  feedback: {
    title: '意见反馈',
    icon: '💬',
    fields: [
      { key: 'title', label: '反馈主题', required: true },
      { key: 'name', label: '姓名', required: false },
      { key: 'contact', label: '联系方式', required: false },
      { key: 'content', label: '反馈内容', required: true }
    ]
  },
  visitor: {
    title: '访客登记',
    icon: '📝',
    fields: [
      { key: 'visitorName', label: '访客姓名', required: true },
      { key: 'hostName', label: '被访人', required: true },
      { key: 'reason', label: '来访事由', required: true },
      { key: 'phone', label: '联系电话', required: true }
    ]
  },
  survey: {
    title: '问卷调查',
    icon: '📊',
    fields: [
      { key: 'surveyTitle', label: '问卷标题', required: true },
      { key: 'q1', label: '问题1', required: true },
      { key: 'q2', label: '问题2', required: false },
      { key: 'q3', label: '问题3', required: false }
    ]
  }
}

Page({
  data: {
    type: '',
    config: null,
    formData: {}
  },

  onLoad(options) {
    const type = options.type || 'registration'
    const config = TEMPLATE_CONFIG[type] || TEMPLATE_CONFIG.registration
    const formData = {}
    config.fields.forEach(f => { formData[f.key] = '' })

    this.setData({ type, config, formData })
    wx.setNavigationBarTitle({ title: config.title })
  },

  onInput(e) {
    updateField(this, e, 'formData')
  },

  generate() {
    const { config, formData, type } = this.data
    for (const field of config.fields) {
      if (field.required && !formData[field.key]?.trim()) {
        wx.showToast({ title: `请填写${field.label}`, icon: 'none' })
        return
      }
    }

    const payload = JSON.stringify({
      type: 'template',
      templateType: type,
      title: formData.eventName || formData.title || formData.surveyTitle || config.title,
      fields: config.fields.map(f => ({ label: f.label, value: formData[f.key] })),
      createTime: new Date().toISOString()
    })

    const title = formData.eventName || formData.title || formData.surveyTitle || config.title

    cloud.generateAndGo(payload, title, 'template')
      .then((result) => {
        saveRecord({
          type: 'template',
          title,
          content: result.rawContent,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title,
          type: 'template',
          isCloudLink: result.isCloudLink,
          cloudId: result.cloudId
        })
      })
      .catch((err) => {
        wx.showModal({ title: '生成失败', content: err.message, showCancel: false })
      })
  }
})
