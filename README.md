# neo4j-simple
> A simple, functional `Neo4j` interface

[![Build Status](https://travis-ci.org/sebinsua/neo4j-simple.png)](https://travis-ci.org/sebinsua/neo4j-simple) [![npm version](https://badge.fury.io/js/neo4j-simple.svg)](https://npmjs.org/package/neo4j-simple)

`neo4j-simple` is a simple, functional interface for interacting with the database [Neo4j](http://neo4j.com/).

## Features

* [x] Built on top of the official database driver [`neo4j-javascript-driver`](https://github.com/neo4j/neo4j-javascript-driver) but with a less complicated interface.
* [x] Database interaction is through simple functions. Basic [Cypher](http://neo4j.com/developer/cypher-query-language/) queries are provided out-of-the-box.
* [x] There are only a few data types (`Node` and `Relationship`) and these can be validated with [`joi`](https://github.com/hapijs/joi).
* [x] The database interfaces [return promises](https://github.com/kevinbeaty/any-promise).

## TODO

- [x] Rewrite the interfaces in the `README.md` using [Neo4j](http://neo4j.com/docs/api/javascript-driver/current/) as a guide.
- [x] Move the rest of the design comments into the respective files or to GitHub issues if pie-in-sky.
- [ ] Write the tests for the interface defined within `README.md`.
- [ ] Fix the tests.
- [ ] Fix: import see from 'tap-debug/see'; and `__value` should work internally.
- [ ] Examples should have their own `package.json` files. Use `tap-debug` to simplify my examples.
- [ ] Update packages and flow type definitions. Finesse `README.md`.

## Working Implementation Notes

NOTE: Avoid chaining and variadic functions.
NOTE: [`Result` streams](http://neo4j.com/docs/api/javascript-driver/current/class/src/v1/result.js~Result.html) will not be exposed, instead `then` will return JavaScript objects after transforming [`Record`s](http://neo4j.com/docs/api/javascript-driver/current/class/src/v1/record.js~Record.html).

## Example

```javascript
import see from 'tap-debug/see'
import { createConnection, defineNode } from 'neo4j-simple'
import Joi from 'joi'

const { save } = createConnection({ url: 'http://localhost:7474' })

const ExampleNode = defineNode({
  label: [ 'Example' ],
  schema: Joi.object().keys({
    'name': Joi.string().required()
  })
})

const basicExampleNode = new ExampleNode({
  name: "This is a very basic example"
})

save(basicExampleNode).then(see('The node was created successfully: ${__value}'))
```

Another more involved example might look like this:

```javascript
import Promise from 'any-promise'
import { createConnection, defineNode, defineRelationship, constants } from 'neo4j-simple'
import Joi from 'joi'

const { save, update } = createConnection('http://localhost:7474')

const ExampleNode = defineNode({
  label: [ 'Example' ],
  // Multiple schemas can be assigned like so...
  schemas: {
    default: Joi.object().keys({
      id: Joi.string().optional(),
      type: Joi.string().required()
    }),
    update: Joi.object().keys({
      id: Joi.string().required(),
      type: Joi.string().optional(),
      name: Joi.string().optional()
    })
  }
})

const LoveRelationship = defineRelationship({
  type: 'LOVE',
  schema: Joi.object().keys({
    description: Joi.string()
  })
})

const example1 = new ExampleNode({
  id: 'some-id-goes-here-1',
  type: 'example',
  name: 'Example 1'
})
const example2 = new ExampleNode({
  id: 'some-id-goes-here-2',
  type: 'example',
  name: 'Example 2'
})
const example3 = new ExampleNode({
  id: 'some-id-goes-here-3',
  type: 'example',
  name: 'Example 3'
})

const exampleRelationship = new LoveRelationship({
  description: "It's true",
}, [ example1, example2 ], constants.DIRECTION_RIGHT)

const saveNodes = [ example1, example2 ].map(save)
const updateNode = update(example3)
Promise.all([ ...saveNodes, updateNode ])
       .then(() => save(exampleRelationship))
```

# API

**NOTE**

* All of the asynchronous methods return promises.
* A [Joi](https://github.com/hapijs/joi) schema can be passed into `defineNode()` and `defineRelationship()` either as `options.schema` or more explicitly as `options.schemas.default`. Additionally, if you want to validate on construction, this can be done with `options.schema.construct`.

## `createConnection(options: string|CreateConnectionOptions)`

## `defineNode(definition: NodeDefinition)`

#### `new Node(id: string, props: { [key: string]: any })` | `Node.create(id: string, props: { [key: string]: any })`

If an id is specified as the second argument then the node represents an `update` or `replace` operation. If this is not the case then the node represents a `create` operation and the id should either be found in `data[id]` or a UUID will be automatically generated.

## `defineRelationship(definition: RelationshipDefinition)`

#### `new Relationship(id: string, props: { [key: string]: any }, nodes: [Node, Node], direction: RelationshipDirection)` | `Relationship.create(id: string, props: { [key: string]: any }, nodes: [Node, Node], direction: RelationshipDirection)`

## `save(entity: Node|Relationship)`

## `create(entity: Node|Relationship)`

## `update(entity: Node|Relationship)`

## `replace(entity: Node|Relationship)`

## `remove(entity: Node|Relationship)`

## `query(q: string)`

This should take a single query and return a single result set.

We detect `RETURN n, r, m, etc` and will use this to work out a reasonable response.

e.g.

```javascript
import see from 'tap-debug/see'
import { createConnection } from 'neo4j-simple'

const { query, queryOneRow } = createConnection('http://localhost:7474')

query('MATCH (n:Example) RETURN n LIMIT 100').then(see('Results returned: ${__value}'))
// --> [{ properties of n }, { properties of n }]

queryOneRow('MATCH (u:User)-->(p:Product) RETURN u.name AS name, p').then(see('Result returned: ${__value}'))
// --> { name, p: { properties of p } }

queryOneRow('MATCH (n:Example) RETURN count(n) AS count').then(see('Count: ${__value}'))
// --> { count }
```

## `getNode(id: string)`

## `getNodes(ids: Array<string>)`

## `getRelationship(id: string)`

## `getRelationships(ids: Array<string>)`
