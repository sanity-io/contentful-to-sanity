import type {CFNode} from '@portabletext/contentful-rich-text-to-portable-text/dist/cfTypes'

export function objectIsContentfulRichText(value: any | CFNode): value is CFNode {
  return (
    value &&
    typeof value === 'object' &&
    'nodeType' in value &&
    value.nodeType === 'document'
  )
}
