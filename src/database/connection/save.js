// TODO: `save` vs `saveAll` distinction. How are the `*all` versions created? It is with `createTransaction(operation)`?

// By default the validator will check for a default guard which if empty will validate successfully.
// Additionally it will try to intelligently select a schema depending on the
// operation that is executing. For example: create, replace, update.

export default () => {}
