/* @flow */
import createNodeClass from '../entity/Node'
import type { NodeDefinition } from '../entity/Node' // eslint-disable-line no-duplicate-imports

import { DEFAULT_ID_KEY } from '../constants'

function defineNode ({
  id = DEFAULT_ID_KEY,
  label = [],
  schema,
  schemas = {}
}: NodeDefinition) {
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
