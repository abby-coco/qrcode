const { saveRecord } = require('../../utils/storage')
const cloud = require('../../utils/cloud')
const { updateField } = require('../../utils/form')
const { getTemplateConfig, buildTemplatePayload } = require('../../utils/template')

Page({
  data: {
    type: '',
    config: null,
    formData: {}
  },

  onLoad(options) {
    const type = options.type || 'registration'
    const config = getTemplateConfig(type)
    const formData = {}
    config.creatorFields.forEach((f) => { formData[f.key] = '' })

    this.setData({ type, config, formData })
    wx.setNavigationBarTitle({ title: config.title })
  },

  onInput(e) {
    updateField(this, e, 'formData')
  },

  generate() {
    const { config, formData, type } = this.data
    for (const field of config.creatorFields) {
      if (field.required && !formData[field.key]?.trim()) {
        wx.showToast({ title: `请填写${field.label}`, icon: 'none' })
        return
      }
    }

    const title = formData.title.trim()
    const payload = buildTemplatePayload(type, formData)

    cloud.generateAndGo(payload, title, 'template')
      .then((result) => {
        saveRecord({
          type: 'template',
          title,
          content: result.rawContent,
          qrData: result.qrData,
          cloudId: result.cloudId || cloud.extractCloudId(result.qrData),
          templateType: type
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title,
          type: 'template',
          isCloudLink: result.isCloudLink,
          linkType: result.linkType,
          cloudId: result.cloudId || cloud.extractCloudId(result.qrData),
          templateType: type
        })
      })
      .catch((err) => {
        wx.showModal({ title: '生成失败', content: err.message, showCancel: false })
      })
  }
})
