neo4j-promised
==============

[![Build Status](https://travis-ci.org/sebinsua/neo4j-promised.png)](https://travis-ci.org/sebinsua/neo4j-promised) [![npm version](https://badge.fury.io/js/neo4j-promised.svg)](https://npmjs.org/package/neo4j-promised)

A [Neo4j](http://neo4j.com/) API for Node.js that provides nodes and relationships in [the form of promises](https://github.com/petkaantonov/bluebird) with [Joi](https://github.com/hapijs/joi) validators and implemented using the [Cypher query language](http://neo4j.com/developer/cypher-query-language/).

This makes the simple things easy.

Additonally, you can write your own bespoke Cypher queries unimpeded through the `query()` method, and the neo4j client itself is exposed on `module.client` so you can call `module.client.query()` or `module.client.queryAsync()` to query the database directly (depending on whether you prefer callbacks or promises.)

Example
=======

Define [Joi](https://github.com/hapijs/joi) data validators for your nodes and relationships and then save them using promises.

```javascript
var Q = require('bluebird');
var db = require('neo4j-promised')("http://localhost:7474");

// `schema` is the same as `schemas.default`.
// Pass in more schemas if you need different ones for different operations.
var Node = db.defineNode({
  label: ['Example'],
  schemas: {
    'default': {
      'id': db.Joi.string().optional()
    },
    'saveWithName': {
      'id': db.Joi.string().optional(),
      'name': db.Joi.string().required()
    }
});

var Relationship = db.defineRelationship({
  type: 'LOVE',
  schema: {
    'description': db.Joi.string()
  }
});

var example1 = new Node({
  id: "some-id-goes-here-1",
  name: "Example 1"
});
var example2 = new Node({
  id: "some-id-goes-here-2"
});
var example3 = new Node({
  id: "some-id-goes-here-3",
  name: "Example 3"
});

var exampleRelationship = new Relationship({
  description: "It's true",
}, [example1.id, example2.id], db.DIRECTION.RIGHT);

// It is possible to pass in a particular operation that should be the schema lookup.
// Otherwise it will default to the default schema.
// It will try to intelligently select a schema for the operation it detects is happening, too.
// For example: create, replace, update.
// Similarly schemas should automatically create method aliases that call save.
// NOTE: The `save()` and `remove()` methods can also take a callback after the options.
Q.all([
  example1.save( { operation: 'saveWithName' } ),
  example2.save(),
  example3.saveWithName()
]).then(function (response) {
  return exampleRelationship.save();
});
```
