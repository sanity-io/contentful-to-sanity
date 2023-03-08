import md from 'markdown-it'
import Schema from '@sanity/schema'
import blockTools from '@sanity/block-tools'
import {JSDOM} from 'jsdom'
import {
  arrayFieldSchemaFactory,
  blockFieldSchemaFactory,
  imageFieldSchemaFactory,
} from '@/helpers/sanity/fieldSchemaFactories'
import {Block} from '@sanity/types'

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
}

export function markdownToBlocks(input: string) {
  const html = md({html: true}).render(input)
  const blocks = blockTools.htmlToBlocks(html, blockContentType, {
    parseHtml: (html: string) => new JSDOM(html).window.document,
    rules: [{deserialize: extractImages}],
  })
  return blocks as Block[]
}
