declare interface Error {
  code?: string | number
}

import '@sanity/types'

declare module '@sanity/types' {
  interface Reference {
    _sanityAsset?: string
  }
}
