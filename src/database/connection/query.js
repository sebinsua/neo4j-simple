/* @flow */

type QueryClient = {
  query: Function
}

function query (client: QueryClient, ...args: Array<any>) {
  return client.query(...args)
}

export default query
