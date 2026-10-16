'use strict'

const HIDE_FROM_NAVTREE_RE = /^:hide-from-navtree:\s*(.*)$/gm
const LEGACY_NAV_HIDDEN_RE = /^:page-nav-hidden:\s*(.*)$/gm
const NAVTREE_PARENT_RE = /^:navtree-parent:\s*(.+)$/gm
const LEGACY_NAV_PARENT_RE = /^:page-nav-parent:\s*(.+)$/gm

const FALSE_VALUES = new Set(['false', 'no', '0', 'off', 'disabled'])

function matchHideDirective (text, re) {
  const r = new RegExp(re.source, 'gm')
  let m
  while ((m = r.exec(text))) {
    const raw = (m[1] || '').trim().toLowerCase()
    if (FALSE_VALUES.has(raw)) continue
    return true
  }
  return false
}

function readParentDirective (text) {
  for (const re of [NAVTREE_PARENT_RE, LEGACY_NAV_PARENT_RE]) {
    const r = new RegExp(re.source, 'gm')
    const m = r.exec(text)
    if (m && m[1]) return m[1].trim()
  }
  return null
}

/**
 * Intentional omission from nav.adoc (`:hide-from-navtree:` or legacy `:page-nav-hidden:`).
 */
function isHideFromNavtree (text) {
  if (!text || typeof text !== 'string') return false
  return matchHideDirective(text, HIDE_FROM_NAVTREE_RE) || matchHideDirective(text, LEGACY_NAV_HIDDEN_RE)
}

/** @deprecated use isHideFromNavtree */
function isPageNavHidden (text, opts) {
  if (opts && opts.attr && opts.attr !== 'page-nav-hidden' && opts.attr !== 'hide-from-navtree') {
    return matchHideDirective(text, new RegExp('^:' + opts.attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*(.*)$', 'gm'))
  }
  return isHideFromNavtree(text)
}

function parseNavtreeDirectives (text) {
  if (!isHideFromNavtree(text)) return null
  return { parent: readParentDirective(text) }
}

module.exports = {
  isHideFromNavtree,
  isPageNavHidden,
  parseNavtreeDirectives,
  HIDE_FROM_NAVTREE_RE,
}
