/* @flow */
import createNodeClass from '../entity/Node'
import type { NodeDefinition } from '../entity/Node' // eslint-disable-line no-duplicate-imports

import { DEFAULT_ID_KEY } from '../constants'

// By default the id passed into the library is 'id'.
// See: http://blog.armbruster-it.de/2013/12/indexing-in-neo4j-an-overview/
// By default the default id key is `'id'`
// id: constants.DEFAULT_ID_KEY,

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
