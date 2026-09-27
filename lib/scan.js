'use strict'

const fs = require('node:fs')
const path = require('node:path')

const XREF_RE = /xref:([^\[]+)\[/g
const LINK_RE = /link:([^\[]+)\[/g

function walk (root, pred, files = []) {
  if (!fs.existsSync(root)) return files
  const st = fs.statSync(root)
  if (st.isFile()) {
    if (pred(root)) files.push(root)
    return files
  }
  for (const name of fs.readdirSync(root)) {
    if (name === 'node_modules' || name === '.git' || name === 'build') continue
    walk(path.join(root, name), pred, files)
  }
  return files
}

function rel (root, file) {
  return path.relative(root, file).split(path.sep).join('/')
}

function normalizePageId (raw) {
  let s = raw.trim().split('#')[0].trim()
  if (s.includes(':')) {
    const parts = s.split(':')
    s = parts[parts.length - 1]
  }
  if (s.endsWith('.adoc')) s = s.slice(0, -5)
  if (s.endsWith('.html')) s = s.slice(0, -5)
  return s.replace(/\\/g, '/').replace(/^\.\//, '')
}

function collectNavEntries (navFiles, root) {
  const entries = []
  for (const file of navFiles) {
    const text = fs.readFileSync(file, 'utf8')
    const source = rel(root, file)
    for (const re of [XREF_RE, LINK_RE]) {
      const r = new RegExp(re.source, 'g')
      let m
      while ((m = r.exec(text))) {
        const target = normalizePageId(m[1])
        if (!target || target.startsWith('http')) continue
        entries.push({ target, source, raw: m[1].trim() })
      }
    }
  }
  return entries
}

function collectPages (pagesRoot, root) {
  const files = walk(pagesRoot, (f) => f.endsWith('.adoc'))
  const pages = new Map()
  for (const f of files) {
    const r = rel(root, f)
    let id = r
    const m = r.match(/modules\/[^/]+\/pages\/(.+)\.adoc$/)
    if (m) id = m[1]
    else if (r.endsWith('.adoc')) id = r.slice(0, -5)
    pages.set(id.replace(/\\/g, '/'), r)
    pages.set(path.basename(id), r)
  }
  return pages
}

function scanNavDrift (opts = {}) {
  const root = path.resolve(opts.root || '.')
  const navFiles = walk(root, (f) => {
    const base = path.basename(f)
    return base === 'nav.adoc' || base === 'site-nav.adoc' || base.endsWith('-nav.adoc')
  })
  const pagesDir = opts.pagesDir ? path.resolve(root, opts.pagesDir) : root
  const pages = collectPages(pagesDir, root)
  const entries = collectNavEntries(navFiles, root)
  const findings = []
  const navTargets = new Set()

  for (const e of entries) {
    navTargets.add(e.target)
    const hit = pages.has(e.target) ||
      pages.has(e.target + '/index') ||
      [...pages.keys()].some((k) => k === e.target || k.endsWith('/' + e.target) || k.endsWith(e.target))
    if (!hit) {
      findings.push({
        target: e.target,
        classification: 'missing',
        kind: 'nav-missing-page',
        sources: [e.source],
        raw: e.raw,
      })
    }
  }

  if (opts.requireInNav) {
    const published = walk(pagesDir, (f) => /modules[\\/][^\\/]+[\\/]pages[\\/].+\.adoc$/i.test(f) && !f.includes(`${path.sep}partials${path.sep}`))
    for (const f of published) {
      const r = rel(root, f)
      const m = r.match(/modules\/[^/]+\/pages\/(.+)\.adoc$/)
      const id = m ? m[1] : r.slice(0, -5)
      if ([...navTargets].some((t) => t === id || id.endsWith('/' + t) || t.endsWith('/' + id) || t === path.basename(id))) {
        continue
      }
      findings.push({
        target: id,
        classification: 'orphan',
        kind: 'page-missing-from-nav',
        sources: [r],
      })
    }
  }

  return {
    root,
    navFiles: navFiles.map((f) => rel(root, f)),
    pageCount: new Set([...pages.values()]).size,
    navEntryCount: entries.length,
    findings,
  }
}

module.exports = { scanNavDrift, normalizePageId, collectNavEntries, collectPages }
