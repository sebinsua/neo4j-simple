import generateNodeClass from '../entity/Node'

function defineNode (definition) {
  const Node = generateNodeClass(definition)
  return Node
}

export default defineNode
