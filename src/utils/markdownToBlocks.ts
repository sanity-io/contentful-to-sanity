import {htmlToBlocks} from '@sanity/block-tools'
import {Schema} from '@sanity/schema'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import {Block} from '@sanity/types'
import {JSDOM} from 'jsdom'
import md from 'markdown-it'

import {
  arrayFieldSchemaFactory,
  blockFieldSchemaFactory,
  imageFieldSchemaFactory,
} from '../helpers/sanity/fieldSchemaFactories'

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

export function markdownToBlocks(input: string) {
  const html = md({html: true}).render(input)
  const blocks = htmlToBlocks(html, blockContentType, {
    parseHtml: (parsedHtml) => new JSDOM(parsedHtml).window.document,
    rules: [
      {
        deserialize(el, next, block) {
          if (isElement(el) && el.tagName === 'P' && el.childNodes.length === 1) {
            const firstChildNode = el.childNodes[0] as HTMLElement
            if (firstChildNode.tagName === 'IMG') {
              const src = firstChildNode.getAttribute('src') ?? ''
              return block({
                _type: 'image',
                _sanityAsset: `image@${src.replace(/^\/\//, 'https://')}`,
              })
            }
          }

          return undefined
        },
      },
    ],
  })
  return blocks as Block[]
}

function isElement(node: Node): node is Element {
  return node.nodeType === 1
}
