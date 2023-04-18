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

// and https://github.com/sanity-io/sanity/blob/df16d464cf9ae6ebabdbc5883f60c5e036e13d98/packages/@sanity/schema/src/core/traverseSchema.ts#L70-L72
const FUTURE_RESERVED = ['any', 'time', 'date']

export const isReservedName = (name: string): boolean => {
  const coreTypeNames = coreTypes.map((typeDef) => typeDef.name)
  const reservedTypeNames = FUTURE_RESERVED.concat(coreTypeNames)
  return name === 'type' || reservedTypeNames.includes(name) || !!name.match(/^sanity|system\./)
}
