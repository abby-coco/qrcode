const cloudConfig = require('./config/cloud.js')
const { formatError } = require('./utils/util.js')

App({
  globalData: {
    appReady: false,
    beautifyConfig: {
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      logoPath: '',
      logoShape: 'square',
      logoSize: 0.2,
      cornerRadius: 0,
      errorCorrectionLevel: 'M'
    },
    lastCombineItems: [],
    pendingResult: null
  },

  onLaunch() {
    try {
      if (wx.cloud) {
        const initOptions = { traceUser: false }
        if (cloudConfig.envId) {
          initOptions.env = cloudConfig.envId
        }
        wx.cloud.init(initOptions)
      } else {
        console.warn('请使用 2.2.3 或以上基础库以支持云开发')
      }
    } catch (err) {
      console.error('云开发初始化失败:', formatError(err, '云开发初始化失败'))
    }
    this.markReady()
  },

  onError(message) {
    const text = formatError(message, '运行出错')
    console.error('App onError:', text)
    wx.showModal({ title: '运行出错', content: text, showCancel: false })
  },

  onUnhandledRejection(res) {
    if (res && typeof res.preventDefault === 'function') {
      res.preventDefault()
    }
    const text = formatError(res && res.reason, '发生未知错误，请稍后重试')
    console.error('Unhandled rejection:', text)
    wx.showModal({ title: '运行出错', content: text, showCancel: false })
  },

  markReady() {
    this.globalData.appReady = true
    const callbacks = this._readyCallbacks || []
    this._readyCallbacks = []
    callbacks.forEach((cb) => cb())
  },

  waitForReady(callback) {
    if (this.globalData.appReady) {
      callback()
      return
    }
    if (!this._readyCallbacks) {
      this._readyCallbacks = []
    }
    this._readyCallbacks.push(callback)
  }
})
