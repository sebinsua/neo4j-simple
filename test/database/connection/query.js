import test from 'ava'
import td from 'testdouble'

import query from '../../../src/database/connection/query'

function getDriver () {
  const getSession = td.function()
  const runQuery = td.function()
  const closeSession = td.function()
  const subscribeToQuery = td.function()

  td.when(runQuery(), { ignoreExtraArgs: true }).thenReturn({
    subscribe: subscribeToQuery
  })

  td.when(getSession()).thenReturn({
    run: runQuery,
    close: closeSession
  })

  const driver = {
    session: getSession
  }

  return { driver, getSession, runQuery }
}

test('creates a session and runs a statement with some parameters', () => {
  const { driver, getSession, runQuery } = getDriver()

  const statement = 'MATCH (alice { name: {name} }) RETURN alice.age'
  const parameters = { name: 'Alice' }
  query(driver, statement, parameters)

  td.verify(runQuery(statement, parameters))
})
