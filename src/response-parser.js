"use strict";

var _ = require('lodash'),
    debug = require('debug')('neo4j-promised:response-parser');

var responseParser = module.exports = {};

responseParser.getResultAt = function (thingIdentifier) {
  return function (results) {
    var result = results[0];
    if (result) {
      return result[thingIdentifier]._data.data;
    } else {
      throw new Error("Node with `id` was not found.");
    }
  };
};

responseParser.getRelationshipResultAt = function (thingIdentifier) {
  return function (results) {
    var result = results[0];
    if (result) {
      return result[thingIdentifier]._data.data;
    } else {
      throw new Error("Relationship with `id` was not found.");
    }
  };
};

responseParser.getResultsAt = function (thingIdentifier) {
  return function (results) {
    return _.map(results, function (result) {
      return result[thingIdentifier]._data.data;
    });
  };
};

responseParser.getRelationshipResultsAt = function (relationshipThingIdentifier, thingIdentifier) {
  return function (results) {
    return _.map(results, function (result) {
      return {
        "relationship": result[relationshipThingIdentifier]._data.data,
        "with": result[thingIdentifier]._data.data
      };
    });
  };
};

responseParser.getCount = function (results) {
  // [ { count: 1 } ]
  var result = results[0];
  if (result && result.count) {
    return result.count > 0;
  } else {
    throw new Error("Node with `id` was not found.");
  }
};

responseParser.getResult = responseParser.getResultAt('n');
responseParser.getResults = responseParser.getResultsAt('n');

responseParser.getRelationshipResult = responseParser.getRelationshipResultAt('r');
responseParser.getRelationshipResults = responseParser.getRelationshipResultsAt('r', 'm');
