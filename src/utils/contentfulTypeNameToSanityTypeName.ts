import {isReservedName} from '../helpers/sanity/reservedNames'

export const contentfulTypeNameToSanityTypeName = (name: string) => {
  const isCollision = isReservedName(name)
  const sanityTypeName = isCollision ? `contentful_${name}` : name

  return {
    isCollision,
    name: sanityTypeName,
  }
}
