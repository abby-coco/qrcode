const MIN_LOADING_MS = 500
const MAX_LOADING_MS = 3000

Page({
  onLoad() {
    const app = getApp()
    const start = Date.now()
    let navigated = false

    const goHome = () => {
      if (navigated) return
      navigated = true
      const remain = Math.max(0, MIN_LOADING_MS - (Date.now() - start))
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, remain)
    }

    if (app.globalData.appReady) {
      goHome()
    } else {
      app.waitForReady(goHome)
    }

    setTimeout(goHome, MAX_LOADING_MS)
  }
})
