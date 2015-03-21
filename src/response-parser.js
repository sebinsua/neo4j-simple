"use strict";

var _ = require('lodash'),
    debug = require('debug')('neo4j-simple:response-parser');

function isNotUndefined(value) {
  return value !== undefined;
}

function propertyOf(object) {
  return function (key) {
    return object[key];
  };
}

function getFirstQueryResults(response) {
  var queries = response[0];
  var firstQueryResults = queries[0] || [];
  return firstQueryResults;
}
// TODO: Fix the errors.

function getResultAt(type /* thingIdentifier, ... , thingIdentifierN */) {
  var thingIdentifiers = Array.prototype.slice.call(arguments, 1);
  if (thingIdentifiers.length === 0) {
    throw new Error("No properties were specified to be matched by the " + type + " response parser.");
  }

  return function (response) {
    var firstQueryResults = getFirstQueryResults(response);
    var result = firstQueryResults[0];
    if (!result) {
      throw new Error(type + " was not found.");
    }

    var hasSomeProperties = _.some(_.map(thingIdentifiers, propertyOf(result)), isNotUndefined);
    if (hasSomeProperties) {
      if (thingIdentifiers.length === 1) {
        return result[thingIdentifiers[0]];
      } else {
        return _.pick(result, thingIdentifiers);
      }
    } else {
      throw new Error(type + "s named " + thingIdentifiers.join(', ') + " was not found.");
    }
  };
}

function getResultsAt(type /* thingIdentifier, ... , thingIdentifierN */) {
  var thingIdentifiers = Array.prototype.slice.call(arguments, 1);
  if (thingIdentifiers.length === 0) {
    throw new Error("No properties were specified to be matched by the " + type + " response parser.");
  }

  return function (response) {
    var firstQueryResults = getFirstQueryResults(response);

    return _.chain(firstQueryResults).map(function (result) {
      if (thingIdentifiers.length === 1) {
        return result[thingIdentifiers[0]];
      } else {
        return _.pick(result, thingIdentifiers);
      }
    }).filter(function (result) {
      if (thingIdentifiers.length === 1) {
        return result !== undefined;
      } else {
        var hasSomeProperties = _.some(_.map(thingIdentifiers, propertyOf(result)), isNotUndefined);
        return hasSomeProperties;
      }
    }).value();
  };
}

var responseParser = {
  getResult: getResultAt('Node', 'n'),
  getCount: getResultAt('Count', 'count(n)'),
  getRelationshipResult: getResultAt('Relationship', 'r', 'n', 'm'),
  getResults: getResultsAt('Node', 'n'),
  getRelationshipResults: getResultsAt('Relationship', 'r', 'n', 'm')
};

module.exports = responseParser;
