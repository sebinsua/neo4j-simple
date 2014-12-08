var chai = require('chai'),
expect = chai.expect;

var db = require('../');

describe("database", function () {

  describe('#init', function () {

    it("is a constructor", function () {
      expect(db).to.be.a.function;
    });

    it("returns an object with certain defaults", function () {
      var instance = db();
      expect(instance).to.be.a.object;
      expect(instance.url).to.equal('http://localhost:7474/');
      expect(instance.client).to.be.defined;
      expect(instance.Joi).to.be.defined;
    });

  });

  describe('#query', function () {

  });

  describe('#getNodes', function () {

  });

  describe('#defineNode', function () {

  });

  describe('#defineRelationship', function () {

  });

});
