import type {MetaLinkProps} from 'contentful-management'

type ContentTypeLink = {
  sys: MetaLinkProps
}

export function contentfulContentTypeLinkFactory(id: string): ContentTypeLink {
  return {
    sys: {
      id,
      type: 'Link' as const,
      linkType: 'ContentType' as const,
    },
  }
}
