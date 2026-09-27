#!/usr/bin/env node
'use strict'
const path = require('node:path')
const { scanNavDrift, buildReport, writeOutputs } = require('../lib/index.js')
const { createProgress } = require('../lib/progress.js')

const TOOL = 'nav-drift'

function parseArgs (argv) {
  const opts = { root: '.', out: 'nav-drift-report', requireInNav: false, fail: false, reportEmail: 'support@devcentr.org' }
  const args = argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--root') opts.root = args[++i]
    else if (a === '--out') opts.out = args[++i]
    else if (a === '--require-in-nav') opts.requireInNav = true
    else if (a === '--pages-dir') opts.pagesDir = args[++i]
    else if (a === '--fail') opts.fail = true
    else if (a === '--report-email') opts.reportEmail = args[++i]
    else if (a === '--help' || a === '-h') opts.help = true
  }
  return opts
}

function main () {
  const opts = parseArgs(process.argv)
  if (opts.help) {
    console.log('Usage: nav-drift [--root DIR] [--pages-dir DIR] [--require-in-nav] [--out DIR] [--fail]\nSupport: support@devcentr.org')
    process.exit(0)
  }
  const progress = createProgress({ id: TOOL, stream: process.stderr })
  progress.starting('starting nav drift scan')
  progress.enumStart('nav files')
  const scan = scanNavDrift({
    ...opts,
    onFile (n) { progress.enumTick(n) },
  })
  progress.enumDone(scan.navFiles.length, scan.navEntryCount + ' entries')
  const report = buildReport(scan, { reportEmail: opts.reportEmail })
  writeOutputs(report, path.resolve(opts.out))
  progress.done(
    report.summary.findings + ' finding(s) (missing=' + report.summary.missing +
    ', orphan=' + report.summary.orphan + ')'
  )
  if (opts.fail && report.summary.findings > 0) process.exit(1)
}
main()
