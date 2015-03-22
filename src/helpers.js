"use strict";

function isFunction(value) {
  var funcTag = '[object Function]';
  var objectProto = Object.prototype;
  var objToString = objectProto.toString;
  return objToString.call(value) == funcTag;
}

function isArray(value) {
  var arrayTag = '[object Array]';
  var objectProto = Object.prototype;
  var objToString = objectProto.toString;
  return objToString.call(value) == arrayTag;
}

function isEmpty(obj) {
  var keys = Object.keys(obj);
  return keys.length === 0;
}

function first(array) {
  return array ? array[0] : undefined;
}

function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

function propertyOf(object) {
  return function (key) {
    return object[key];
  };
}

function some(values) {
  for (var i = 0; i < values.length; i++) {
    if (values[i] !== undefined) {
      return true;
    }
  }
  return false;
}

function pick(obj, keys) {
  var newObj = {};
  keys.forEach(function (key) {
    newObj[key] = obj[key];
  });
  return newObj;
}

function extend(target, source) {
  target = target || {};
  for (var prop in source) {
    if (typeof source[prop] === 'object') {
      target[prop] = extend(target[prop], source[prop]);
    } else {
      target[prop] = source[prop];
    }
  }
  return target;
}

module.exports.isFunction = isFunction;
module.exports.isArray = isArray;
module.exports.isEmpty = isEmpty;
module.exports.first = first;
module.exports.last = last;
module.exports.propertyOf = propertyOf;
module.exports.some = some;
module.exports.pick = pick;
module.exports.extend = extend;
