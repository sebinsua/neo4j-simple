/* @flow */
import { toPairs } from 'ramda'

import createGuard from './createGuard'

type Schema = { [key: string]: Object }

function createGuards (schemas: Schema = {}) {
  const guards = {}
  for (const [ name, schema ] of toPairs(schemas)) {
    guards[name] = createGuard(schema)
  }
  return guards
}

export default createGuards
