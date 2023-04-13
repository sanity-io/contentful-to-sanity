// From https://github.com/sanity-io/sanity/blob/next/packages/%40sanity/schema/src/sanity/coreTypes.ts
export const coreTypes = [
  {name: 'array', jsonType: 'array', type: 'type'},
  {name: 'block', jsonType: 'object', type: 'type'},
  {name: 'boolean', jsonType: 'boolean', type: 'type'},
  {name: 'datetime', jsonType: 'string', type: 'type'},
  {name: 'date', jsonType: 'string', type: 'type'},
  {name: 'document', jsonType: 'object', type: 'type'},
  {name: 'email', jsonType: 'string', type: 'type'},
  {name: 'file', jsonType: 'object', type: 'type'},
  {name: 'geopoint', jsonType: 'object', type: 'type'},
  {name: 'image', jsonType: 'object', type: 'type'},
  {name: 'number', jsonType: 'number', type: 'type'},
  {name: 'object', jsonType: 'object', type: 'type'},
  {name: 'reference', jsonType: 'object', type: 'type'},
  {name: 'crossDatasetReference', jsonType: 'object', type: 'type'},
  {name: 'slug', jsonType: 'object', type: 'type'},
  {name: 'string', jsonType: 'string', type: 'type'},
  {name: 'telephone', jsonType: 'string', type: 'type'},
  {name: 'text', jsonType: 'string', type: 'type'},
  {name: 'url', jsonType: 'string', type: 'type'},
]

export const isReservedName = (name: string): boolean => {
  return coreTypes.map((type) => type.name).includes(name) || !!name.match(/^sanity|system\./)
}
