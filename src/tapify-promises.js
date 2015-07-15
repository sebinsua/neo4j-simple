"use strict";

function tapifyPromises(promisePrototype) {

  if (typeof promisePrototype.tap === 'undefined') {
    promisePrototype.tap = function tap(handler) {
      return this.then(function (v) {
        handler(v);
        return v;
      });
    };
  }

  return promisePrototype;
}

module.exports = tapifyPromises;
