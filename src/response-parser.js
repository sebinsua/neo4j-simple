"use strict";

var _ = require('lodash'),
    debug = require('debug')('neo4j-promised:core:misc');

var misc = module.exports = {};

misc.getResultAt = function (thingIdentifier) {
  return function (results) {
    var result = results[0];
    if (result) {
      return result[thingIdentifier]._data.data;
    } else {
      throw new Error("Node with `id` was not found.");
    }
  };
};

misc.getRelationshipResultAt = function (thingIdentifier) {
  return function (results) {
    var result = results[0];
    if (result) {
      return result[thingIdentifier]._data.data;
    } else {
      throw new Error("Relationship with `id` was not found.");
    }
  };
};

misc.getResultsAt = function (thingIdentifier) {
  return function (results) {
    return _.map(results, function (result) {
      return result[thingIdentifier]._data.data;
    });
  };
};

misc.getRelationshipResultsAt = function (relationshipThingIdentifier, thingIdentifier) {
  return function (results) {
    return _.map(results, function (result) {
      return {
        "relationship": result[relationshipThingIdentifier]._data.data,
        "with": result[thingIdentifier]._data.data
      };
    });
  };
};

misc.getCount = function (results) {
  // [ { count: 1 } ]
  var result = results[0];
  if (result && result.count) {
    return result.count > 0;
  } else {
    throw new Error("Node with `id` was not found.");
  }
};

misc.getResult = misc.getResultAt('n');
misc.getResults = misc.getResultsAt('n');

misc.getRelationshipResult = misc.getRelationshipResultAt('r');
misc.getRelationshipResults = misc.getRelationshipResultsAt('r', 'm');
