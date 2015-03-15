# neo4j-promised

[![Build Status](https://travis-ci.org/sebinsua/neo4j-promised.png)](https://travis-ci.org/sebinsua/neo4j-promised) [![npm version](https://badge.fury.io/js/neo4j-promised.svg)](https://npmjs.org/package/neo4j-promised)

Simple [Neo4j](http://neo4j.com/) bindings for Node.js.

The library provides nodes and relationships in [the form of promises](https://github.com/petkaantonov/bluebird) and is implemented on top of [Cypher queries](http://neo4j.com/developer/cypher-query-language/). Additionally you can restrict database access through usage of [Joi](https://github.com/hapijs/joi) validators.

It is built on top of the excellent Neo4j library [rainbird-neo4j](https://github.com/RainBirdAi/rainbird-neo4j) which is exposed on the `.client` property, and there are also some helpful aliases created for its methods that are described in the API.

## Example

```javascript
var db = require('neo4j-promised')("http://localhost:7474");

var Node = db.defineNode({
  label: ['Example'],
  schema: {
    'name': db.Joi.string().required()
  }
});

var basicExampleNode = new Node({
  name: "This is a very basic example"
});

basicExampleNode.save().then(function (results) {
  console.log(results);
});
```

If the `name` (as shown above) had not been supplied when generating an instance of the Node class, then on `save()` an error would have been thrown from the promise.

The [Joi](https://github.com/hapijs/joi) schema can be passed into `defineNode()` either as `options.schema` or more explicitly as `options.schemas.default`.

A more involved example, might look like this:

```javascript
var Q = require('bluebird');

// By default the idName passed into the library is 'id'.
// This means that you should have an `auto_index` on that
// field for both nodes and relationships.
var db = require('neo4j-promised')("http://localhost:7474", {
  idName: 'id'
});

// Multiple schemas can be passed in like so.
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

// If you explicitly pass in an operation then it will be used on validate for
// the schema lookup. By default the validator will check for a default schema
// which if empty will validate successfully.
// Additionally it will try to intelligently select a schema depending on the
// operation that is executing. For example: create, replace, update.
Q.all([
  example1.save( { operation: 'saveWithName' } ),
  example2.save(),
  example3.save()
]).then(function (response) {
  return exampleRelationship.save();
});
```

## API

### `defineNode(nodeDefinition)`

```javascript
{
  'label': [''], // Optional. Takes either a single string or array of labels.
  'schema': {}, // Optional. A default schema.
  'schemas': {}, // Optional. A key-value object of schemas can be passed in.
}
```

#### `new Node(data, id)`

##### `save(options)`

##### `remove()`

### `defineRelationship(relationshipDefinition)`

```javascript
{
  'type': '', // Optional. Takes a single string.
  'schema': {}, // Optional. A default schema.
  'schemas': {}, // Optional. A key-value object of schemas can be passed in.
}
```

#### `new Relationship(data, ids, direction)`

##### `save(options)`

##### `remove()`

### `query(...)`

This is an alias of Rainbird's `query()` but will return a promise, with the following extra methods:

#### `getResult()` or `getResultAt(nodeAlias)`

This method assumes that the query named a node as `'n'`.

#### `getResults()` or `getResultsAt(nodeAlias)`

This method assumes that the query named a node as `'n'`.

#### `getRelationshipResult` or  `getRelationshipResultAt(relationshipAlias, leftNodeAlias, rightNodeAlias)`

This method assumes that the query named a relationship as `'r'` and the nodes that this was between as `'n'` and `'m'`.

#### `getRelationshipResults()` or `getRelationshipResultsAt(relationshipAlias, leftNodeAlias, rightNodeAlias)`

This method assumes that the query named a relationship as `'r'` and the nodes that this was between as `'n'` and `'m'`.

#### `getCount()` or `getCountAt(countAlias)`

### `getNodes(ids)`

This is a method that executes an explicit query for a specific array of ids.
