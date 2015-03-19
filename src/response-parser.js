"use strict";

var _ = require('lodash'),
    debug = require('debug')('neo4j-simple:response-parser');

var responseParser = {};

responseParser.getResultAt = function (thingIdentifier) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    var result = firstQueryResults[0];
    if (!result) {
      throw new Error("Node was not found.");
    }

    if (result[thingIdentifier]) {
      return result[thingIdentifier];
    } else {
      throw new Error("Node named `" + thingIdentifier + "` was not found.");
    }
  };
};

responseParser.getRelationshipResultAt = function (relationship, subject, object) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    var result = firstQueryResults[0];
    var hasSomeProperties = _.some([result[relationship], result[subject], result[object]]);
    if (!result) {
      throw new Error("Relationship was not found.");
    }

    if (hasSomeProperties) {
      return {
        "relationship": result[relationship],
        "subject": result[subject],
        "object": result[object]
      };
    } else {
      var argumentsArray = Array.prototype.slice.call(arguments);
      throw new Error("Relationship containing some of the properties (" + argumentsArray.join(', ') + ") was not found.");
    }
  };
};

responseParser.getResultsAt = function (thingIdentifier) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    return _.chain(firstQueryResults).map(function (result) {
      return result[thingIdentifier];
    }).filter(_.identity).value();
  };
};

responseParser.getRelationshipResultsAt = function (relationship, subject, object) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    return _.chain(firstQueryResults).map(function (result) {
      return result;
    }).filter(function (r) {
      return _.some([r[relationship], r[subject], r[object]]);
    }).value();
  };
};

responseParser.getCountAt = function (thingIdentifier) {
  return function (response) {
    var queries = response[0];
    var firstQueryResults = queries[0] || [];
    var result = firstQueryResults[0];
    if (!result) {
      throw new Error("Count was not found.");
    }

    if (result[thingIdentifier] !== undefined) {
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

responseParser.responsifyPromises = function (target) {

  _.each(responseParser, function (method, methodName) {
    if (methodName === 'responsifyPromises') {
      return false;
    }

    target[methodName] = function (/* arguments of a responseParser */) {
      var fn = method;
      if (arguments.length) {
        var methodReturn = method.apply(responseParser, arguments);
        if (_.isFunction(methodReturn)) {
          fn = methodReturn;
        }
      }

      return this.then(fn);
    };
  });

  return target;
};

module.exports = responseParser;
