const prettier = require('prettier')
const upperFirst = require('lodash/upperFirst')
const defaultsDeep = require('lodash/defaultsDeep')

const schemaTemplate = `
import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
__IMPORTS__

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([__TYPES__])
})
`

const defaultPrettierOptions = {
  parser: 'babylon',
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
      content: format(generateSchemaForType(type))
    }))
    .concat({
      path: 'schema.js',
      content: format(schemaContent)
    })

  function format(content) {
    return prettier.format(content, prettierOptions)
  }
}

function generateSchemaForType(type) {
  const typeField =
    type.preview &&
    type.fields.find(field => field.name === type.preview.select.title)

  const blockPreview = typeField && typeField.type === 'array'

  if (!blockPreview) {
    return `export default ${processJsonSchema(JSON.stringify(type, null, 2))}`
  }

  const prepareMethod = `values => {
    const getFirstText = block => block.children && block.children[0] && block.children[0].text
    const block = values.title.find(getFirstText)
    return {title: block && getFirstText(block)}
  }`

  const preparedType = defaultsDeep({preview: {prepare: '__PREPARE__'}}, type)
  const typeContent = `export default ${processJsonSchema(JSON.stringify(preparedType, null, 2))}`
  return typeContent.replace(/["']__PREPARE__["']/, prepareMethod)
}

function processJsonSchema(typeDef) {
  return typeDef.replace(/"required": true,\n /g, '"validation": Rule => Rule.required(),\n')
}

function generateImport(typeName) {
  return `import ${typeName} from './${typeName}'`
}

module.exports = createSanitySchema
