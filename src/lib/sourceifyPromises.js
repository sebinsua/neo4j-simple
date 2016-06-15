export default () => {}
/*
"use strict";

function sourceifyPromises(promisePrototype, source) {

  var methodNames = Object.keys(source);

  methodNames.forEach(function (methodName) {
    var method = source[methodName];

    promisePrototype[methodName] = function () {
      var fn = method.apply(source, arguments);
      return this.then(fn);
    };
  });

  return promisePrototype;
}

module.exports = sourceifyPromises;
*/
