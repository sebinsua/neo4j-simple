/* @flow */
import neo4j from 'neo4j-driver'
import { partial } from 'ramda'

import * as connectionOperations from './connection'

const DEFAULT_URL = 'bolt://localhost'

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

  let driver
  if (options.auth) {
    const { username, password } = options.auth
    driver = neo4j.v1.driver(url, neo4j.auth.basic(username, password))
  } else {
    driver = neo4j.v1.driver(url)
  }

  const boundOperations = {}
  for (const operationName in connectionOperations) {
    boundOperations[operationName] = partial(connectionOperations[operationName], [ driver ])
  }

  return boundOperations
}

export default connect
