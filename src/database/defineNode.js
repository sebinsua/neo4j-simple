import createNodeClass from '../entity/Node'

import { DEFAULT_ID_KEY } from '../constants'

function defineNode (definition = {
  id: DEFAULT_ID_KEY,
  label: []
}) {
  const { id, label, schemas = {} } = definition
  if (definition.schema) {
    schemas.default = definition.schema
  }

  return createNodeClass({
    id,
    label,
    schemas
  })
}

export default defineNode
