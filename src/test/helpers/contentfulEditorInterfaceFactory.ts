import type {Control, EditorInterfaceProps} from 'contentful-management'

import {contentfulContentTypeLinkFactory} from './contentfulContentTypeLinkFactory'
import {contentfulEnvironmentLinkFactory} from './contentfulEnvironmentLinkFactory'
import {contentfulSpaceLinkFactory} from './contentfulSpaceLinkFactory'

export function contentfulEditorInterfaceFactory(
  contentType: string,
  controls: Control[],
): EditorInterfaceProps {
  return {
    sys: {
      id: 'default',
      type: 'EditorInterface',
      createdAt: '2022-02-15T10:00:00Z',
      updatedAt: '2022-02-15T10:00:00Z',
      version: 1,
      space: contentfulSpaceLinkFactory('space'),
      environment: contentfulEnvironmentLinkFactory('master'),
      contentType: contentfulContentTypeLinkFactory(contentType),
    },
    controls,
  }
}
