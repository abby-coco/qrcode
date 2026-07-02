function escapeVCardValue(value) {
  if (!value) return ''
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function generateVCard(contact) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  const fullName = contact.name || ''
  const parts = fullName.split(/\s+/)
  const lastName = parts.length > 1 ? parts[0] : ''
  const firstName = parts.length > 1 ? parts.slice(1).join(' ') : fullName

  lines.push(`N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`)
  lines.push(`FN:${escapeVCardValue(fullName)}`)

  if (contact.phone) lines.push(`TEL;TYPE=CELL:${contact.phone}`)
  if (contact.email) lines.push(`EMAIL:${contact.email}`)
  if (contact.company) lines.push(`ORG:${escapeVCardValue(contact.company)}`)
  if (contact.title) lines.push(`TITLE:${escapeVCardValue(contact.title)}`)
  if (contact.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(contact.address)};;;;`)
  if (contact.website) lines.push(`URL:${contact.website}`)
  if (contact.note) lines.push(`NOTE:${escapeVCardValue(contact.note)}`)

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

module.exports = { generateVCard, escapeVCardValue }
