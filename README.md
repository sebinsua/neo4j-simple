# neo4j-simple

[![Build Status](https://travis-ci.org/sebinsua/neo4j-simple.png)](https://travis-ci.org/sebinsua/neo4j-simple) [![npm version](https://badge.fury.io/js/neo4j-simple.svg)](https://npmjs.org/package/neo4j-simple)

Simple [Neo4j](http://neo4j.com/) bindings for Node.

The library provides nodes and relationships in [the form of promises](https://github.com/kevinbeaty/any-promise) and is implemented on top of [Cypher queries](http://neo4j.com/developer/cypher-query-language/). *Optionally* you can restrict database access with validators (out-of-the-box [Joi](https://github.com/hapijs/joi) validators are supported).

## TODO

- [ ] Write the tests for my presumed interface.
- [ ] Fix the tests.
- [ ] Remove all of the descriptive comments from `README.md#example`.

## Example

```javascript
import { defineNode, connect, JoiValidationStrategy } from 'neo4j-simple'
import Joi from 'joi'

// The default `validationStrategy` will be JoiValidationStrategy.
const { save, saveAll } = connect({ url: 'http://localhost:7474', validationStrategy: JoiValidationStrategy } )
// `saveAll` is a `createTransaction(save)`, which is actually:
// createTransaction(operation) {
//   return (entity) => {
//     const entities = [].concat(entity)
//     const transactionId = beginTransaction()
//     const operateWithTransaction = withTransaction(transactionId)(operation)
//     return operateWithTransaction(entities)
//           .then(() => commitTransaction(transactionId))
//           .catch(() => rollbackTransaction(transactionId))
//   }
// }
// `withTransaction` creates a function which takes datas and does the required stuffs to do validations, concatenate queries, etc.

// By default the idName passed into the library is 'id'.
// See: http://blog.armbruster-it.de/2013/12/indexing-in-neo4j-an-overview/
const Node = defineNode({
  // By default the default id key is `'id'`
  id: constants.DEFAULT_ID_KEY,
  label: ['Example'],
  // Not passing in a schema means the `defaultGuard` is super permissive.
  schema: {
    'name': Joi.string().required()
  }
})

const basicExampleNode = new Node({
  name: "This is a very basic example"
})

save(basicExampleNode).then((results) => {
  console.log(results);
})

saveAll([
  node,
  relationship
])
```

If the `name` (as shown above) had not been supplied when generating an instance of the Node class, then on `save()` an error would have been thrown from the promise.

The [Joi](https://github.com/hapijs/joi) schema can be passed into `defineNode()` either as `options.schema` or more explicitly as `options.schemas.default`.

A more involved example might look like this:

```javascript
import Promise from 'bluebird'
import { defineNode, connect, constants } from 'neo4j-simple'
import Joi from 'joi'

const { save, update } = connect("http://localhost:7474")

// Other operations include: create, update, replace
// More can be created with `createOperation(operationName)`.
// Note: `save` can call `update` or `create` dependent on the existence of an id or not.

const { defineNode, defineRelationship } = connect("http://localhost:7474")

// Multiple schemas can be passed in like so.
const Node = defineNode({
  label: ['Example'],
  schemas: {
    default: {
      id: Joi.string().optional(),
      type: Joi.string().required()
    },
    update: {
      id: Joi.string().required(),
      type: Joi.string().optional(),
      name: Joi.string().optional()
    }
  }
})

// Schemas create guards with `createGuard(operationName, schema)` which outputs a `guard` function.
// Therefore: `schema` is a definition of a `defaultGuard`.
// Node and Relationship can contain `operationGuards`.

const Relationship = defineRelationship({
  type: 'LOVE',
  // 'schema' creates an inner 'default' guard using `createGuard(operationName, schema)`.
  schema: {
    description: Joi.string()
  }
})

const example1 = new Node({
  id: "some-id-goes-here-1",
  type: "example",
  name: "Example 1"
})
const example2 = new Node({
  id: "some-id-goes-here-2",
  type: "example",
  name: "Example 2"
})
const example3 = new Node({
  id: "some-id-goes-here-3",
  type: "example",
  name: "Example 3"
})

// Internally, when given two nodes, we get their id by passing them into an `id(node)`

const exampleRelationship = new Relationship({
  description: "It's true",
}, [example1, example2], constants.DIRECTION_RIGHT)

// By default the validator will check for a default guard
// which if empty will validate successfully.
// Additionally it will try to intelligently select a schema depending on the
// operation that is executing. For example: create, replace, update.
const saveNodes = [ example1, example2 ].map(save)
const updateNode = update(example3)
Promise.all([ ...saveNodes, updateNode ])
       .then(() => save(exampleRelationship))

```

# API

All of the methods that interact with the database return a promise.

## `defineNode(nodeDefinition)`

```javascript
{
  'label': [''], // Optional. Takes either a single string or array of labels.
  'schema': {}, // Optional. A default schema.
  'schemas': {}, // Optional. A key-value object of schemas can be passed in.
}
```

### `new Node(data, id)`

If an id is specified as the second argument then the node represents an `update` or `replace` operation. If this is not the case then the node represents a `create` operation and the id should either be found in `data[id]` or a uuid will be automatically generated.

## `defineRelationship(relationshipDefinition)`

```javascript
{
  'type': '', // Optional. Takes a single string.
  'schema': {}, // Optional. A default schema.
  'schemas': {}, // Optional. A key-value object of schemas can be passed in.
}
```

### `new Relationship(data, nodes, direction)`

## `save(Node|Relationship)`

## `remove(Node|Relationship)`

## `query(...)`

This supports multiple queries and can return multiple result sets. In our case `then()` will receive all of these results, however we supply a set of helper methods against the promise that make it easy to parse the results for the simpler case of one query.

We detect `RETURN n, r, m, etc` and will use this to work out a reasonable response.

e.g.

```javascript
import { connect } from 'neo4j-simple'

const { query } = connect("http://localhost:7474")

query('MATCH (n:Example) RETURN n LIMIT 100').then((results) => {
  console.log(results) // --> [{ properties of n }, { properties of n }]
})

query('MATCH (u:User)-->(p:Product) RETURN u.name AS name, p').oneRow().then((result) => {
  console.log(result) // --> { name, p: { properties of p } }
})

query('MATCH (n:Example) RETURN count(n) AS count').oneRow().then((result) => {
  console.log(result) // --> { count }
})
```

## `get(Node|Relationship)(id) === getNode|getRelationship(id)`

This is a function that executes an explicit query for a specific id.

## `createTransaction(getNode|getRelationship)(ids) === getNodes|getRelationships(ids)`

This is a function that executes an explicit query for a specific array of ids.

# Support

I am using it in an internal project so it is in active development. There will likely be breaking changes happening. I will respond to any [issues](https://github.com/sebinsua/neo4j-simple/issues) raised.
