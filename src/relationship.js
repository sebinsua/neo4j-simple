/*jshint -W054 */
"use strict";

var responseParser = require('./response-parser'),
    setupOperations = require('./setup-operations');

var _ = require('lodash'),
    Joi = require('joi'),
    Q = require('bluebird'),
    util = require('util'),
    uuid = require('node-uuid'),
    debug = require('debug')('neo4j-promised:relationship');

var uppercaseCamelCaseIdentifier = function (identifier) {
  var newIdentifier = identifier,
      parts = identifier.split('_');

  var capitaliseWords = function (part) {
    var word = part.toLowerCase();
    return word.charAt(0).toUpperCase() + word.substr(1);
  }, concatenate = function (sofar, word) {
    return sofar + word;
  };

  newIdentifier = _.chain(parts).
                    map(capitaliseWords).
                    reduce(concatenate, '').
                    value();

  return newIdentifier;
};

var relationship = module.exports = function (database) {

  var relationship = {};

  relationship.database = database;

  relationship.generate = function (relationshipDefinition) {
    relationshipDefinition = relationshipDefinition || {};

    var type = relationshipDefinition.type || '',
    name = uppercaseCamelCaseIdentifier(type) + Relationship.name;

    var ChildRelationship;
    var _ChildRelationshipGenerator = function (nodeEnvironment) {
      // Depending on process.env.NODE_ENV to switch between
      // eval version and the faster version.
      nodeEnvironment = nodeEnvironment || 'development';

      var ChildRelationship;
      if (nodeEnvironment === 'development') {
        ChildRelationship = (new Function(
          "return function " + name + "(data, ids, direction) { " + name + ".super_.apply(this, arguments); }"
        ))();
      } else {
        ChildRelationship = function Relationship(data, ids, direction) {
          Relationship.super_.apply(this, arguments);
        };
      }

      return ChildRelationship;
    };
    ChildRelationship = _ChildRelationshipGenerator(process.env.NODE_ENV);
    util.inherits(ChildRelationship, Relationship);

    ChildRelationship.database = relationship.database;

    ChildRelationship.type = relationshipDefinition.type;

    var defaultSchema = relationshipDefinition.schema || {};
    var schemas = relationshipDefinition.schemas || {};
    ChildRelationship.schemas = _.extend({
      'default': defaultSchema
    }, schemas);

    var operations = _.keys(ChildRelationship.schemas);
    ChildRelationship = setupOperations(ChildRelationship, operations);

    return ChildRelationship;
  };

  relationship.Relationship = Relationship;

  return relationship;
};

var Relationship = function Relationship(data, ids, direction) {
  if (!ids || ids.length !== 2) {
    throw new Error("The relationship must be in between two nodes.");
  }

  var database = this.constructor.database;
  this.setDatabase(database);
  this.idName = database.idName || 'id';

  this.data = data;
  this.ids = ids;
  this.direction = direction || database.direction.NONE;

  this.type = this.constructor.type;
  this.schemas = this.constructor.schemas;

  this.isValid = false;
  this._initialisePromise();
};

Relationship.prototype.setDatabase = function (database) {
  this.database = database;
};

Relationship.prototype._initialisePromise = function () {
  var INVALID_MESSAGE = "Relationship needs to be validated.";

  // This was added into bluebird after I had created the library.
  // Because we're overwriting a promise in some cases we have a legitimate need
  // for ignoring this sometimes. I realise it's a code-smell but oh well.
  Q.onPossiblyUnhandledRejection(function (error) {
    if (error.message !== INVALID_MESSAGE) {
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

Relationship.prototype._validate = function (data, options) {
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
    debug("There was an error validating the relationship: %s", validationErrors.error.message);

    this.isValid = false;
    deferred.reject(validationErrors);
  } else {
    this.isValid = true;
    deferred.resolve(data);
  }

  this.__savePromise = deferred.promise;

  return this;
};

Relationship.prototype._save = function (options) {
  options = options || {};

  var self = this;

  var getRelationship = function (type, direction) {
    var relationshipType = '-[r' + (type ? ':' + type : '') + ']-';
    switch (direction) {
      case self.database.DIRECTION.LEFT:
        relationshipType = '<' + relationshipType;
        break;
      case self.database.DIRECTION.RIGHT:
        relationshipType = relationshipType + '>';
        break;
      default:
      case self.database.DIRECTION.NONE:
        break;
    }

    return relationshipType;
  };

  var resetRelationship = function (ids, type, direction) {
    return function resetRelationshipOfId(data) {
      var _relationship = getRelationship(type, direction);
      var query = ['START a=node:node_auto_index(' + self.idName + '={ aId }),',
                   '      b=node:node_auto_index(' + self.idName + '={ bId })',
                   'CREATE UNIQUE a' + _relationship + 'b',
                   'SET r = { data }',
                   'RETURN r'].join('\n');

      data[self.idName] = uuid.v1();
      data.created = Date.now();
      return self.database.client.queryAsync(query, {
        aId: ids[0],
        bId: ids[1],
        data: data
      }).then(responseParser.getRelationshipResult);
    };
  };

  var updateRelationship = function (ids, type, direction) {
    return function updateRelationshipOfId(data) {
      var _getSetters = function (data) {
        var setters = '';

        var propertyNames = _.keys(data);
        if (propertyNames.length) {
          var _propertySetters = [];
          for (var ip = 0; ip < propertyNames.length; ip++) {
            _propertySetters.push('r.' + propertyNames[ip] + ' = { ' + propertyNames[ip] + ' }');
          }
          setters = 'SET ' + _propertySetters.join(',\n');
        }

        return [setters];
      };

      var _relationship = getRelationship(type, direction);
      var _query = ['START a=node:node_auto_index(' + self.idName + '={ aId }),',
                    '      b=node:node_auto_index(' + self.idName + '={ bId })',
                    'CREATE UNIQUE a' + _relationship + 'b'],
          _setters = _getSetters(data),
          _return = ["RETURN r"],
          query = _query.concat(_setters, _return).join('\n');

      data.aId = ids[0];
      data.bId = ids[1];
      return self.database.client.queryAsync(query, data).then(responseParser.getRelationshipResult);
    };
  };

  var ids = this.ids,
      type = this.type,
      direction = this.direction,
      data = this.data;
      options.replace = options.replace || false;

  var performUpdate;
  if (options.replace) {
    performUpdate = resetRelationship;
    options.operation = options.operation || 'replace';
  } else {
    performUpdate = updateRelationship;
    options.operation = options.operation || 'update';
  }

  return this._validate(data, options).__savePromise
             .then(performUpdate(ids, type, direction));
};

// A relationship is best referred to with the two nodes
// that are connected by it.
Relationship.prototype._delete = function (options) {
  options = options || {};

  var query = ['MATCH (a)-[r]-(b)',
               'WHERE a.' + this.idName + ' = { aId } AND b.' + this.idName + ' = { bId }',
               'DELETE r',
               'RETURN count(r) AS count'].join('\n');

  var ids = this.ids;
  return this.database.client.queryAsync(query, { aId: ids[0], bId: ids[1] }).then(responseParser.getCount);
};

Relationship.prototype.save = function (options, callback) {
  return this._save(options).nodeify(callback);
};

Relationship.prototype.remove = Relationship.prototype.delete = function (options, callback) {
  return this._delete(options).nodeify(callback);
};

Relationship.prototype.toString = function () {
  return this.name;
};
