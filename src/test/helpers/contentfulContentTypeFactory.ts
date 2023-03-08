import type {ContentFields, ContentTypeProps} from 'contentful-management'

import {contentfulEnvironmentLinkFactory} from './contentfulEnvironmentLinkFactory'
import {contentfulSpaceLinkFactory} from './contentfulSpaceLinkFactory'

export function contentfulContentTypeFactory(
  contentType: string,
  fields: ContentFields[],
  displayField = '',
): ContentTypeProps {
  return {
    sys: {
      id: contentType,
      createdAt: '2022-02-15T10:00:00Z',
      updatedAt: '2022-02-15T10:00:00Z',
      environment: contentfulEnvironmentLinkFactory('master'),
      space: contentfulSpaceLinkFactory('space'),
      type: 'ContentType',
      version: 1,
    },
    name: contentType,
    displayField,
    description: '',
    fields,
  }
}
