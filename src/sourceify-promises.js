"use strict";

var _ = require('lodash');

function sourceifyPromises(promisePrototype, source) {

  _.each(source, function (method, methodName) {

    promisePrototype[methodName] = function (/* arguments of a source */) {
      var fn = method;
      if (arguments.length) {
        var methodReturn = method.apply(source, arguments);
        if (_.isFunction(methodReturn)) {
          fn = methodReturn;
        }
      }

      return this.then(fn);
    };
  });

  return promisePrototype;
}

module.exports = sourceifyPromises;
