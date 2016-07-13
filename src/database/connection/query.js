/* @flow */

type Driver = {
  session: Function
}

function query (driver: Driver, ...args: Array<any>) {
  const session = driver.session()
  return session.run(...args).subscribe({
    onCompleted: () => session.close()
  })
}

export default query
