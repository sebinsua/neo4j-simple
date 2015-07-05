"use strict";

var debug = require('debug')('neo4j-simple:response-parser');

var _ = require('./helpers');

function checkForThingIdentifiers(result, thingIdentifiers) {
  var isNotUndefined = function (value) {
    return typeof value !== undefined;
  };

  return _.some(thingIdentifiers.map(_.propertyOf(result)), isNotUndefined);
}

function getFirstQueryResults(response) {
  var queries = response[0];
  var firstQueryResults = queries[0] || [];
  return firstQueryResults;
}

function getResultAt(type /* thingIdentifier, ... , thingIdentifierN */) {
  var thingIdentifiers = Array.prototype.slice.call(arguments, 1);
  if (thingIdentifiers.length === 0) {
    var error = new Error("No properties were specified to be matched by the " + type + " response parser.");
    error.name = 'UnspecifedGetResultAtQueryError';
    throw error;
  }

  return function (response) {
    var firstQueryResults = getFirstQueryResults(response);
    var result = firstQueryResults[0];
    if (!result) {
      var notFoundError = new Error(type + " was not found.");
      notFoundError.name = 'NotFoundError';
      throw notFoundError;
    }

    var hasSomeProperties = checkForThingIdentifiers(result, thingIdentifiers);
    if (hasSomeProperties) {
      if (thingIdentifiers.length === 1) {
        return result[thingIdentifiers[0]];
      } else {
        return _.pick(result, thingIdentifiers);
      }
    } else {
      var error = new Error("Nothing was matched with the identifiers (" + thingIdentifiers.join(', ') + ").");
      error.name = 'NotFoundError';
      throw error;
    }
  };
}

function getResultsAt(type /* thingIdentifier, ... , thingIdentifierN */) {
  var thingIdentifiers = Array.prototype.slice.call(arguments, 1);
  if (thingIdentifiers.length === 0) {
    var error = new Error("No properties were specified to be matched by the " + type + " response parser.");
    error.name = 'UnspecifedGetResultsAtQueryError';
    throw error;
  }

  return function (response) {
    var firstQueryResults = getFirstQueryResults(response);

    return firstQueryResults.map(function (result) {
      if (thingIdentifiers.length === 1) {
        return result[thingIdentifiers[0]];
      } else {
        return _.pick(result, thingIdentifiers);
      }
    }).filter(function (result) {
      if (thingIdentifiers.length === 1) {
        return result !== undefined;
      } else {
        var hasSomeProperties = checkForThingIdentifiers(result, thingIdentifiers);
        return hasSomeProperties;
      }
    });
  };
}

var responseParser = {
  getResult: function () {
    var defaultType = 'Node',
        defaultIdentifiers = ['n'];

    var specifiedIdentifiers = Array.prototype.slice.call(arguments);

    var args;
    if (specifiedIdentifiers.length) {
      args = [defaultType].concat(specifiedIdentifiers);
    } else {
      args = [defaultType].concat(defaultIdentifiers);
    }

    return getResultAt.apply(this, args);
  },
  getCount: function () {
    var defaultType = 'Count',
        defaultIdentifiers = ['count(n)'];

    var specifiedIdentifiers = Array.prototype.slice.call(arguments);

    var args;
    if (specifiedIdentifiers.length) {
      args = [defaultType].concat(specifiedIdentifiers);
    } else {
      args = [defaultType].concat(defaultIdentifiers);
    }

    return getResultAt.apply(this, args);
  },
  getRelationshipResult: function () {
    var defaultType = 'Relationship',
        defaultIdentifiers = ['r', 'n', 'm'];

    var specifiedIdentifiers = Array.prototype.slice.call(arguments);

    var args;
    if (specifiedIdentifiers.length) {
      args = [defaultType].concat(specifiedIdentifiers);
    } else {
      args = [defaultType].concat(defaultIdentifiers);
    }

    return getResultAt.apply(this, args);
  },
  getResults: function () {
    var defaultType = 'Node',
        defaultIdentifiers = ['n'];

    var specifiedIdentifiers = Array.prototype.slice.call(arguments);

    var args;
    if (specifiedIdentifiers.length) {
      args = [defaultType].concat(specifiedIdentifiers);
    } else {
      args = [defaultType].concat(defaultIdentifiers);
    }

    return getResultsAt.apply(this, args);
  },
  getRelationshipResults: function () {
    var defaultType = 'Relationship',
        defaultIdentifiers = ['r', 'n', 'm'];

    var specifiedIdentifiers = Array.prototype.slice.call(arguments);

    var args;
    if (specifiedIdentifiers.length) {
      args = [defaultType].concat(specifiedIdentifiers);
    } else {
      args = [defaultType].concat(defaultIdentifiers);
    }

    return getResultsAt.apply(this, args);
  }
};

module.exports = responseParser;
