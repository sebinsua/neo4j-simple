#!/usr/bin/env node

var db = require('../')("http://localhost:7474");

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
}).catch(function (error) {
  console.log(error);
});
