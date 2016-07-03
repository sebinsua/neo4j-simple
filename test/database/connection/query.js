import test from 'ava'
import td from 'testdouble'

import query from '../../../src/database/connection/query'

const client = {
  query: td.function()
}

test('calls the client#query passed in with its remaining arguments', () => {
  query(client, 'a', 'b', 'c')

  td.verify(client.query('a', 'b', 'c'))
})
