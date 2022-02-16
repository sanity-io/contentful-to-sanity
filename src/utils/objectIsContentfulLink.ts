import type {Link} from 'contentful-management'

export type SysLink = Link<'Asset' | 'Entry'>

export function objectIsContentfulLink(value: any | SysLink): value is SysLink {
  return (
    value &&
    typeof value === 'object' &&
    'sys' in value &&
    'type' in value.sys &&
    value.sys.type === 'Link'
  )
}
