import test from 'ava'
import starter from '../../lib'

test('Starter exports a function', t => {
  t.is(typeof starter, 'function')
})

test('Starter function returns an app object', t => {
  let app = starter()
  t.is(typeof app, 'object')
})

test('Starter app has run method', t => {
  let app = starter()
  t.is(typeof app.run, 'function')
})
