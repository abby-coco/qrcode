function generateWiFiString(wifi) {
  const ssid = escapeWiFiValue(wifi.ssid || '')
  const password = escapeWiFiValue(wifi.password || '')
  const encryption = wifi.encryption || 'WPA'
  const hidden = wifi.hidden ? 'true' : 'false'
  return `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden};;`
}

function escapeWiFiValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/:/g, '\\:')
    .replace(/"/g, '\\"')
}

module.exports = { generateWiFiString, escapeWiFiValue }
