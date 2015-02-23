neo4j-promised
==============

[![Build Status](https://travis-ci.org/sebinsua/neo4j-promised.png)](https://travis-ci.org/sebinsua/neo4j-promised) [![npm version](https://badge.fury.io/js/neo4j-promised.svg)](https://npmjs.org/package/neo4j-promised)

A [Neo4j](http://neo4j.com/) API for Node.js that provides nodes and relationships in [the form of promises](https://github.com/petkaantonov/bluebird) using the [Cypher query langauge](http://neo4j.com/developer/cypher-query-language/).

I know there are plenty of other modules that can be used to do this but when I looked none of them were very good.

This makes the simple things easy and gets out of your way so you can write your own bespoke Cypher queries unimpeded through the `query()` method.

Example
=======

Define [Joi](https://github.com/hapijs/joi) data validators for your nodes and relationships and then save them using promises.

```javascript
var Q = require('bluebird');
var db = require('neo4j-promised')("http://localhost:7474");

var Node = db.defineNode({
  label: ['Example'],
  schema: {
    'id': db.Joi.string().optional()
  }
});

var Relationship = db.defineRelationship({
  type: 'LOVE',
  schema: {
    'description': db.Joi.string()
  }
});

var example1 = new Node({
  id: "some-id-goes-here-1"
});
var example2 = new Node({
  id: "some-id-goes-here-2"
});
var example3 = new Node({
  id: "some-id-goes-here-3"
});

var exampleRelationship = new Relationship({
  description: "It's true",
}, [example1.id, example2.id], db.DIRECTION.RIGHT);

Q.all([
  example1.save(),
  example2.save(),
  example3.save()
]).then(function (response) {
  return exampleRelationship.save();
});
```
