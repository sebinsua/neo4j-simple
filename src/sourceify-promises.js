"use strict";

function sourceifyPromises(promisePrototype, source) {

  var methodNames = Object.keys(source);

  methodNames.forEach(function (methodName) {
    var method = source[methodName];

    promisePrototype[methodName] = function (/* arguments of a source */) {
      var fn = method.apply(source, arguments);
      return this.then(fn);
    };
  });

  return promisePrototype;
}

module.exports = sourceifyPromises;
