const markdownToBlocks = require('./markdownToBlocks')

const transformData = (data, options = {}) => {
  if (data.locales.length > 1 && !options.locale) {
    throw new Error('Only one locale supported currently, please specify which locale to use')
  }

  if (options.locale && !data.locales.find(locale => locale.code === options.locale)) {
    throw new Error(`Locale "${options.locale}" not found in exported Contentful data`)
  }

  const locale = options.locale || data.locales[0].code
  const opts = Object.assign({}, options, {locale})
  return data.entries.filter(isPublished).map(entry => transformEntry(entry, data, opts))
}

function isPublished(entry) {
  return typeof entry.sys.publishedAt === 'string'
}

function transformEntry(entry, data, options) {
  const doc = {
    _id: entry.sys.id,
    _type: entry.sys.contentType.sys.id,
    _createdAt: entry.sys.createdAt,
    _updatedAt: entry.sys.updatedAt
  }

  return Object.keys(entry.fields).reduce((acc, fieldName) => {
    acc[fieldName] = transformField(entry, fieldName, data, options)
    return acc
  }, doc)
}

function transformField(entry, fieldName, data, options) {
  const {locale, keepMarkdown} = options
  const value = entry.fields[fieldName][locale]
  const typeId = entry.sys.contentType.sys.id
  const editor = data.editorInterfaces.find(ed => ed.sys.contentType.sys.id === typeId)
  const widgetId = editor.controls.find(ctrl => ctrl.fieldId === fieldName).widgetId

  if (typeof value === 'undefined') {
    return undefined
  }

  if (!keepMarkdown && typeof value === 'string' && widgetId === 'markdown') {
    return markdownToBlocks(value)
  }

  if (value && value.sys && value.sys.type === 'Link') {
    return transformLink(value, data, locale)
  }

  const parentTypeDef = data.contentTypes.find(type => type.sys.id === typeId)
  if (!parentTypeDef) {
    throw new Error(`Could not find type definition for type "${typeId}"`)
  }

  const typeDef = parentTypeDef.fields.find(field => field.id === fieldName)
  if (!typeDef) {
    throw new Error(`Could not find type definition for field "${fieldName}" in type "${typeId}"`)
  }

  if (typeDef.type === 'Location') {
    return transformLocation(value)
  }

  if (Array.isArray(value)) {
    return value.map(val => {
      if (val && val.sys && val.sys.type === 'Link') {
        return transformLink(val, data, locale)
      }

      return val
    })
  }

  return value
}

function transformLocation(coords) {
  return {
    _type: 'geopoint',
    lat: coords.lat,
    lng: coords.lon
  }
}

function transformLink(value, data, locale) {
  if (value.sys.linkType === 'Asset') {
    return transformAssetLink(value, data, locale)
  }

  if (value.sys.linkType === 'Entry') {
    return {_type: 'reference', _ref: value.sys.id}
  }

  throw new Error(`Unhandled link type "${value.sys.linkType}"`)
}

function transformAssetLink(value, data, locale) {
  const asset = data.assets.find(item => item.sys.id === value.sys.id)
  if (!asset) {
    throw new Error(`Document referenced non-existing asset with ID "${value.sys.id}"`)
  }

  const file = asset.fields.file[locale]
  const type = file.contentType.startsWith('image/') ? 'image' : 'file'
  return {_type: 'reference', _sanityAsset: `${type}@${prefixUrl(file.url)}`}
}

function prefixUrl(url) {
  return url.startsWith('//') ? `https:${url}` : url
}

module.exports = transformData
