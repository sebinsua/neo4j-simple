neo4j-promised
==============

A [Neo4j](http://neo4j.com/) API for Node.js that provides nodes and relationships in [the form of promises](https://github.com/petkaantonov/bluebird) using the [Cypher query langauge](http://neo4j.com/developer/cypher-query-language/).

I know there are plenty of other modules that can be used to do this but when I looked none of them were very good.

This makes the simple things easy and gets out of your way so you can write your own bespoke Cypher queries unimpeded.

Example
=======

Define [Joi](https://github.com/hapijs/joi) data validatators for your nodes and relationships and then save them using promises.

```javascript

var Node = node.generate({
  label: ['Example'],
  schema: {
    'id': Joi.string().optional()
  }
});

var Relationship = relationship.generate({
  type: 'LOVE',
  schema: {
    'description': Joi.string()
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
}, [example1.id, example2.id], relationship.DIRECTION_RIGHT);

Q.all([
  example1.save(),
  example2.save(),
  example3.save(),
  exampleRelationship.save()
]).then(function () {
  console.log("Nodes and relationship saved successfully.");
});

```
