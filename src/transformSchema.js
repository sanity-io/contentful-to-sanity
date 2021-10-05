const builtIns = require('./builtinTypes')

const directMap = {
  Integer: 'number',
  Number: 'number',
  Symbol: 'string',
  Location: 'geopoint',
  Boolean: 'boolean',
  Date: 'datetime',
  Object: 'object'
}

const defaultEditors = {
  Integer: 'numberEditor',
  Number: 'numberEditor',
  Symbol: 'singleLine',
  Location: 'locationEditor',
  Boolean: 'boolean',
  Date: 'datePicker',
  Object: 'objectEditor'
}

const editorMap = {
  radio: 'radio',
  dropdown: 'dropdown',
  tagEditor: 'tags'
}

function portableTextType(contentTypes) {
  const docNames = contentTypes
    .filter((typeDef) => typeDef.type === 'document')
    .map((doc) => doc.name)

  // We want to allow a reference to any document
  const docReferences = {
    type: 'reference',
    to: docNames.map((type) => ({type}))
  }

  return {
    name: 'portableText',
    type: 'array',
    title: 'Rich text',
    of: [
      {
        type: 'block',
        of: [{type: 'image'}, docReferences],
        styles: [
          {title: 'Normal text', value: 'normal'},
          {title: 'Heading 1', value: 'h1'},
          {title: 'Heading 2', value: 'h2'},
          {title: 'Heading 3', value: 'h3'},
          {title: 'Heading 4', value: 'h4'},
          {title: 'Heading 5', value: 'h5'},
          {title: 'Heading 6', value: 'h6'},
          {title: 'Quote', value: 'blockquote'}
        ],
        marks: {
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'URL',
              fields: [
                {
                  title: 'URL',
                  name: 'href',
                  type: 'url'
                }
              ]
            },
            {type: 'image'},
            docReferences
          ]
        }
      },
      {type: 'break'},
      {type: 'image'},
      docReferences
    ]
  }
}

function transformSchema(data, options) {
  const contentTypes = data.contentTypes.map((type) =>
    transformContentType(type, data, options)
  )

  return builtIns.concat(portableTextType(contentTypes)).concat(contentTypes)
}

function transformContentType(type, data, options) {
  const output = {
    name: type.sys.id,
    title: type.name,
    description: type.description || undefined,
    type: 'document'
  }

  if (type.displayField) {
    output.preview = {select: {title: type.displayField}}
  }

  output.fields = type.fields
    .filter((field) => !field.omitted)
    .filter((field) => !shouldSkip(field, data, type.sys.id))
    .map((source) =>
      Object.assign(
        {
          name: source.id,
          title: source.name
        },
        isRequired(source),
        isHidden(source),
        {type: undefined},
        contentfulTypeToSanityType(source, data, type.sys.id, options)
      )
    )

  return output
}

function isHidden(field) {
  return field.disabled ? {hidden: true} : {}
}

function isRequired(field) {
  return field.required ? {required: true} : {}
}

function shouldSkip(source, data, typeId) {
  const editor = data.editorInterfaces.find(
    (ed) => ed.sys.contentType.sys.id === typeId
  )
  const widgetId = editor.controls.find(
    (ctrl) => ctrl.fieldId === source.id
  ).widgetId
  return source.type === 'Object' && widgetId === 'objectEditor'
}

