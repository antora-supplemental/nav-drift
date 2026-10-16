'use strict'

const NAV_HIDDEN_RE = /^:page-nav-hidden:\s*(.*)$/gm

const FALSE_VALUES = new Set(['false', 'no', '0', 'off', 'disabled'])

/**
 * Whether an AsciiDoc page declares intentional omission from nav.adoc.
 * Antora authors set `:page-nav-hidden:` (empty or true) on xref-only / detail pages.
 */
function isPageNavHidden (text, { attr = 'page-nav-hidden' } = {}) {
  if (!text || typeof text !== 'string') return false
  const re = attr === 'page-nav-hidden'
    ? new RegExp(NAV_HIDDEN_RE.source, 'gm')
    : new RegExp('^:' + attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*(.*)$', 'gm')
  let m
  while ((m = re.exec(text))) {
    const raw = (m[1] || '').trim().toLowerCase()
    if (!raw || raw === 'true' || raw === 'yes' || raw === 'on') return true
    if (FALSE_VALUES.has(raw)) continue
    return true
  }
  return false
}

module.exports = { isPageNavHidden, NAV_HIDDEN_RE }
