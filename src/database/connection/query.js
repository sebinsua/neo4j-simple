/* @flow */

type QueryClient = {
  query: function
}

function query (client: QueryClient, ...args: Array<any>) {
  return client.query(...args)
}

export default query
