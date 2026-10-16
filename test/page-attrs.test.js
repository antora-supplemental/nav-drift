'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { isHideFromNavtree, parseNavtreeDirectives } = require('../lib/page-attrs.js')

describe('hide-from-navtree directive', () => {
  it('detects hide-from-navtree and legacy page-nav-hidden', () => {
    assert.equal(isHideFromNavtree(':hide-from-navtree:\n= Title\n'), true)
    assert.equal(isHideFromNavtree(':page-nav-hidden:\n= Title\n'), true)
    assert.equal(isHideFromNavtree(':hide-from-navtree: false\n'), false)
  })

  it('reads navtree-parent', () => {
    const meta = parseNavtreeDirectives(':hide-from-navtree:\n:navtree-parent: changelog.adoc\n')
    assert.ok(meta)
    assert.equal(meta.parent, 'changelog.adoc')
  })
})
