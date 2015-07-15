"use strict";

var Joi = require('joi');

var Neo4j = require('rainbird-neo4j');

var Promise = require('native-or-bluebird'),
    thenifyAll = require('thenify-all');

var thenify = thenifyAll.thenify;

var node = require('./node'),
    relationship = require('./relationship'),
    responseParser = require('./response-parser');

var sourceifyPromises = require('./sourceify-promises');

var decorateError = function decorateErrorWithName(error) {
  var errorMessage = error.message || '';
  var matches = /\(([^)]+)\)/.exec(errorMessage);
  var code = matches[1];
  switch (code) {
    case 'Neo.ClientError.Security.AuthenticationFailed':
    case 'Neo.ClientError.Security.AuthenticationRateLimit':
    case 'Neo.ClientError.Security.AuthorizationFailed':
      error.name = 'Neo4jAuthError';
      break;
    default:
      error.name = 'Neo4jError';
      break;
  }

  throw error;
};

// This adds extra methods to the promises returned by Bluebird so that
// we can use these in place of `then()`.
sourceifyPromises(Promise.prototype, responseParser);

// This create promise-returning versions of all of the standard
// node-style callback-returning methods.
Neo4j.prototype = thenifyAll(Neo4j.prototype);

module.exports = function (url, options) {
  options = options || {};
  options.idName = options.idName || 'id';
  url = url || "http://localhost:7474/";

  var hasCredentials = options.auth !== undefined;

  var client;
  if (hasCredentials) {
    var username = options.auth.username;
    var password = options.auth.password;
    client = new Neo4j(url, username, password);
  } else {
    client = new Neo4j(url);
  }

  var db = {};

  db.DIRECTION = {
    LEFT: 'L',
    RIGHT: 'R',
    NONE: null
  };

  db.url = url;
  db.client = client;
  db.idName = options.idName;

  db.Joi = Joi;

  db.begin = db.client.begin.bind(db.client);
  db.query = function query(/* arguments */) {
    var _client = db.client;
    return _client.query.apply(db.client, arguments).catch(decorateError);
  };
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
