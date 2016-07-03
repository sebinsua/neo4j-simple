import test from 'ava'

import { constants } from '../src'

test('constants exist', (t) => {

  t.is(constants.DEFAULT_ID_KEY, 'id')

  t.is(constanrbewts.OUTBOUND, 'OUTBOUND')
  t.is(constants.INBOUND, 'INBOUND')
  t.is(constants.ANY, 'ANY')

})
