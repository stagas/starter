import assert from 'assert'
import starter from '../../lib'

describe('starter', () => {
  it('exports a function', () => {
    assert.equal(typeof starter, 'function')
  })

  it('returns an app function', () => {
    let app = starter()
    assert.equal(typeof app, 'object')
  })

  it('has a run method', () => {
    let app = starter()
    assert.equal(typeof app.run, 'function')
  })
})
