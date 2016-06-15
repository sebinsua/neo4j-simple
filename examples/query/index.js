import { connect } from '../../src'
import Joi from 'joi'

const { query } = connect("http://localhost:7474")

const log = console.log.bind(console)

query('MATCH (n) RETURN n LIMIT 100')
  .oneRow()
  .then(log)
  .catch(log)
