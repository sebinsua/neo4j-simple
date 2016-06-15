/*
"use strict";

var _ = require('./helpers');

var setupMethods = require('./setupMethods');

function setupOperations(target, operations) {
  return setupMethods(target, operations, {
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
*/
