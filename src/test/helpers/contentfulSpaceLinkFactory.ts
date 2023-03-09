import type {MetaLinkProps} from 'contentful-management'

type SpaceLink = {
  sys: MetaLinkProps
}

export function contentfulSpaceLinkFactory(id: string): SpaceLink {
  return {
    sys: {
      id,
      type: 'Link' as const,
      linkType: 'Space' as const,
    },
  }
}
