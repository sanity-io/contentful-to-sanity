import {ContentFields} from 'contentful-management'
import compact from 'just-compact'
import {ContentfulExport} from 'types'

import {BlockSanityFieldSchema, LinkedType, ObjectSanityFieldSchema} from '@/types'

const allStyles = [
  {title: 'Normal text', value: 'normal'},
  {title: 'Heading 1', value: 'h1'},
  {title: 'Heading 2', value: 'h2'},
  {title: 'Heading 3', value: 'h3'},
  {title: 'Heading 4', value: 'h4'},
  {title: 'Heading 5', value: 'h5'},
  {title: 'Heading 6', value: 'h6'},
  {title: 'Quote', value: 'blockquote'},
  {title: 'Separator', value: 'hr'},
]

const allLists = [
  {title: 'Bullet', value: 'bullet'},
  {title: 'Numbered', value: 'number'},
]

const allDecoratorMarks = [
  {title: 'Strong', value: 'strong'},
  {title: 'Emphasis', value: 'em'},
  {title: 'Underline', value: 'underline'},
  {title: 'Code', value: 'pre'},
]

const isStyleSupportedFns: Record<string, (enabledNodeTypes?: string[]) => boolean> = {
  h1: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('heading-1')),
  h2: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('heading-2')),
  h3: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('heading-3')),
  h4: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('heading-4')),
  h5: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('heading-5')),
  h6: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('heading-6')),
  blockquote: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('blockquote')),
}

const isListSupportedFns: Record<string, (enabledNodeTypes?: string[]) => boolean> = {
  bullet: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('unordered-list')),
  number: (enabledNodeTypes?: string[]) =>
    Boolean(enabledNodeTypes && enabledNodeTypes.includes('ordered-list')),
}

const isMarkSupportedFns: Record<string, (enabledMarks?: string[]) => boolean> = {
  strong: (enabledMarks?: string[]) => Boolean(enabledMarks && enabledMarks.includes('bold')),
  em: (enabledMarks?: string[]) => Boolean(enabledMarks && enabledMarks.includes('italic')),
  underline: (enabledMarks?: string[]) =>
    Boolean(enabledMarks && enabledMarks.includes('underline')),
  pre: (enabledMarks?: string[]) => Boolean(enabledMarks && enabledMarks.includes('code')),
}

type Params = Required<Pick<BlockSanityFieldSchema, 'styles' | 'marks' | 'lists'>> & {
  canUseBreaks?: boolean
  canUseHyperLinks?: boolean
  canUseAssetLinks?: boolean
  canUseEntryLinks?: boolean
  canEmbedAssets?: boolean
  canEmbedEntries?: boolean
  canEmbedEntriesInline?: boolean
  supportedEmbeddedInlineTypes?: LinkedType[]
  supportedEmbeddedBlockTypes?: LinkedType[]
}

export function extractContentfulRichTextFieldParameters(
  field: ContentFields,
  data: ContentfulExport,
): Params {
  const availableTypeIds = new Set((data.contentTypes ?? []).map((type) => type.sys.id))
  const enabledNodeTypesValidation = field.validations?.find((validation) =>
    Boolean(validation.enabledNodeTypes),
  )
  const enabledMarksValidation = field.validations?.find((validation) =>
    Boolean(validation.enabledMarks),
  )
  const nodesValidation = field.validations?.find((validation) => Boolean(validation.nodes))

  const canUseHyperLinks = enabledNodeTypesValidation?.enabledNodeTypes?.includes('hyperlink')
  const canUseAssetLinks = enabledNodeTypesValidation?.enabledNodeTypes?.includes('asset-hyperlink')
  const canUseEntryLinks = enabledNodeTypesValidation?.enabledNodeTypes?.includes('entry-hyperlink')
  const canEmbedAssets =
    enabledNodeTypesValidation?.enabledNodeTypes?.includes('embedded-asset-block')
  const canEmbedEntries =
    enabledNodeTypesValidation?.enabledNodeTypes?.includes('embedded-entry-block')
  const canEmbedEntriesInline =
    enabledNodeTypesValidation?.enabledNodeTypes?.includes('embedded-entry-inline')
  const canUseBreaks = enabledNodeTypesValidation?.enabledNodeTypes?.includes('hr')

  const supportedStyles = allStyles.filter((style) =>
    Boolean(isStyleSupportedFns[style.value]?.(enabledNodeTypesValidation?.enabledNodeTypes)),
  )

  const supportedLists = allLists.filter((list) =>
    Boolean(isListSupportedFns[list.value]?.(enabledNodeTypesValidation?.enabledNodeTypes)),
  )

  const supportedMarks = allDecoratorMarks.filter((mark) =>
    Boolean(isMarkSupportedFns[mark.value]?.(enabledMarksValidation?.enabledMarks)),
  )

  // @README limiting number of links is not supported
  const supportedEmbeddedInlineTypes = canEmbedEntriesInline
    ? nodesValidation?.nodes?.['embedded-entry-inline']?.reduce<LinkedType[]>(
        (acc, value) =>
          value.linkContentType
            ? [
                ...acc,
                ...value.linkContentType
                  .filter((type) => availableTypeIds.has(type))
                  .map((type) => ({type})),
              ]
            : acc,
        [],
      )
    : []

  const supportedEmbeddedBlockTypes = canEmbedEntries
    ? nodesValidation?.nodes?.['embedded-entry-block']?.reduce<LinkedType[]>(
        (acc, value) =>
          value.linkContentType
            ? [
                ...acc,
                ...value.linkContentType
                  .filter((type) => availableTypeIds.has(type))
                  .map((type) => ({type})),
              ]
            : acc,
        [],
      )
    : []

  const supportedEntryLinkTypes = canUseEntryLinks
    ? nodesValidation?.nodes?.['entry-hyperlink']?.reduce<LinkedType[]>(
        (acc, value) =>
          value.linkContentType
            ? [
                ...acc,
                ...value.linkContentType
                  .filter((type) => availableTypeIds.has(type))
                  .map((type) => ({type})),
              ]
            : acc,
        [],
      )
    : []

  return {
    canUseHyperLinks,
    canUseAssetLinks,
    canUseEntryLinks,
    canEmbedAssets,
    canEmbedEntries,
    canEmbedEntriesInline,
    canUseBreaks,
    supportedEmbeddedInlineTypes,
    supportedEmbeddedBlockTypes,
    styles: supportedStyles,
    lists: supportedLists,
    marks: {
      decorators: supportedMarks,
      annotations: compact([
        canUseHyperLinks &&
          ({
            type: 'object',
            name: 'link',
            title: 'url',
            fields: [
              {
                type: 'string',
                name: 'href',
                title: 'URL',
                validation: [{flag: 'presence', constraint: 'required'}],
              },
              {
                type: 'string',
                name: 'target',
                title: 'Target',
                options: {
                  list: [
                    {value: '_blank', title: 'Blank'},
                    {value: '_parent', title: 'Parent'},
                  ],
                },
              },
            ],
          } as ObjectSanityFieldSchema),
        ...(canUseEntryLinks && supportedEntryLinkTypes
          ? supportedEntryLinkTypes.map((linkType) => ({
              type: 'reference',
              to: [{type: linkType.type}],
            }))
          : []),
        ...(canUseAssetLinks ? [{type: 'image'}, {type: 'file'}] : []),
      ]),
    },
  }
}
