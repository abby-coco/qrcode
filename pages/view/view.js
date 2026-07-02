Page({
  data: {
    title: '',
    content: '',
    loading: true,
    error: ''
  },

  onLoad(options) {
    let id = options.scene || options.id || options.cloudId || ''
    if (id) {
      try {
        id = decodeURIComponent(id)
      } catch (e) {
        // keep original id
      }
    }

    if (!id) {
      this.setData({ loading: false, error: '未找到内容' })
      return
    }

    this.loadContent(id)
  },

  loadContent(id) {
    wx.cloud.callFunction({
      name: 'getContent',
      data: { id },
      success: (res) => {
        const result = res.result || {}
        if (result.success) {
          this.setData({
            title: result.title || '内容详情',
            content: result.content || '',
            loading: false,
            error: ''
          })
          wx.setNavigationBarTitle({ title: result.title || '查看内容' })
        } else {
          this.setData({
            loading: false,
            error: result.errMsg || '内容不存在或已删除'
          })
        }
      },
      fail: () => {
        this.setData({
          loading: false,
          error: '加载失败，请稍后重试'
        })
      }
    })
  },

  copyContent() {
    if (!this.data.content) return
    wx.setClipboardData({
      data: this.data.content,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  }
})
