const cloud = require('../../utils/cloud')
const { getTemplateConfig } = require('../../utils/template')

function formatSubmitTime(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

Page({
  data: {
    templateId: '',
    title: '',
    templateType: '',
    loading: true,
    total: 0,
    submissions: [],
    fieldLabels: [],
    error: ''
  },

  onLoad(options) {
    const templateId = options.templateId || ''
    const title = decodeURIComponent(options.title || '数据汇总')
    const templateType = options.templateType || ''

    this.setData({ templateId, title, templateType })
    wx.setNavigationBarTitle({ title: '数据汇总' })

    if (!templateId) {
      this.setData({ loading: false, error: '缺少模板 ID' })
      return
    }

    this.loadSubmissions()
  },

  onPullDownRefresh() {
    this.loadSubmissions(true)
  },

  loadSubmissions(stopRefresh) {
    const { templateId, templateType } = this.data
    this.setData({ loading: true, error: '' })

    cloud.getSubmissions(templateId)
      .then((result) => {
        const config = getTemplateConfig(templateType)
        const fieldLabels = config.respondentFields.map((f) => f.label)
        const submissions = (result.list || []).map((item, index) => ({
          index: index + 1,
          timeStr: formatSubmitTime(item.submitTime),
          rows: config.respondentFields.map((field) => ({
            label: field.label,
            value: (item.data && item.data[field.key]) || '-'
          }))
        }))

        this.setData({
          loading: false,
          total: result.total || submissions.length,
          submissions,
          fieldLabels
        })
      })
      .catch((err) => {
        this.setData({
          loading: false,
          error: err.message || '加载失败'
        })
      })
      .finally(() => {
        if (stopRefresh) wx.stopPullDownRefresh()
      })
  },

  copyAll() {
    const { submissions, title } = this.data
    if (!submissions.length) {
      wx.showToast({ title: '暂无数据', icon: 'none' })
      return
    }

    const lines = submissions.map((item) => {
      const parts = [`#${item.index} ${item.timeStr}`]
      item.rows.forEach((row) => parts.push(`${row.label}: ${row.value}`))
      return parts.join('\n')
    })

    wx.setClipboardData({
      data: `${title}\n共 ${submissions.length} 条\n\n${lines.join('\n\n')}`,
      success: () => wx.showToast({ title: '已复制全部数据', icon: 'success' })
    })
  }
})
