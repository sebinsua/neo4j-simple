/*jshint -W054 */
"use strict";

var responseParser = require('./response-parser'),
    setupOperations = require('./setup-operations');

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

    var defaultSchema = nodeDefinition.schema || {};
    var schemas = nodeDefinition.schemas || {};
    ChildNode.schemas = _.extend({
      'default': defaultSchema
    }, schemas);

    var operations = _.keys(ChildNode.schemas);
    ChildNode = setupOperations(ChildNode, operations);

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
  this.schemas = this.constructor.schemas;

  this.isValid = false;
  this._initialisePromise();
};

Node.prototype.setDatabase = function (database) {
  this.database = database;
};

Node.prototype._initialisePromise = function () {
  var INVALID_MESSAGE = "Node needs to be validated.";

  // This was added into bluebird after I had created the library.
  // Because we're overwriting a promise in some cases we have a legitimate need
  // for ignoring this sometimes. I realise it's a code-smell but oh well.
  Q.onPossiblyUnhandledRejection(function (error) {
    if (error.message !== INVALID_MESSAGE) {
      debug(error);
    } else {
      throw error;
    }
  });

  var deferred = Q.defer();

  var data = this.data;
  var hasEmptyDefaultSchema = _.isEmpty(this.schemas.default),
      numberOfSchemas = _.keys(this.schemas).length;
  // When there is no schema always assume valid.
  if (hasEmptyDefaultSchema && numberOfSchemas === 1) {
    this.isValid = true;
    deferred.resolve(data);
  } else {
    this.isValid = false;
    deferred.reject(new Error(INVALID_MESSAGE));
  }

  this.__savePromise = deferred.promise;
};

Node.prototype._validate = function (data, options) {
  data = data || this.data;
  options = options || {};

  var defaultSchemaName = 'default';
  var schemaName = options.operation;
  var schema = this.schemas[schemaName] || this.schemas[defaultSchemaName];

  debug("Validating using the " + (!!this.schemas[schemaName] ? schemaName : defaultSchemaName) + " schema.");

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
    options.operation = options.operation || 'create';
    return this._validate(data, options).__savePromise.
                then(createNode(id));
  } else {
    // Id, so this is an update operation.
    options.replace = options.replace || false;

    var performUpdate;
    if (options.replace) {
      performUpdate = resetNode;
      options.operation = options.operation || 'replace';
    } else {
      performUpdate = updateNode;
      options.operation = options.operation || 'update';
    }
    return this._validate(data, options).__savePromise.
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
