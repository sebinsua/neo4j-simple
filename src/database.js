"use strict";

var Joi = require('joi');

var Neo4j = require('rainbird-neo4j'),
    debug = require('debug')('neo4j-simple:database');

var Promise = require('native-or-bluebird'),
    thenifyAll = require('thenify-all'),
    thenify = thenifyAll.thenify;

var node = require('./node'),
    relationship = require('./relationship'),
    responseParser = require('./response-parser');

var sourceifyPromises = require('./sourceify-promises');

// This adds extra methods to the promises returned by Bluebird so that
// we can use these in place of `then()`.
sourceifyPromises(Promise.prototype, responseParser);

// This create promise-returning versions of all of the standard
// node-style callback-returning methods.
Neo4j.prototype = thenifyAll(Neo4j.prototype);

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

  db.begin = db.client.begin.bind(db.client);
  db.query = db.client.query.bind(db.client);
  db.commit = db.client.commit.bind(db.client);
  db.rollback = db.client.rollback.bind(db.client);
  db.resetTimeout = db.client.resetTimeout.bind(db.client);
  db.compose = thenify(Neo4j.compose).bind(Neo4j);
  db.escape = Neo4j.escape.bind(Neo4j);

  db.getNodes = function (ids) {
    if (!ids || ids.length === 0) {
      var emptyResponse = [];
      return Promise.resolve(emptyResponse);
    }

    var nodeName = 'n';
    var listOfIds = ids.map(function (id) { return '"' + id + '"'; }).join(", ");
    var getNodesQuery = "MATCH (" + nodeName + ") WHERE " + nodeName + "." + this.idName + " IN [" + listOfIds + "] RETURN " + nodeName;
    return this.query(getNodesQuery).getResults(nodeName);
  };

  db.defineNode = function (nodeDefinition) {
    return node(this).generate(nodeDefinition);
  };

  db.defineRelationship = function (relationshipDefinition) {
    return relationship(this).generate(relationshipDefinition);
  };

  return db;

};
