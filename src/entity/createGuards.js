import { toPairs } from 'ramda'

import createGuard from './createGuard'

function createGuards (schemas = {}) {
  const guards = {}
  for (const [ name, schema ] of toPairs(schemas)) {
    guards[name] = createGuard(schema)
  }
  return guards
}

export default createGuards
