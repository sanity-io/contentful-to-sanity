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
          of: [{type: 'block'}]
        }
      ]
    }
  ]
})

const blockContentType = schema.get('mock').fields.find(field => field.name === 'body').type
const unwrapQuotes = (el, next) => {
  return undefined
}

module.exports = input => {
  const html = md.render(input)
  const blocks = blockTools.htmlToBlocks(html, {
    blockContentType,
    rules: [{deserialize: unwrapQuotes}],
    parseHtml: htmlContent => new JSDOM(htmlContent).window.document
  })
  return blocks
}
