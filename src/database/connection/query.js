/* @flow */

type Driver = {
  session: Function
}

// TODO: [`Session`](http://neo4j.com/docs/api/javascript-driver/current/class/src/v1/session.js~Session.html).

// TODO: `query` --> `run`. To begin with alias but only expose `query`.
// However leave a comment about `run` supporting multiple queries and result sets, while query forces one.

// TODO `oneRow` --> `queryOneRow`.

// TODO: `Integer` transformations should be made on `query`, etc.

function query (driver: Driver, ...args: Array<any>) {
  const session = driver.session()
  return session.run(...args).subscribe({
    onCompleted: () => session.close()
  })
}

export default query
