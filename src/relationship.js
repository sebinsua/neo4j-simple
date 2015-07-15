/*jshint -W054 */
"use strict";

var responseParser = require('./response-parser'),
    setupOperations = require('./setup-operations');

var Joi = require('joi'),
    Promise = require('native-or-bluebird'),
    util = require('util'),
    uuid = require('node-uuid');

var debug = require('debug')('neo4j-simple:relationship'),
    see = require('tap-debug')(debug);

var _ = require('./helpers');

var uppercaseCamelCaseIdentifier = function (identifier) {
  var newIdentifier = identifier,
      parts = identifier.split('_');

  var capitaliseWords = function (part) {
    var word = part.toLowerCase();
    return word.charAt(0).toUpperCase() + word.substr(1);
  }, concatenate = function (sofar, word) {
    return sofar + word;
  };

  newIdentifier = parts.
                  map(capitaliseWords).
                  reduce(concatenate, '');

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

    var schemas = relationshipDefinition.schemas || {};
    var defaultSchema = relationshipDefinition.schema || {};
    if (defaultSchema) {
      schemas.default = defaultSchema;
    }
    ChildRelationship.schemas = schemas;

    var operations = Object.keys(ChildRelationship.schemas);
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
  this.__initPromise = this._initialisePromise();
};

Relationship.prototype.setDatabase = function (database) {
  this.database = database;
};

Relationship.prototype._initialisePromise = function () {
  var INVALID_MESSAGE = "Relationship needs to be validated.";

  var self = this;
  return new Promise(function (resolve, reject) {
    var data = self.data;
    var hasEmptyDefaultSchema = _.isEmpty(self.schemas.default),
        numberOfSchemas = Object.keys(self.schemas).length;
    // When there is no schema always assume valid.
    if (hasEmptyDefaultSchema && numberOfSchemas === 1) {
      self.isValid = true;
      resolve(data);
    } else {
      self.isValid = false;
      reject(new Error(INVALID_MESSAGE));
    }
  });
};

Relationship.prototype._validate = function (data, options) {
  data = data || this.data;
  options = options || {};

  var self = this;
  return new Promise(function (resolve, reject) {
    var defaultSchemaName = 'default';
    var schemaName = options.operation;
    var schema = self.schemas[schemaName] || self.schemas[defaultSchemaName];

    debug("Validating using the " + (!!self.schemas[schemaName] ? schemaName : defaultSchemaName) + " schema.");

    var validationOptions = { stripUnknown: true },
        validationErrors = Joi.validate(data, schema, validationOptions);

    if (validationErrors.error) {
      debug("There was an error validating the relationship: %s", validationErrors.error.message);

      self.isValid = false;
      reject(validationErrors);
    } else {
      self.isValid = true;
      resolve(data);
    }
  });
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
      return self.database.query(query, {
        aId: ids[0],
        bId: ids[1],
        data: data
      }).getRelationshipResult('r');
    };
  };

  var updateRelationship = function (ids, type, direction) {
    return function updateRelationshipOfId(data) {
      var _getSetters = function (data) {
        var setters = '';

        var propertyNames = Object.keys(data);
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
      return self.database.query(query, data).getRelationshipResult('r');
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

  var idsString = ids.join(', ');
  var replace = options.replace ? 'replaced' : 'updated';
  return this.validate(data, options).
              then(performUpdate(ids, type, direction)).
              tap(see(':heavy_minus_sign: Relationship between the two nodes (${ids}) ${replace}.', { ctx: { ids: idsString, replace: replace } }));
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
  var idsString = ids.join(', ');
  return this.database.
              query(query, { aId: ids[0], bId: ids[1] }).
              tap(see(':heavy_minus_sign: Relationships between the two nodes (${ids}) removed: ${count}.', { ctx: { ids: idsString } })).
              getCountAt('count');
};

Relationship.prototype.validate = function (data, options) {
  var self = this;
  return self.__initPromise.then(function (data) {
    return data;
  }).catch(function () {
    return self._validate(data, options);
  });
};

Relationship.prototype.save = function (options) {
  return this._save(options);
};

Relationship.prototype.remove = Relationship.prototype.delete = function (options) {
  return this._delete(options);
};

Relationship.prototype.toString = function () {
  return this.name;
};
