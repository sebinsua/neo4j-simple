import test from 'ava'

import responseParser from '../../src/response-parser'

test.skip("is an object", (t) => {
  t.is(typeof responseParser, 'object')
});
