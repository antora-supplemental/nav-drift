'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { isHidePage, isHideFromNavtree, parseNavtreeDirectives } = require('../lib/page-attrs.js')

describe('hide-page directive', () => {
  it('detects hide-page and legacy aliases', () => {
    assert.equal(isHidePage(':hide-page:\n= Title\n'), true)
    assert.equal(isHideFromNavtree(':hide-from-navtree:\n= Title\n'), true)
    assert.equal(isHidePage(':page-nav-hidden:\n= Title\n'), true)
    assert.equal(isHidePage(':hide-page: false\n'), false)
  })

  it('reads navtree-parent', () => {
    const meta = parseNavtreeDirectives(':hide-page:\n:navtree-parent: changelog.adoc\n')
    assert.ok(meta)
    assert.equal(meta.parent, 'changelog.adoc')
  })
})
