Page({
  data: {
    categories: [
      { key: 'copywriting', label: '文案', icon: '✍️' },
      { key: 'quotes', label: '语录', icon: '💭' },
      { key: 'emoji', label: '表情包', icon: '😊' }
    ],
    activeCategory: 'copywriting',
    items: {
      copywriting: [
        { text: '生活不止眼前的苟且，还有诗和远方。', author: '高晓松' },
        { text: '世界上只有一种英雄主义，就是认清生活真相之后依然热爱它。', author: '罗曼·罗兰' },
        { text: '你的时间有限，不要浪费在重复他人的生活上。', author: '乔布斯' },
        { text: '种一棵树最好的时间是十年前，其次是现在。', author: '谚语' },
        { text: '星光不问赶路人，时光不负有心人。', author: '' }
      ],
      quotes: [
        { text: '「成功不是终点，失败也不是终结，重要的是继续前进的勇气。」', author: '丘吉尔' },
        { text: '「我们读过的书、走过的路、遇过的人，最终都会成为 ourselves 的一部分。」', author: '' },
        { text: '「你若盛开，蝴蝶自来。」', author: '' },
        { text: '「不积跬步，无以至千里。」', author: '荀子' },
        { text: '「天行健，君子以自强不息。」', author: '《周易》' }
      ],
      emoji: [
        { text: '(◕‿◕)✧', author: '开心' },
        { text: '(๑•̀ㅂ•́)و✧', author: '加油' },
        { text: '(´▽`ʃ♡ƪ)', author: '比心' },
        { text: 'Σ(°△°|||)', author: '震惊' },
        { text: '(～￣▽￣)～', author: '得意' },
        { text: '┌(。Д。)┐', author: '无奈' },
        { text: 'o(╥﹏╥)o', author: '哭泣' },
        { text: '(￣▽￣*)ゞ', author: '干杯' }
      ]
    },
    currentItems: []
  },

  onLoad() {
    this.switchCategory({ currentTarget: { dataset: { key: 'copywriting' } } })
  },

  switchCategory(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      activeCategory: key,
      currentItems: this.data.items[key]
    })
  },

  copyText(e) {
    const text = e.currentTarget.dataset.text
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' })
    })
  },

  generateQR(e) {
    const text = e.currentTarget.dataset.text
    const cloud = require('../../utils/cloud')
    const { saveRecord } = require('../../utils/storage')

    cloud.generateAndGo(text, '语录二维码', 'text')
      .then((result) => {
        saveRecord({
          type: 'generate',
          title: text.slice(0, 20),
          content: result.rawContent,
          qrData: result.qrData
        })
        cloud.navigateToResult({
          qrData: result.qrData,
          rawContent: result.rawContent,
          title: '语录二维码',
          type: 'generate',
          isCloudLink: result.isCloudLink,
          cloudId: result.cloudId
        })
      })
      .catch((err) => {
        wx.showModal({ title: '生成失败', content: err.message, showCancel: false })
      })
  }
})
