'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { buildGroupings, buildTriageHtml, buildTriageActions, assets } = require('@antora-supplemental/triage-ux-kit')

function buildReport (scan, { reportEmail = 'support@devcentr.org', ciTrigger = null } = {}) {
  const findings = scan.findings || []
  const groupings = buildGroupings(findings)
  const report = {
    version: 1,
    tool: 'nav-drift',
    generatedAt: new Date().toISOString(),
    summary: {
      navFiles: (scan.navFiles || []).length,
      pageCount: scan.pageCount,
      navEntryCount: scan.navEntryCount,
      findings: findings.length,
      missing: findings.filter((f) => f.classification === 'missing').length,
      orphan: findings.filter((f) => f.classification === 'orphan').length,
      groupingDefault: groupings.default,
    },
    findings,
    groupings,
    meta: { reportEmail, ciTrigger },
  }
  report.actions = buildTriageActions(report, { ciTrigger, toolName: 'Nav Drift' })
  return report
}

function writeOutputs (report, outDir) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'index.html'), buildTriageHtml({
    title: 'Nav Drift',
    toolName: 'Nav Drift',
    reportEmail: report.meta?.reportEmail || 'support@devcentr.org',
    ciTrigger: report.meta?.ciTrigger,
    lede: 'Nav entries that 404 vs pages missing from nav.',
  }))
  if (fs.existsSync(assets.cssPath)) fs.copyFileSync(assets.cssPath, path.join(outDir, 'triage-ux.css'))
  if (fs.existsSync(assets.jsPath)) fs.copyFileSync(assets.jsPath, path.join(outDir, 'triage-ux.js'))
}

module.exports = { buildReport, writeOutputs }
