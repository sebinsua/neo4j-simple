/* @flow */
import createNodeClass from '../entity/Node'

import { DEFAULT_ID_KEY } from '../constants'

type NodeDefinition = {
  id: ?string,
  label: Array<string>,
  schema?: { [key: string]: Object },
  schemas?: { [key: string]: Object }
}

function defineNode (definition: NodeDefinition = {
  id: DEFAULT_ID_KEY,
  label: []
}) {
  const { id, label, schema, schemas = {} } = definition
  if (schema) {
    schemas.default = schema
  }

  return createNodeClass({
    id,
    label,
    schemas
  })
}

export default defineNode
