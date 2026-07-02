const TEMPLATE_TYPES = {
  registration: {
    title: '活动报名',
    icon: '🎉',
    creatorFields: [
      { key: 'title', label: '活动名称', required: true, placeholder: '例如：春季户外徒步' },
      { key: 'description', label: '活动说明', required: false, inputType: 'textarea', placeholder: '可选，填写活动时间、地点等' }
    ],
    respondentFields: [
      { key: 'name', label: '姓名', required: true },
      { key: 'phone', label: '手机号', required: true },
      { key: 'email', label: '邮箱', required: false },
      { key: 'note', label: '备注', required: false, inputType: 'textarea' }
    ]
  },
  checkin: {
    title: '签到打卡',
    icon: '✅',
    creatorFields: [
      { key: 'title', label: '活动/会议名称', required: true, placeholder: '例如：产品发布会' },
      { key: 'description', label: '签到说明', required: false, inputType: 'textarea' }
    ],
    respondentFields: [
      { key: 'name', label: '姓名', required: true },
      { key: 'phone', label: '手机号', required: true },
      { key: 'department', label: '部门', required: false }
    ]
  },
  feedback: {
    title: '意见反馈',
    icon: '💬',
    creatorFields: [
      { key: 'title', label: '反馈主题', required: true, placeholder: '例如：产品体验反馈' },
      { key: 'description', label: '说明', required: false, inputType: 'textarea' }
    ],
    respondentFields: [
      { key: 'name', label: '姓名', required: false },
      { key: 'contact', label: '联系方式', required: false },
      { key: 'content', label: '反馈内容', required: true, inputType: 'textarea' }
    ]
  },
  visitor: {
    title: '访客登记',
    icon: '📝',
    creatorFields: [
      { key: 'title', label: '登记点名称', required: true, placeholder: '例如：前台访客登记' }
    ],
    respondentFields: [
      { key: 'visitorName', label: '访客姓名', required: true },
      { key: 'hostName', label: '被访人', required: true },
      { key: 'reason', label: '来访事由', required: true },
      { key: 'phone', label: '联系电话', required: true }
    ]
  },
  survey: {
    title: '问卷调查',
    icon: '📊',
    creatorFields: [
      { key: 'title', label: '问卷标题', required: true, placeholder: '例如：用户满意度调查' }
    ],
    respondentFields: [
      { key: 'name', label: '姓名', required: false },
      { key: 'q1', label: '问题1', required: true, inputType: 'textarea' },
      { key: 'q2', label: '问题2', required: false, inputType: 'textarea' },
      { key: 'q3', label: '问题3', required: false, inputType: 'textarea' }
    ]
  }
}

function getTemplateConfig(type) {
  return TEMPLATE_TYPES[type] || TEMPLATE_TYPES.registration
}

function buildTemplatePayload(type, creatorData) {
  const config = getTemplateConfig(type)
  const title = (creatorData.title || config.title).trim()
  return JSON.stringify({
    type: 'template-form',
    templateType: type,
    title,
    description: (creatorData.description || '').trim(),
    fields: config.respondentFields,
    createTime: new Date().toISOString()
  })
}

module.exports = {
  TEMPLATE_TYPES,
  getTemplateConfig,
  buildTemplatePayload
}
