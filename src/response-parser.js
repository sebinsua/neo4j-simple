"use strict";

var _ = require('lodash'),
    debug = require('debug')('neo4j-promised:response-parser');

var responseParser = module.exports = {};

responseParser.getResultAt = function (thingIdentifier) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    var result = firstQueryResults[0];
    if (result) {
      return result[thingIdentifier];
    } else {
      throw new Error("Node with `id` was not found.");
    }
  };
};

responseParser.getRelationshipResultAt = function (relationship, subject, object) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    var result = firstQueryResults[0];
    if (result) {
      return {
        "relationship": result[relationship],
        "subject": result[subject],
        "object": result[object]
      };
    } else {
      throw new Error("Relationship with `id` was not found.");
    }
  };
};

responseParser.getResultsAt = function (thingIdentifier) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    return _.map(firstQueryResults, function (result) {
      return result[thingIdentifier];
    });
  };
};

responseParser.getRelationshipResultsAt = function (relationship, subject, object) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    return _.map(firstQueryResults, function (result) {
      return {
        "relationship": result[relationship],
        "subject": result[subject],
        "object": result[object]
      };
    });
  };
};

responseParser.getCountAt = function (thingIdentifier) {
  return function (response) {
    // [ { count: 1 } ]
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    var result = firstQueryResults[0];
    if (result && result[thingIdentifier] !== false) {
      return result[thingIdentifier];
    } else {
      throw new Error("Count of `" + thingIdentifier + "` was not found.");
    }
  };
};

responseParser.getResult = responseParser.getResultAt('n');
responseParser.getResults = responseParser.getResultsAt('n');
responseParser.getCount = responseParser.getCountAt('count(n)');

responseParser.getRelationshipResult = responseParser.getRelationshipResultAt('r', 'n', 'm');
responseParser.getRelationshipResults = responseParser.getRelationshipResultsAt('r', 'n', 'm');
