"use strict";

var Joi = require('joi');

var node = require('./node'),
    relationship = require('./relationship');

var _ = require('lodash'),
    Neo4j = require('rainbird-neo4j'),
    Q = require('bluebird'),
    debug = require('debug')('neo4j-promised:database');

// This create *Async promise-returning versions of all of the standard
// node-style callback-returning methods.
Q.promisifyAll(Neo4j.prototype);

module.exports = function (url, options) {
  options = options || {};
  options.idName = options.idName || 'id';

  var db = {};

  db.DIRECTION = {
    LEFT: 'L',
    RIGHT: 'R',
    NONE: null
  };

  db.url = url || "http://localhost:7474/";
  db.client = new Neo4j(db.url);
  db.idName = options.idName;

  db.Joi = Joi;

  db.query = db.client.queryAsync.bind(db.client);

  db.getNodes = function (ids) {
    if (!ids || ids.length === 0) {
      var emptyResponse = [];
      return Q.resolve(emptyResponse);
    }

    var nodeName = 'n';
    var listOfIds = _.map(ids, function (id) { return '"' + id + '"'; }).join(", ");
    return this.client.queryAsync("MATCH (" + nodeName + ") WHERE " + nodeName + "." + this.idName + " IN [" + listOfIds + "] RETURN " + nodeName).then(function (response) {
      var queries = response[0];
      var firstQueryResults = queries[0] || [];
      return _.map(firstQueryResults, function (nr) {
        return nr[nodeName];
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
