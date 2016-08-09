// TODO: [`Transaction`](http://neo4j.com/docs/api/javascript-driver/current/class/src/v1/transaction.js~Transaction.html).

// `createTransaction(getNode|getRelationship)(ids) === getNodes|getRelationships(ids)`

// Comment that we can use this logic later on to handle transactions with multiple disparate operations.
// `saveAll` is a `createTransaction(save)`, which is actually:
// createTransaction(operation) {
//   return (entity) => {
//     const entities = [].concat(entity)
//     const transactionId = beginTransaction()
//     const operateWithTransaction = withTransaction(transactionId)(operation)
//     return operateWithTransaction(entities)
//           .then(() => commitTransaction(transactionId))
//           .catch(() => rollbackTransaction(transactionId))
//   }
// }
// `withTransaction` creates a function which takes datas and does the required stuffs to do validations, concatenate queries, etc.

export default () => {}
