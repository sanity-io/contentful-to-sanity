import {contentfulContentTypeLinkFactory} from './contentfulContentTypeLinkFactory'
import {contentfulSpaceLinkFactory} from './contentfulSpaceLinkFactory'
import {contentfulEnvironmentLinkFactory} from './contentfulEnvironmentLinkFactory'
import type {EditorInterfaceProps, Control} from 'contentful-management'

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
