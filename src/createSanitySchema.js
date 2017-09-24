const prettier = require('prettier')

const schemaTemplate = `
const createSchema = require('part:@sanity/base/schema-creator')

module.exports = createSchema({
  name: 'default',
  types: [__TYPES__]
})
`

const defaultPrettierOptions = {
  semi: false,
  singleQuote: true,
  bracketSpacing: false,
  printWidth: 100
}

function createSanitySchema(types, options = {}) {
  const typeNames = types.map(type => type.name)
  const typeRequires = typeNames.map(generateRequire).join(',\n')
  const prettierOptions = Object.assign({}, defaultPrettierOptions, options.prettierOptions)

  return types
    .map(type => ({
      path: `${type.name}.js`,
      content: format(`module.exports = ${JSON.stringify(type, null, 2)}`)
    }))
    .concat({
      path: 'schema.js',
      content: format(schemaTemplate.replace(/__TYPES__/, typeRequires))
    })

  function format(content) {
    return prettier.format(content, prettierOptions)
  }
}

function generateRequire(typeName) {
  return `require('./${typeName}')`
}

module.exports = createSanitySchema
