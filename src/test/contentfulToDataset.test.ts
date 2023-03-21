import {describe, expect, test} from 'vitest'

import {contentfulToDataset} from '../helpers/contentfulToDataset'
import {parse} from './helpers'

const smOptions = {
  intlMode: 'single',
  weakRefs: false,
  intlIdStructure: 'delimiter',
  keepMarkdown: false,
  locale: undefined,
} as const
const imOptions = {
  intlMode: 'multiple',
  weakRefs: false,
  intlIdStructure: 'delimiter',
  keepMarkdown: false,
  locale: undefined,
} as const
const wkOptions = {
  intlMode: 'single',
  weakRefs: true,
  intlIdStructure: 'delimiter',
  keepMarkdown: false,
  locale: undefined,
} as const
const pathOptions = {
  intlMode: 'single',
  weakRefs: false,
  intlIdStructure: 'subpath',
  keepMarkdown: false,
  locale: undefined,
} as const
const mdOptions = {
  intlMode: 'single',
  weakRefs: false,
  intlIdStructure: 'delimiter',
  keepMarkdown: true,
  locale: undefined,
} as const

describe('contentfulToDataset', () => {
  test('blog.json', async () => {
    const {default: data} = await import('./fixtures/blog.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })

  // https://github.com/contentful/11ty-contentful-starter/blob/1072040c909ea6d1ce558f2bd5d5c526a85318f7/import/export.json
  test('11ty.json', async () => {
    const {default: data} = await import('./fixtures/11ty.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/content-models/blob/fcac5d461c2c8cb95800eb745974aa0d282c3583/blog/contentful-export.json
  test('complex-blog.json', async () => {
    const {default: data} = await import('./fixtures/complex-blog.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/content-models/blob/fcac5d461c2c8cb95800eb745974aa0d282c3583/gallery/contentful-export.json
  test('gallery.json', async () => {
    const {default: data} = await import('./fixtures/gallery.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/content-models/blob/fcac5d461c2c8cb95800eb745974aa0d282c3583/product-catalogue/product-catalog.json
  test('product-catalogue.json', async () => {
    const {default: data} = await import('./fixtures/product-catalogue.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/content-models/blob/fcac5d461c2c8cb95800eb745974aa0d282c3583/the-example-app/contentful-export.json
  test('the-example-app.json', async () => {
    const {default: data} = await import('./fixtures/the-example-app.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/contentful-ls-cma-1/blob/761dda7a59e81102c4c7cb2c73e7a3d800ee8878/clover-export.json
  test('ls-cma-1.json', async () => {
    const {default: data} = await import('./fixtures/ls-cma-1.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/ls-categories/blob/49a5c36bb2ab844207d0b64584439debe3bac4fd/categories-demo-export.json
  test('categories-demo-export.json', async () => {
    const {default: data} = await import('./fixtures/categories-demo-export.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/ls-jumpstart-shop/blob/b5c4cbf2211dd9c1040ef80eb503d0898af4512e/space-export/space_old.json
  test('jumpstart-shop.json', async () => {
    const {default: data} = await import('./fixtures/jumpstart-shop.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/ls-workflows/blob/ef2654c7a4492517807d707a93a7b407652c5108/contentful-workflow-export.json
  test('workflow.json', async () => {
    const {default: data} = await import('./fixtures/workflow.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/react-starter/blob/2c40987790d22dcf9876d09cd621e82131371964/contentful/export.json
  test('react-starter.json', async () => {
    const {default: data} = await import('./fixtures/react-starter.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/starter-gatsby-blog/blob/4dc30e2621adbc10177d1ccbee518c6fcee70a60/contentful/export.json
  test('gatsby-blog.json', async () => {
    const {default: data} = await import('./fixtures/gatsby-blog.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/starter-hydrogen-store/blob/6bc733608fc1e8c961c0cca654eaf44636571cc5/contentful-export.json
  test('hydrogen-store.json', async () => {
    const {default: data} = await import('./fixtures/hydrogen-store.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/starter-javascript-cookbook/blob/8c3655b1b1d29458d5a84da31e39753ab6ee8233/contentful/export.json
  test('cookbook.json', async () => {
    const {default: data} = await import('./fixtures/cookbook.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/starter-remix-portfolio/blob/fce56f371bfce44ca69aeffa54428f6f9f589d98/remix.init/contentful/export.json
  test('remix.json', async () => {
    const {default: data} = await import('./fixtures/remix.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/starters/blob/867272460e3d1e20daf5d856fa7411d96978ff83/examples/gatsby-blog/contentful/export.json
  test('gatsby-blog2.json', async () => {
    const {default: data} = await import('./fixtures/gatsby-blog2.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/starters/blob/867272460e3d1e20daf5d856fa7411d96978ff83/examples/knowledge-base/contentful/export.json
  test('knowledge-base.json', async () => {
    const {default: data} = await import('./fixtures/knowledge-base.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/starters/blob/867272460e3d1e20daf5d856fa7411d96978ff83/examples/next.js-blog/contentful/export.json
  test('nextjs.json', async () => {
    const {default: data} = await import('./fixtures/nextjs.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
  // https://github.com/contentful/sveltekit-starter/blob/4dc8afe9701a36e455f5545914633648bf630372/contentful/export.json
  test('sveltekit.json', async () => {
    const {default: data} = await import('./fixtures/sveltekit.json')
    expect(
      (await contentfulToDataset(data as any, smOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, imOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, wkOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, pathOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
    expect(
      (await contentfulToDataset(data as any, mdOptions)).split('\n').map(parse),
    ).toMatchSnapshot()
  })
})
