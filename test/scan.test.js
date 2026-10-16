'use strict'
const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { scanNavDrift } = require('../lib/scan.js')
const { buildReport } = require('../lib/report.js')

describe('nav-drift', () => {
  let tmp
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nav-drift-'))
    fs.mkdirSync(path.join(tmp, 'modules', 'ROOT', 'pages'), { recursive: true })
    fs.writeFileSync(path.join(tmp, 'modules', 'ROOT', 'nav.adoc'), `* xref:index.adoc[Home]
* xref:gone.adoc[Gone]
* xref:guide.adoc[Guide]
`)
    fs.writeFileSync(path.join(tmp, 'modules', 'ROOT', 'pages', 'index.adoc'), '= Home\n')
    fs.writeFileSync(path.join(tmp, 'modules', 'ROOT', 'pages', 'guide.adoc'), '= Guide\n')
    fs.writeFileSync(path.join(tmp, 'modules', 'ROOT', 'pages', 'orphan.adoc'), '= Orphan\n')
    fs.writeFileSync(
      path.join(tmp, 'modules', 'ROOT', 'pages', 'hidden-detail.adoc'),
      ':page-nav-hidden:\n= Hidden\n'
    )
  })
  after(() => fs.rmSync(tmp, { recursive: true, force: true }))

  it('flags missing nav targets and optional page-missing-from-nav', () => {
    const scan = scanNavDrift({ root: tmp, requireInNav: true })
    assert.ok(scan.findings.some((f) => f.kind === 'nav-missing-page' && f.target === 'gone'))
    assert.ok(scan.findings.some((f) => f.kind === 'page-missing-from-nav' && f.target === 'orphan'))
    assert.ok(!scan.findings.some((f) => f.target === 'hidden-detail'))
    assert.ok(scan.intentionalNavHidden.some((f) => f.kind === 'nav-hidden-page' && f.target === 'hidden-detail'))
    const report = buildReport(scan)
    assert.equal(report.tool, 'nav-drift')
    assert.ok(report.summary.missing >= 1)
    assert.equal(report.summary.intentionalNavHidden, 1)
  })
})
