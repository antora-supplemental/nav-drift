'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { isPageNavHidden } = require('../lib/page-attrs.js')

describe('page-nav-hidden attribute', () => {
  it('detects empty and true values', () => {
    assert.equal(isPageNavHidden(':page-nav-hidden:\n= Title\n'), true)
    assert.equal(isPageNavHidden(':page-nav-hidden: true\n= Title\n'), true)
    assert.equal(isPageNavHidden(':page-nav-hidden: yes\n'), true)
  })

  it('rejects false values', () => {
    assert.equal(isPageNavHidden(':page-nav-hidden: false\n= Title\n'), false)
    assert.equal(isPageNavHidden(':page-nav-hidden: no\n'), false)
  })
})
