#!/usr/bin/env node

var db = require('../')('http://localhost:7474');

db.query('MATCH (n) RETURN n LIMIT 100').
   getResult('n').
   then(function (n) {
     console.log(n);
   }).
   catch(function (error) {
     console.log(error);
   });
