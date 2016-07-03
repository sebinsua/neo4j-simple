import test from 'ava'

import connect from '../../src/database/connect'

test('is a function', (t) => {
  t.is(typeof connect, 'function')
});

test('returns an object containing operations', (t) => {
  const operations = connect();
  t.is(typeof operations, 'object')

  const { query } = operations
  t.is(typeof query, 'function')
});
