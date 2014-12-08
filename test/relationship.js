var chai = require('chai'),
expect = chai.expect;

var relationship = require('../src/relationship');

describe("relationship", function () {

  describe('#init', function () {

    it("is a constructor", function () {
      expect(relationship).to.be.a.function;
    });

    it("returns an object with certain defaults", function () {
      var db = { client: null, fakeClient: true };
      var instance = relationship(db);
      expect(instance).to.be.a.object;
      expect(instance.database).to.equal(db);
      expect(instance.generate).to.be.defined;
      expect(instance.Relationship).to.be.defined;
    });

  });

  describe('#generate', function () {

  });

  describe('Relationship', function () {

    describe('#init', function () {

    });

    describe('#save', function () {

    });

    describe('#delete', function () {

    });

    describe('#toString', function () {

    });

  });

});
