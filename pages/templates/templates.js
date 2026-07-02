Page({
  data: {
    templates: [
      {
        icon: '🎉',
        title: '活动报名',
        desc: '创建活动报名表单，扫码填写信息',
        bgColor: '#fef3c7',
        type: 'registration',
        fields: ['姓名', '手机号', '邮箱', '备注']
      },
      {
        icon: '✅',
        title: '签到打卡',
        desc: '活动现场扫码签到，记录到场时间',
        bgColor: '#ecfdf5',
        type: 'checkin',
        fields: ['姓名', '手机号', '部门']
      },
      {
        icon: '💬',
        title: '意见反馈',
        desc: '收集用户意见和建议',
        bgColor: '#eff6ff',
        type: 'feedback',
        fields: ['姓名', '联系方式', '反馈类型', '详细描述']
      },
      {
        icon: '📝',
        title: '访客登记',
        desc: '访客来访信息登记',
        bgColor: '#f0edff',
        type: 'visitor',
        fields: ['访客姓名', '被访人', '来访事由', '联系电话']
      },
      {
        icon: '📊',
        title: '问卷调查',
        desc: '快速创建简易问卷',
        bgColor: '#fce7f3',
        type: 'survey',
        fields: ['问题1', '问题2', '问题3']
      }
    ]
  },

  useTemplate(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: `/pages/template-form/template-form?type=${type}` })
  }
})
