import see from 'tap-debug/see'
import { createConnection, defineNode, defineRelationship, constants } from '../../src'
import Joi from 'joi'

const { save } = createConnection('http://localhost:7474')

const ExampleNode = defineNode({
  label: ['Example'],
  schema: Joi.object().keys({
    name: Joi.string().required()
  })
})

const LoveRelationship = defineRelationship({
  type: 'LOVE',
  schema: Joi.object().keys({
    description: Joi.string()
  })
})

const example1 = new ExampleNode({
  id: 'some-id-goes-here-1',
  name: 'Example 1'
})
const example2 = new ExampleNode({
  id: 'some-id-goes-here-2',
  name: 'Example 2'
})

const exampleRelationship = new LoveRelationship({
  description: "It's true",
}, [ example1, example2 ], constants.DIRECTION_RIGHT)

const saves = [ example1, example2, exampleRelationship ].map(save)

Promise.all(saves)
  .then(see('Successfully saved'))
  .catch(see('There was an error saving'))
