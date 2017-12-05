const prettier = require('prettier')
const upperFirst = require('lodash/upperFirst')

const schemaTemplate = `
import createSchema from 'part:@sanity/base/schema-creator'
__IMPORTS__

export default createSchema({
  name: 'default',
  types: [__TYPES__]
})
`

const defaultPrettierOptions = {
  semi: false,
  singleQuote: true,
  bracketSpacing: false
}

function createSanitySchema(types, options = {}) {
  const typeNames = types.map(type => upperFirst(type.name))
  const typeImports = typeNames.map(generateImport).join('\n')
  const typeArray = typeNames.join(', ')
  const prettierOptions = Object.assign({}, defaultPrettierOptions, options.prettierOptions)
  const schemaContent = schemaTemplate
    .replace(/__TYPES__/, typeArray)
    .replace(/__IMPORTS__/, typeImports)

  return types
    .map(type => ({
      path: `${upperFirst(type.name)}.js`,
      content: format(`export default ${JSON.stringify(type, null, 2)}`)
    }))
    .concat({
      path: 'schema.js',
      content: format(schemaContent)
    })

  function format(content) {
    return prettier.format(content, prettierOptions)
  }
}

function generateImport(typeName) {
  return `import ${typeName} from './${typeName}'`
}

module.exports = createSanitySchema
