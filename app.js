const cloudConfig = require('./config/cloud.js')

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
    if (wx.cloud) {
      const initOptions = { traceUser: true }
      if (cloudConfig.envId) {
        initOptions.env = cloudConfig.envId
      }
      wx.cloud.init(initOptions)
    } else {
      console.warn('请使用 2.2.3 或以上基础库以支持云开发')
    }
    this.markReady()
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
