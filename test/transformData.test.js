const assert = require('assert')
const transformData = require('../src/transformData')

describe('transformData', () => {
  describe('RichText', () => {
    it('handles HR', () => {
      const hr = require('./fixtures/hrexport.json')
      const res = transformData(hr)
      const doc = res[0]
      assert(doc, 'Didnt produce document')
      expect(doc.body[1]._type).toBe('break')
    })

    it('imports image assets', () => {
      const fixture = require('./fixtures/richTextLinks.json')
      const res = transformData(fixture)
      const post = res.find(doc => doc._id === '7vT1sZuT2szsmpywiFIAZz')

      const embeddedImageAssetRef = post.body.filter(
        node =>
          node._sanityAsset &&
          node._sanityAsset.match(/^image@.+Phnom.Penh.original.11991.jpg$/)
      )
      assert(
        embeddedImageAssetRef.length > 0,
        'Didnt find embedded image asset'
      )
    })
  })
})
