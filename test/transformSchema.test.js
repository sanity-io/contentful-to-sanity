const transformSchema = require('../src/transformSchema')
const assert = require('assert')

const defaultOptions = {
  keepMarkdown: true // This is not connected to RichText
}

describe('transformSchema', () => {
  describe('RichText', () => {
    const fixture = require('./fixtures/richText.json')
    it('includes an object for handling HR', () => {
      const schema = transformSchema(fixture, defaultOptions)
      assert(
        schema.filter(
          typeDef => typeDef.name === 'break' && typeDef.type == 'object'
        ).length === 1,
        'Did not export break type for dealing with HR'
      )
    })

    it('uses portableText type for RichText fields', () => {
      const schema = transformSchema(fixture, defaultOptions)
      const doc = schema.find(
        typeDef =>
          typeDef.name === 'fullRichText' && typeDef.type === 'document'
      )
      assert(doc, 'Could not find document')

      const field = doc.fields.find(field => field.name == 'body')
      assert(!!field, 'Missing body field')
      expect(field.type).toEqual('portableText')
    })
  })
})