function contentfulTypeToSanityType(source, data, typeId, options) {
  const editor = data.editorInterfaces.find(
    (ed) => ed.sys.contentType.sys.id === typeId
  )
  const widgetId = editor.controls.find(
    (ctrl) => ctrl.fieldId === source.id
  ).widgetId
  const defaultEditor = defaultEditors[source.type]
  const sanityEquivalent = directMap[source.type]

  if (sanityEquivalent && widgetId === defaultEditor) {
    return {type: sanityEquivalent}
  }

  if (widgetId === 'urlEditor') {
    return {type: 'url'}
  }

  if (widgetId === 'slugEditor') {
    return determineSlugType(source, data, typeId)
  }

  if (
    !options.keepMarkdown &&
    source.type === 'Text' &&
    widgetId === 'markdown'
  ) {
    return {
      type: 'array',
      of: [{type: 'block'}, {type: 'image'}]
    }
  }

  if (source.type === 'Text') {
    return {type: 'text'}
  }

  if (source.type === 'Link') {
    return determineRefType(source, data, typeId)
  }

  if (source.type === 'Array') {
    return determineArrayType(source, data, typeId)
  }

  if (sanityEquivalent && ['dropdown', 'radio'].includes(widgetId)) {
    const {list, layout} = determineSelectOptions(source, data, typeId)
    return {type: sanityEquivalent, options: {list, layout}}
  }

  if (source.type === 'Symbol') {
    return {type: 'string'}
  }

  if (source.type === 'RichText') {
    // this is a type we supply. See the portableTextType() function
    return {type: 'portableText'}
  }

  throw new Error(
    `Unhandled data type "${source.type}" with widget "${widgetId}" for field "${source.id}" of type "${typeId}"`
  )
}

function determineSlugType(source, data, typeId) {
  const type = data.contentTypes.find((typ) => typ.sys.id === typeId)
  const sourceField = type.displayField
  if (!sourceField) {
    throw new Error(`Unable to determine which field to extract slug from`)
  }

  return {type: 'slug', options: {source: sourceField}}
}

function determineSelectOptions(source, data, typeId) {
  const validations = source.items
    ? source.items.validations
    : source.validations
  const onlyValues = (validations.find((val) => val.in) || {}).in
  const editor = data.editorInterfaces.find(
    (ed) => ed.sys.contentType.sys.id === typeId
  )
  const widgetId = editor.controls.find(
    (ctrl) => ctrl.fieldId === source.id
  ).widgetId
  const layout = editorMap[widgetId]

  return onlyValues ? {list: onlyValues, layout} : {layout}
}

function determineArrayType(source, data, typeId) {
  const itemsType = source.items.type
  const onlyValues = (source.items.validations.find((val) => val.in) || {}).in

  const field = {type: 'array'}
  const type = directMap[itemsType]
  const {list, layout} = determineSelectOptions(source, data, typeId)

  if (type === 'string' && onlyValues) {
    field.of = [{type: 'string', options: {list, layout}}]
    return field
  }

  if (type) {
    field.of = [{type, options: {layout}}]
    return field
  }

  if (itemsType === 'Link') {
    field.of = [determineRefType(source.items, data)]
    return field
  }

  throw new Error(
    `Unable to determine array items type for field "${source.id}" of type "${typeId}"`
  )
}

function determineRefType(source, data) {
  if (source.linkType === 'Entry') {
    return determineEntryRefType(source, data)
  }

  if (source.linkType === 'Asset') {
    return determineAssetRefType(source, data)
  }

  throw new Error(`Unhandled link type "${source.linkType}"`)
}

function determineAssetRefType(source, data) {
  const mimeValidation =
    source.validations.find((val) => val.linkMimetypeGroup) || {}
  const mimeGroups = mimeValidation.linkMimetypeGroup || []

  if (
    mimeGroups.includes('image') ||
    ['image', 'picture'].includes(source.id)
  ) {
    return {type: 'image'}
  }

  // @todo file/image?
  return {type: 'file'}
}

function determineEntryRefType(source, data) {
  const typeValidation =
    source.validations.find((val) => val.linkContentType) || {}
  const linkTypes = (typeValidation.linkContentType || []).filter(
    (typeName) => {
      // Validations can contain deleted content types - make sure to remove them
      return data.contentTypes.some((type) => type.sys.id === typeName)
    }
  )

  if (linkTypes.length === 0) {
    // Allow referencing all types
    return {
      type: 'reference',
      to: data.contentTypes.map((type) => ({type: type.sys.id}))
    }
  }

  return {type: 'reference', to: linkTypes.map((type) => ({type}))}
}

module.exports = transformSchema
