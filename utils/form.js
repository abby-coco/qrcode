/**
 * 表单输入工具
 */
function updateField(page, e, rootKey) {
  const field = e.currentTarget.dataset.field || e.currentTarget.dataset.key
  const value = e.detail.value

  if (!field) return

  if (rootKey) {
    page.setData({
      [rootKey]: {
        ...page.data[rootKey],
        [field]: value
      }
    })
    return
  }

  page.setData({ [field]: value })
}

module.exports = {
  updateField
}
