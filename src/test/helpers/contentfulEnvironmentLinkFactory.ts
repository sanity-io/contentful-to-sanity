import type {MetaLinkProps} from 'contentful-management'

type EnvironmentLink = {
  sys: MetaLinkProps
}

export function contentfulEnvironmentLinkFactory(id: string): EnvironmentLink {
  return {
    sys: {
      id,
      type: 'Link' as const,
      linkType: 'Environment' as const,
    },
  }
}
