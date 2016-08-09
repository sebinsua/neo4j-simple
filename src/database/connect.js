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

// TODO: `connect` --> `createConnection`;
// the point is that it delegates connecting responsibility to the driver on querying, updating, saving, etc.

// TODO: `createConnection` should use `createDriver` internally.
// Drivers are reasonably expensive to create.
// Therefore [create one](http://neo4j.com/docs/api/javascript-driver/current/function/index.html#static-function-driver)
// and then use it to create sessions. Close them responsibly. This probably means distinguishing between creating
// a driver and `connect`.

// TODO: validationStrategy: JoiValidationStrategy
// The default `validationStrategy` will be JoiValidationStrategy.

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
