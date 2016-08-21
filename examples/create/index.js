import see from 'tap-debug/see'
import { createConnection, defineNode } from '../../src'
import Joi from 'joi'

const { save } = createConnection("http://localhost:7474")

const ExampleNode = defineNode({
  label: [ 'Example' ],
  schema: Joi.object().keys({
    name: Joi.string().required()
  })
})

const basicExampleNode = new ExampleNode({
  name: "This is a very basic example"
})

save(basicExampleNode)
  .then(see('Node was saved successfully'))
  .catch(see('There was an error saving the Node'))
