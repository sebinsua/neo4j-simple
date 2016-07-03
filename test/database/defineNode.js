import test from 'ava'

import defineNode from '../../src/database/defineNode'

test('generates a class', (t) => {
  const Node = defineNode({})
  t.is(Node.hello, 'there')
})
