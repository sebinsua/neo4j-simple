neo4j-promised
==============

A Neo4j API that provides nodes and relationships in the form of promises on top of Cypher.

Example
=======

Define models for your nodes and relationships.

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

var exampleRelationship = new OfferRelationship({
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
