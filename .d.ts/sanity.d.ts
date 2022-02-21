import '@sanity/types'

declare module '@sanity/types' {
  interface Reference {
    _sanityAsset?: string
  }
}
