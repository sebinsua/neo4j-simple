import test from 'ava'

import connect from '../../src/database/connect'

test.skip("is a function", (t) => {
  t.is(typeof connect, 'function')
});

test.skip("returns an object with certain defaults", (t) => {
  var instance = connect();
  t.is(typeof instance, 'object')
  t.is(instance.url, 'http://localhost:7474/')
  t.not(typeof instance.client, 'undefined')
  t.not(typeof instance.Joi, 'undefined')
});
