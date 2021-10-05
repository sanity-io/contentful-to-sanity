const jsdom = require('jsdom')
const md = require('markdown-it')({html: true})
const Schema = require('@sanity/schema').default
const blockTools = require('@sanity/block-tools').default

const {JSDOM} = jsdom
const schema = Schema.compile({
  name: 'default',
  types: [
    {
      type: 'object',
      name: 'mock',
      fields: [
        {
          title: 'Body',
          name: 'body',
          type: 'array',
          of: [{type: 'block'}, {type: 'image'}]
        }
      ]
    }
  ]
})

const blockContentType = schema
  .get('mock')
  .fields.find((field) => field.name === 'body').type

const extractImages = (el, next) => {
  if (
    el.tagName === 'P' &&
    el.childNodes.length === 1 &&
    el.childNodes[0].tagName === 'IMG'
  ) {
    return {
      _sanityAsset: `image@${el.childNodes[0]
        .getAttribute('src')
        .replace(/^\/\//, 'https://')}`
    }
  }

  // Only convert block-level images, for now
  return undefined
}

module.exports = (input, options) => {
  const html = md.render(input)
  const blocks = blockTools.htmlToBlocks(html, {
    rules: [{deserialize: extractImages}],
    blockContentType,
    parseHtml: (htmlContent) => new JSDOM(htmlContent).window.document
  })

  return blocks
}
