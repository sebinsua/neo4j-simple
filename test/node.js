var chai = require('chai'),
expect = chai.expect;

var node = require('../src/node');

describe("node", function () {

  describe('#init', function () {

    it("is a constructor", function () {
      expect(node).to.be.a.function;
    });

    it("returns an object with certain defaults", function () {
      var db = { client: null, fakeClient: true };
      var instance = node(db);
      expect(instance).to.be.a.object;
      expect(instance.database).to.equal(db);
      expect(instance.generate).to.be.defined;
      expect(instance.Node).to.be.defined;
    });

  });

  describe('#generate', function () {

  });

  describe('Node', function () {

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
