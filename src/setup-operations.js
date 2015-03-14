"use strict";

var _ = require('lodash');

var setupMethods = require('./setup-methods');

function setupOperations(Class, operations) {
  return setupMethods(Class, operations, {
    'defaultArguments': function (args, options) {
      args = args || [];
      args[0] = _.extend(args[0] || {}, {
        operation: options.method
      });
      return args;
    }
  });
}

module.exports = setupOperations;
