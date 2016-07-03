import Neo4j from 'rainbird-neo4j'
import { is, partial } from 'ramda'

import * as connectionOperations from './connection'

const DEFAULT_URL = 'http://localhost:7474'

function connect (options = {
  url: DEFAULT_URL
}) {
  if (is(String, options)) {
    options = {
      url: options
    }
  }

  const { url = DEFAULT_URL } = options

  let client
  if (options.auth) {
    const { username, password } = options.auth
    client = new Neo4j(url, username, password)
  } else {
    client = new Neo4j(url)
  }

  const boundOperations = {}
  for (const operationName in connectionOperations) {
    boundOperations[operationName] = partial(connectionOperations[operationName], [ client ])
  }

  return client
}

export default connect
