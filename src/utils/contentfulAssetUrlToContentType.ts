import type {AssetProps} from 'contentful-management'

import {prefixUrl} from './contentfulLinkToSanityReference'
export type ContentfulAssetFields = Pick<AssetProps, 'fields'>[]

export function contentfulAssetUrlToContentType(
  url: string,
  assets: ContentfulAssetFields,
  localeId: string,
) {
  const asset = assets.find((a) => {
    if (!a.fields.file) {
      return false
    }
    const assetUrl = a.fields.file[localeId].url
    return assetUrl && prefixUrl(assetUrl) === prefixUrl(url)
  })
  if (asset) {
    return asset?.fields.file[localeId].contentType
  }

  // If we can't find the asset, we'll try to guess the content type from the file extension
  const extension = url.split('.').pop()
  if (extension) {
    return `image/${extension}`
  }

  return undefined
}
