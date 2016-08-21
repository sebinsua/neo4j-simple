import see from 'tap-debug/see'
import { createConnection } from '../../src'
import Joi from 'joi'

const { queryOneRow } = createConnection('http://localhost:7474')

queryOneRow('MATCH (n) RETURN n LIMIT 100')
  .then(see('The results are'))
  .catch(see('There was an error running the query'))
