"use strict";

var Joi = require('joi');

var _ = require('lodash'),
    Neo4j = require('rainbird-neo4j'),
    Q = require('bluebird'),
    debug = require('debug')('neo4j-promised:database');

var node = require('./node'),
    relationship = require('./relationship'),
    responseParser = require('./response-parser');

// This adds extra methods to the promises returned by Bluebird so that
// we can use these in place of `then()`.
responseParser.responsifyPromises(Q.prototype);

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

  db._begin = db.client.beginAsync.bind(db.client);
  db._query = db.client.queryAsync.bind(db.client);
  db._commit = db.client.commitAsync.bind(db.client);
  db._rollback = db.client.rollbackAsync.bind(db.client);
  db._resetTimeout = db.client.resetTimeoutAsync.bind(db.client);
  db._compose = Q.promisify(Neo4j.compose).bind(Neo4j);
  db.escape = Neo4j.escape.bind(Neo4j);

  db._getNodes = function (ids) {
    if (!ids || ids.length === 0) {
      var emptyResponse = [];
      return Q.resolve(emptyResponse);
    }

    var nodeName = 'n';
    var listOfIds = _.map(ids, function (id) { return '"' + id + '"'; }).join(", ");
    var getNodesQuery = "MATCH (" + nodeName + ") WHERE " + nodeName + "." + this.idName + " IN [" + listOfIds + "] RETURN " + nodeName;
    return this.query(getNodesQuery).getResultsAt(nodeName);
  };

  db.begin = function (/* arguments */) {
    var argumentsArray = Array.prototype.slice.call(arguments);

    var callback;
    if (_.isFunction(_.last(argumentsArray))) {
      callback = argumentsArray.pop();
    }
    return this._begin.apply(this, argumentsArray).nodeify(callback);
  };

  db.query = function (/* arguments */) {
    var argumentsArray = Array.prototype.slice.call(arguments);

    var callback;
    if (_.isFunction(_.last(argumentsArray))) {
      callback = argumentsArray.pop();
    }
    return this._query.apply(this, argumentsArray).nodeify(callback);
  };

  db.commit = function (/* arguments */) {
    var argumentsArray = Array.prototype.slice.call(arguments);

    var callback;
    if (_.isFunction(_.last(argumentsArray))) {
      callback = argumentsArray.pop();
    }
    return this._commit.apply(this, argumentsArray).nodeify(callback);
  };

  db.rollback = function (/* arguments */) {
    var argumentsArray = Array.prototype.slice.call(arguments);

    var callback;
    if (_.isFunction(_.last(argumentsArray))) {
      callback = argumentsArray.pop();
    }
    return this._rollback.apply(this, argumentsArray).nodeify(callback);
  };

  db.resetTimeout = function (/* arguments */) {
    var argumentsArray = Array.prototype.slice.call(arguments);

    var callback;
    if (_.isFunction(_.last(argumentsArray))) {
      callback = argumentsArray.pop();
    }
    return this._resetTimeout.apply(this, argumentsArray).nodeify(callback);
  };

  db.compose = function (/* arguments */) {
    var argumentsArray = Array.prototype.slice.call(arguments);

    var callback;
    if (_.isFunction(_.last(argumentsArray))) {
      callback = argumentsArray.pop();
    }
    return this._compose.apply(this, argumentsArray).nodeify(callback);
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
