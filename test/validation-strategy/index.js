import test from 'ava'

import strategies from '../../src/validation-strategy'

test.skip("is an object", (t) => {
  t.is(typeof strategies, 'object')
});
