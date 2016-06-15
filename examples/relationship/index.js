import { defineNode, defineRelationship, connect, constants } from '../../src'
import Joi from 'joi'

const { query } = connect("http://localhost:7474")

const Node = defineNode({
  label: ['Example'],
  schema: {
    name: Joi.string().required()
  }
})

const Relationship = defineRelationship({
  type: 'LOVE',
  schema: {
    description: Joi.string()
  }
})

const example1 = new Node({
  id: "some-id-goes-here-1",
  name: "Example 1"
})
const example2 = new Node({
  id: "some-id-goes-here-2",
  name: "Example 2"
})

const exampleRelationship = new Relationship({
  description: "It's true",
}, [example1, example2], constants.DIRECTION_RIGHT)

const saves = [ example1, example2, exampleRelationship ].map(save)
Promise.all(saves).then((response) => {
  console.log("success")
  console.log(response)
}).catch((error) => {
  console.log("error")
  console.log(error)
})
