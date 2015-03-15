"use strict";

var Joi = require('joi');

var _ = require('lodash'),
    Neo4j = require('rainbird-neo4j'),
    Q = require('bluebird'),
    debug = require('debug')('neo4j-promised:database');

var node = require('./node'),
    relationship = require('./relationship'),
    responseParser = require('./response-parser');

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
  db.responseParser = responseParser;

  db.query = db.client.queryAsync.bind(db.client);

  db._getNodes = function (ids) {
    if (!ids || ids.length === 0) {
      var emptyResponse = [];
      return Q.resolve(emptyResponse);
    }

    var nodeName = 'n';
    var listOfIds = _.map(ids, function (id) { return '"' + id + '"'; }).join(", ");
    var getNodesQuery = "MATCH (" + nodeName + ") WHERE " + nodeName + "." + this.idName + " IN [" + listOfIds + "] RETURN " + nodeName;
    return this.client.queryAsync(getNodesQuery).then(responseParser.getResultsAt(nodeName));
  };

  db.getNodes = function (ids, callback) {
    return this._getNodes(ids).nodeify(callback);
  };

  db.defineNode = function (nodeDefinition) {
    return node(this).generate(nodeDefinition);
  };

  db.defineRelationship = function (relationshipDefinition) {
    return relationship(this).generate(relationshipDefinition);
  };

  return db;

};
