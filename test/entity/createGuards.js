import test from 'ava'

import createGuards from '../../src/entity/createGuards'

test('has same keys within its output', (t) => {
  const schemas = {
    default: {},
    register: {},
    profileUpdate: {}
  }
  const guards = createGuards(schemas)
  t.deepEqual(Object.keys(guards), Object.keys(schemas))
})
