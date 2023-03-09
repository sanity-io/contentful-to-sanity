import blockTools from '@sanity/block-tools'
import Schema from '@sanity/schema'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import {Block} from '@sanity/types'
import {
  arrayFieldSchemaFactory,
  blockFieldSchemaFactory,
  imageFieldSchemaFactory,
} from 'helpers/sanity/fieldSchemaFactories'
import {JSDOM} from 'jsdom'
import md from 'markdown-it'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'mock',
      type: 'object',
      fields: [
        arrayFieldSchemaFactory('body')
          .name('body')
          .of([blockFieldSchemaFactory('block').build(), imageFieldSchemaFactory('image').build()])
          .build(),
      ],
    },
  ],
})

const blockContentType = mockSchema
  .get('mock')
  .fields.find((field: any) => field.name === 'body').type

function extractImages(el: HTMLElement) {
  if (el.tagName === 'P' && el.childNodes.length === 1) {
    const firstChildNode = el.childNodes[0] as HTMLElement
    if (firstChildNode.tagName === 'IMG') {
      const src = firstChildNode.getAttribute('src') ?? ''

      return {
        _sanityAsset: `image@${src.replace(/^\/\//, 'https://')}`,
      }
    }
  }

  // Only convert block-level images, for now
  return undefined
}

export function markdownToBlocks(input: string) {
  const html = md({html: true}).render(input)
  const blocks = blockTools.htmlToBlocks(html, blockContentType, {
    parseHtml: (html: string) => new JSDOM(html).window.document,
    // @ts-expect-error
    rules: [{deserialize: extractImages}],
  })
  return blocks as Block[]
}
