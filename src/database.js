"use strict";

var Joi = require('joi');

var node = require('./node'),
    relationship = require('./relationship');

var _ = require('lodash'),
    neo4j = require('neo4j'),
    Q = require('bluebird'),
    debug = require('debug')('neo4j-promised:core:database');

// This create *Async promise-returning versions of all of the standard node-style callback-returning methods.
Q.promisifyAll(neo4j.GraphDatabase.prototype);

module.exports = function (url) {

  var db = {};

  db.url = url;
  db.client = new neo4j.GraphDatabase(url);

  db.Joi = Joi;

  db.getNodes = function (ids) {
    if (!ids || ids.length === 0) {
      var emptyResponse = [];
      return Q.resolve(emptyResponse);
    }

    var listOfIds = _.map(ids, function (id) { return '"' + id + '"'; }).join(", ");
    return this.client.queryAsync("MATCH (n) WHERE n.id IN [" + listOfIds + "] RETURN n").then(function (nodesResponse) {
      return _.map(nodesResponse, function (nr) {
        return nr.n._data.data;
      });
    });
  };

  db.defineNode = function (nodeDefinition) {
    return node(this).generate(nodeDefinition);
  };

  db.defineRelationship = function (relationshipDefinition) {
    return relationship(this).generate(relationshipDefinition);
  };

  return db;

};
