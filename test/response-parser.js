var chai = require('chai'),
expect = chai.expect;

var responseParser = require('../src/response-parser');

describe("response-parser", function () {

  it("is an object", function () {
    expect(responseParser).to.be.a.object;
  });

  describe('#getCount', function () {

    it('should be able to successfully parse a response', function () {
      var response = [
        [
          [
            {
              'count(n)': 1
            }
          ]
        ],
        {}
      ];

      expect(responseParser.getCount()(response)).to.equal(1);
    });

    it('should be able to parse an empty response', function () {
      var response = [
        [
          [
            {
              'count(n)': 0
            }
          ]
        ],
        {}
      ];

      expect(responseParser.getCount()(response)).to.equal(0);
    });

  });

  describe('#getResult', function () {

    it('should be able to successfully parse a response', function () {
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

      expect(responseParser.getResult()(response)).to.eql({
        'hello': 'world'
      });
    });

    it('should be able to parse an empty response', function () {
      var response = [
        [
          []
        ],
        {}
      ];

      expect(function () {
        responseParser.getResult()(response)
      }).to.throw(Error, "Node was not found.");
    });

  });

  describe('#getResults', function () {

    it('should be able to successfully parse a response', function () {
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

      expect(responseParser.getResults()(response)).to.eql([
        {
          'hello': 'world'
        }
      ]);
    });

    it('should be able to parse an empty response', function () {
      var response = [
        [
          []
        ],
        {}
      ];

      expect(responseParser.getResults()(response)).to.eql([]);
    });

  });

  describe('#getRelationshipResult', function () {

    it('should be able to successfully parse a response', function () {
      var response = [
        [
          [
            {
              'n': {
                'a': 'bc'
              },
              'r': {
                'd': 'ef'
              },
              'm': {
                'g': 'hi'
              }
            }
          ]
        ],
        {}
      ];

      expect(responseParser.getRelationshipResult()(response)).to.eql({
        'n': {
          'a': 'bc'
        },
        'r': {
          'd': 'ef'
        },
        'm': {
          'g': 'hi'
        }
      });
    });

  });

  describe('#getRelationshipResults', function () {

    it('should be able to successfully parse a response', function () {
      var response = [
        [
          [
            {
              'n': {
                'a': 'bc'
              },
              'r': {
                'd': 'ef'
              },
              'm': {
                'g': 'hi'
              }
            }
          ]
        ],
        {}
      ];

      expect(responseParser.getRelationshipResults()(response)).to.eql([
        {
          'n': {
            'a': 'bc'
          },
          'r': {
            'd': 'ef'
          },
          'm': {
            'g': 'hi'
          }
        }
      ]);
    });

  });

});
