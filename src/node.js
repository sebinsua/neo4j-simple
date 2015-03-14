/*jshint -W054 */
"use strict";

var responseParser = require('./response-parser');

var _ = require('lodash'),
    Joi = require('joi'),
    Q = require('bluebird'),
    util = require('util'),
    uuid = require('node-uuid'),
    debug = require('debug')('neo4j-promised:node');

var node = module.exports = function (database) {

  var node = {};

  node.database = database;

  node.generate = function (nodeDefinition) {
    var label = _.isArray(nodeDefinition.label) ?
    _.first(nodeDefinition.label) : nodeDefinition.label || '',
    name = label + Node.name;

    var ChildNode;
    var _ChildNodeGenerator = function (nodeEnvironment) {
      // Depending on process.env.NODE_ENV to switch between
      //        eval version and the faster version.
      nodeEnvironment = nodeEnvironment || 'development';

      var ChildNode;
      if (nodeEnvironment === 'development') {
        ChildNode = (new Function(
          "return function " + name + "(data, id) { " + name + ".super_.apply(this, arguments); }"
        ))();
      } else {
        ChildNode = function Node(data, id) {
          Node.super_.apply(this, arguments);
        };
      }

      return ChildNode;
    };
    ChildNode = _ChildNodeGenerator(process.env.NODE_ENV);
    util.inherits(ChildNode, Node);

    ChildNode.database = node.database;

    ChildNode.label = nodeDefinition.label;
    ChildNode.schema = nodeDefinition.schema || {};

    return ChildNode;
  };

  node.Node = Node;

  return node;
};

var Node = function Node(data, id) {

  var database = this.constructor.database;
  this.setDatabase(database);
  this.idName = database.idName || 'id';

  this.data = data;
  this.id = id || data[this.idName] || uuid.v1();
  this.isUpdate = id ? true : false;

  this.label = this.constructor.label;
  this.schema = this.constructor.schema;

  this.isValid = false;
  this._initialisePromise();
};

Node.prototype.setDatabase = function (database) {
  this.database = database;
};

Node.prototype._initialisePromise = function () {
  var INVALID_MESSAGE = "Node not yet validated.";
  // I am setting this up despite it being a little unhealthy as this was the
  // default bluebird behavior before a recent update.
  Q.onPossiblyUnhandledRejection(function (error) {
    if (error.message !== INVALID_MESSAGE) {
      debug(error);
    }
  });

  var deferred = Q.defer();

  var data = this.data, schema = this.schema;
  // When there is no schema always assume valid.
  if (_.isEmpty(schema)) {
    this.isValid = true;
    deferred.resolve(data);

    this.__savePromise = deferred.promise;
  } else {
    this.isValid = false;
    deferred.reject(new Error(INVALID_MESSAGE));

    this.__savePromise = deferred.promise;
  }
};

Node.prototype._validate = function (data) {
  data = data || this.data;

  var schema = this.schema;

  var deferred = Q.defer(),
      validationOptions = { stripUnknown: true },
      validationErrors = Joi.validate(data, schema, validationOptions);

  if (validationErrors.error) {
    debug("There was an error validating the node: %s", validationErrors.error.message);

    this.isValid = false;
    deferred.reject(validationErrors);
  } else {
    this.isValid = true;
    deferred.resolve(data);
  }

  this.__savePromise = deferred.promise;

  return this;
};

Node.prototype.save = function (options) {
  options = options || {};
  options.operation = options.operation || 'default';

  var self = this;

  var label = this.label;

  var createNode = function (id) {
    return function createNodeOfLabelAndId(data) {
      var labelsString = _.isArray(label) ?
                         ":" + label.join(':') : (label ? ':' + label : ''),
          query = ["CREATE (n" + labelsString + " {data})",
                   "SET n.created = timestamp()"].join('\n');

      data[self.idName] = id;
      return self.database.client.queryAsync(query, {
        data: data
      }).then(function (results) {
        return {
          id: id
        };
      });
    };
  };

  var resetNode = function (id) {
    return function resetNodeOfId(data) {
      var query = ["MATCH (n { " + self.idName + ": { id } }) ",
                   "SET n = { data }",
                   "RETURN n"].join('\n');

      data[self.idName] = id;
      return self.database.client.queryAsync(query, {
        id: id,
        data: data
      }).then(responseParser.getResult);
    };
  };

  var updateNode = function (id) {
    return function updateNodeOfId(data) {
      var _getSetters = function (data) {
        var setters = '';

        var propertyNames = _.keys(data);
        if (propertyNames.length) {
          var _propertySetters = [];
          for (var ip = 0; ip < propertyNames.length; ip++) {
            _propertySetters.push('n.' + propertyNames[ip] + ' = { ' + propertyNames[ip] + ' }');
          }
          setters = 'SET ' + _propertySetters.join(',\n');
        }

        return [setters];
      };

      var _query = ["MATCH (n { " + self.idName + ": { id } }) "],
      _setters = _getSetters(data),
      _return = ["RETURN n"],
      query = _query.concat(_setters, _return).join('\n');

      data[self.idName] = id;
      return self.database.client.queryAsync(query, data).then(responseParser.getResult);
    };
  };

  var isUpdate = this.isUpdate,
      id = this.id,
      data = this.data;
  if (!isUpdate) {
    // No id, so this is a create operation.
    return this._validate(data).__savePromise.
                then(createNode(id));
  } else {
    // Id, so this is an update operation.
    options.replace = options.replace || false;

    var performUpdate = options.replace ? resetNode : updateNode;
    return this._validate(data).__savePromise.
                then(performUpdate(id));
  }
};

// This method requires `node_auto_index` to be setup, as the `id` key must be indexed.
Node.prototype.delete = function (options) {
  options = options || {};

  var query = ['START n=node:node_auto_index(' + this.idName + '={ id })',
               'OPTIONAL MATCH n-[r]->()',
               'DELETE n',
               'RETURN count(n) AS count'].join('\n');

  var id = this.id;
  return this.database.client.queryAsync(query, { id: id }).then(responseParser.getCount);
};

Node.prototype.toString = function () {
  return this.name;
};
