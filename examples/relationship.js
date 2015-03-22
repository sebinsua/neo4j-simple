var db = require('../')("http://localhost:7474");

var Node = db.defineNode({
  label: ['Example'],
  schema: {
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
  id: "some-id-goes-here-2",
  name: "Example 2"
});

var exampleRelationship = new Relationship({
  description: "It's true",
}, [example1.id, example2.id], db.DIRECTION.RIGHT);

Promise.all([
  example1.save(),
  example2.save(),
  exampleRelationship.save()
]).then(function (response) {
  console.log("success");
  console.log(response);
}).catch(function (error) {
  console.log("error");
  console.log(error);
});
