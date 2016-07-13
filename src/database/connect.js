/* @flow */
import Neo4j from 'rainbird-neo4j'
import { partial } from 'ramda'

import * as connectionOperations from './connection'

const DEFAULT_URL = 'http://localhost:7474'

type ConnectOptions = {
  url: string,
  auth?: {
    username: string,
    password: string
  }
}

function connect (urlOrOptions: string|ConnectOptions = {
  url: DEFAULT_URL
}) {
  let options
  if (typeof urlOrOptions === 'string') {
    options = { url: urlOrOptions }
  } else {
    options = urlOrOptions
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
