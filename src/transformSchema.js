const directMap = {
  Integer: 'number',
  Number: 'number',
  Symbol: 'string',
  Location: 'geopoint',
  Boolean: 'boolean',
  Date: 'datetime',
  Object: 'object' // @todo Arbitrary JSON editor?
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

function transformSchema(data) {
  return data.contentTypes.map(type => transformContentType(type, data))
}

function transformContentType(type, data) {
  const output = {
    name: type.sys.id,
    title: type.name,
    description: type.description || undefined,
    type: 'object'
  }

  if (type.displayField) {
    output.preview = {select: {title: type.displayField}}
  }

  output.fields = type.fields.filter(field => !field.omitted).map(source =>
    Object.assign(
      {
        name: source.id,
        title: source.name
      },
      isRequired(source),
      isHidden(source),
      {type: undefined},
      contentfulTypeToSanityType(source, data, type.sys.id)
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

function contentfulTypeToSanityType(source, data, typeId) {
  const editor = data.editorInterfaces.find(ed => ed.sys.contentType.sys.id === typeId)
  const widgetId = editor.controls.find(ctrl => ctrl.fieldId === source.id).widgetId
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

  // @todo This kind of depends on the editor.
  // We probably want to convert to block-text on markdown?
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

  throw new Error(
    `Unhandled data type "${source.type}" with widget "${widgetId}" for field "${source.id}" of type "${typeId}"`
  )
}

function determineSlugType(source, data, typeId) {
  const type = data.contentTypes.find(typ => typ.sys.id === typeId)
  const sourceField = type.displayField
  if (!sourceField) {
    throw new Error(`Unable to determine which field to extract slug from`)
  }

  return {type: 'slug', options: {source: sourceField}}
}

function determineSelectOptions(source, data, typeId) {
  const validations = source.items ? source.items.validations : source.validations
  const onlyValues = (validations.find(val => val.in) || {}).in
  const editor = data.editorInterfaces.find(ed => ed.sys.contentType.sys.id === typeId)
  const widgetId = editor.controls.find(ctrl => ctrl.fieldId === source.id).widgetId
  const layout = editorMap[widgetId]

  return onlyValues ? {list: onlyValues, layout} : {layout}
}

function determineArrayType(source, data, typeId) {
  const itemsType = source.items.type
  const onlyValues = (source.items.validations.find(val => val.in) || {}).in

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
    field.of = [determineRefType(source.items)]
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
  const mimeValidation = source.validations.find(val => val.linkMimetypeGroup) || {}
  const mimeGroups = mimeValidation.linkMimetypeGroup || []

  if (mimeGroups.includes('image')) {
    return {type: 'image'}
  }

  // @todo file/image?
  return {type: 'file'}
}

function determineEntryRefType(source, data) {
  const typeValidation = source.validations.find(val => val.linkContentType) || {}
  const linkTypes = typeValidation.linkContentType || []
  if (linkTypes.length === 1) {
    return {type: 'reference', to: [{type: linkTypes[0]}]}
  }

  if (linkTypes.length > 1) {
    return {type: 'reference', to: linkTypes.map(type => ({type}))}
  }

  return {type: 'reference', to: data.contentTypes.map(type => ({type: type.sys.id}))}
}

module.exports = transformSchema
