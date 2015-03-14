"use strict";

var _ = require('lodash');

function setupMethods(Class, methods, options) {
  options = _.extend({
    'blacklist': ['default'],
    'defaultMethod': 'save',
    'defaultArguments': function (args, options) { return args; }
  }, options || {});

  _.each(methods, function (method) {
    if (options.blacklist.indexOf(method) !== -1) {
      return false;
    }

    if (!Class.prototype[method]) {
      Class.prototype[method] = function () {
        var argumentsArray = Array.prototype.slice.call(arguments);
        argumentsArray = options.defaultArguments(argumentsArray, { method: method });
        this[options.defaultMethod].apply(this, argumentsArray);
      };
    }
  });

  return Class;
}

module.exports = setupMethods;
