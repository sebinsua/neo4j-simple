import test from 'ava'

import defineNode from '../../src/database/defineNode'

test('generates a class', (t) => {
  const Node = defineNode({})
  t.is(typeof Node, 'function')
})

test('can generates a node with a default guard', (t) => {
  const definition = {
    schema: {}
  }
  const Node = defineNode(definition)
  t.is(Node.guards.default, definition.schema)
})

test('can generate a node with a particular display name', (t) => {
  const Node = defineNode({
    label: 'User'
  })
  t.is(Node.displayName, 'UserNode')
})
