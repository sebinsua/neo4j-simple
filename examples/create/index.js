import { defineNode, connect } from '../../src'
import Joi from 'joi'

const { save } = connect("http://localhost:7474")

const Node = defineNode({
  label: ['Example'],
  schema: {
    name: Joi.string().required()
  }
})

const basicExampleNode = new Node({
  name: "This is a very basic example"
})

save(basicExampleNode).then((results) => {
  console.log(results)
}).catch((error) => {
  console.log(error)
})
