"use strict";

var defaults = require('../config/defaults'),
_ = require('lodash'),
neo4j = require('neo4j'),
Q = require('bluebird'),
debug = require('debug')('neo4j-promised:core:database');

var config = _.defaults({
  'neo4j': process.env.NEO4J_URL || process.env.GRAPHENEDB_URL
}, defaults);

// This create *Async promise-returning versions of all of the standard node-style callback-returning methods.
Q.promisifyAll(neo4j.GraphDatabase.prototype);

var db = module.exports = new neo4j.GraphDatabase(config.neo4j);

db.getNodes = function (ids) {
  if (!ids || ids.length === 0) {
    var emptyResponse = [];
    return Q.resolve(emptyResponse);
  }

  var listOfIds = _.map(ids, function (id) { return '"' + id + '"'; }).join(", ");
  return db.queryAsync("MATCH (n) WHERE n.id IN [" + listOfIds + "] RETURN n").then(function (nodesResponse) {
    return _.map(nodesResponse, function (nr) {
      return nr.n._data.data;
    });
  });
};
