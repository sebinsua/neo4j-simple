/*jshint -W054 */
"use strict";

var responseParser = require('./response-parser');

var _ = require('lodash'),
    Joi = require('joi'),
    Q = require('bluebird'),
    util = require('util'),
    uuid = require('node-uuid'),
    debug = require('debug')('neo4j-promised:relationship');

var relationship = module.exports = function (database) {

  var relationship = {};

  relationship.database = database;

  relationship.generate = function (relationshipDefinition) {
    var type = relationshipDefinition.type || '',
    name  = type + Relationship.name;

    var ChildRelationship;
    var _ChildRelationshipGenerator = function (nodeEnvironment) {
      // Depending on process.env.NODE_ENV to switch between
      // eval version and the faster version.
      nodeEnvironment = nodeEnvironment || 'development';

      var ChildRelationship;
      if (nodeEnvironment === 'development') {
        ChildRelationship = (new Function(
          "return function " + name + "(data, id) { " + name + ".super_.apply(this, arguments); }"
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
    ChildRelationship.schema = relationshipDefinition.schema || {};

    return ChildRelationship;
  };

  relationship.Relationship = Relationship;

  return relationship;
};

var Relationship = function Relationship(data, ids, direction) {
  if (!ids || ids.length !== 2) {
    throw new Error("The relationship must be in between two nodes.");
  }

  this.setDatabase(this.constructor.database);

  this.data = data;
  this.ids = ids;
  this.direction = direction || this.database.direction.NONE;

  this.isValid = false;
  this._initialisePromise();
};

Relationship.prototype.setDatabase = function (database) {
  this.database = database;
};

Relationship.prototype._initialisePromise = function () {
  var INVALID_MESSAGE = "Relationship not yet validated.";
  // I am setting this up despite it being a little unhealthy as this was the
  // default bluebird behavior before a recent update.
  Q.onPossiblyUnhandledRejection(function (error) {
    if (error.message !== INVALID_MESSAGE) {
      debug(error);
    }
  });

  var deferred = Q.defer();

  var data = this.data, schema = this.constructor.schema;
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

Relationship.prototype._validate = function (data) {
  data = data || this.data;

  var schema = this.constructor.schema;

  var deferred = Q.defer(),
      validationOptions = { stripUnknown: true },
      validationErrors = Joi.validate(data, schema, validationOptions);

  if (validationErrors.error) {
    debug("There was an error validating the relationship: %s", validationErrors.message);

    this.isValid = false;
    deferred.reject(validationErrors);
  } else {
    this.isValid = true;
    deferred.resolve(data);
  }

  this.__savePromise = deferred.promise;

  return this;
};

Relationship.prototype.save = function (options) {
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
      var query = ['START a=node:node_auto_index(id={ aId }),',
                   '      b=node:node_auto_index(id={ bId })',
                   'CREATE UNIQUE a' + _relationship + 'b',
                   'SET r = { data }',
                   'RETURN r'].join('\n');

      data.id = uuid.v1();
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
      var _query = ['START a=node:node_auto_index(id={ aId }),',
                    '      b=node:node_auto_index(id={ bId })',
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
      type = this.constructor.type,
      direction = this.direction,
      data = this.data;
      options.replace = options.replace || false;

  var performUpdate = options.replace ? resetRelationship : updateRelationship;
  return this._validate(data).__savePromise
             .then(performUpdate(ids, type, direction));
};

// A relationship is best referred to with the two nodes
// that are connected by it.
Relationship.prototype.delete = function () {
  var self = this;

  var query = ['MATCH (a)-[r]-(b)',
               'WHERE a.id = { aId } AND b.id = { bId }',
               'DELETE r',
               'RETURN count(r) AS count'].join('\n');

  var ids = this.ids;
  return self.database.client.queryAsync(query, { aId: ids[0], bId: ids[1] }).then(responseParser.getCount);
};

Relationship.prototype.toString = function () {
  return this.name;
};
