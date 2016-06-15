import test from 'ava'

import JoiValidationStrategy from '../../src/validation-strategy/JoiValidationStrategy'

test.skip("is an object", (t) => {
  t.is(typeof JoiValidationStrategy, 'object')
});
