import test from 'ava'

import responseParser from '../../src/response-parser'

test.skip('should be able to successfully parse a response', (t) => {
  var response = [
    [
      [
        {
          'n': {
            'hello': 'world'
          }
        }
      ]
    ],
    {}
  ];

  t.deepEqual(responseParser.getResult()(response), {
    'hello': 'world'
  });
});

test.skip('should be able to parse an empty response', (t) => {
  var response = [
    [
      []
    ],
    {}
  ];

  t.throws(function () {
    responseParser.getResult()(response)
  }, Error, "Node was not found.");
});
