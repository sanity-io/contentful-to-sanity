import fs from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

import {contentfulAssetUrlToContentType} from '../utils/contentfulAssetUrlToContentType'
import {convertUnsupportedImages} from './convertUnsupportedImages'
const assets = [
  {
    fields: {
      title: {
        'en-US': 'Test image',
      },
      description: {
        'en-US': '',
      },
      file: {
        'en-US': {
          fileName: '4ccabf69d8160e7bee018fdf4d83bffe1d2ed7a1.avif',
          contentType: 'image/avif',
          url: 'https://cdn.sanity.io/files/kbrhtt13/v3/4ccabf69d8160e7bee018fdf4d83bffe1d2ed7a1.avif',
        },
      },
    },
  },
  {
    fields: {
      title: {
        'en-US': 'Test PNG image',
      },
      description: {
        'en-US': '',
      },
      file: {
        'en-US': {
          fileName: '08a6f897cc27fba22af0ef337cbb97604b46ae94-2836x1508.png',
          contentType: 'image/png',
          url: 'https://cdn.sanity.io/images/3do82whm/next/08a6f897cc27fba22af0ef337cbb97604b46ae94-2836x1508.png',
        },
      },
    },
  },
]

describe('convertUnsupportedImages', () => {
  test('should convert unsupported images', async () => {
    const avifFile = assets[0].fields.file['en-US'].url as string
    const pngFile = assets[1].fields.file['en-US'].url as string

    const testData = `{"_id":"1","_type":"article","image":{"_type":"image","_sanityAsset":"image@${avifFile}"}}
{"_id":"2","_type":"article","image":{"_type":"image","_sanityAsset":"image@${pngFile}"}}`

    const contentTypeLookup = (url: string) => contentfulAssetUrlToContentType(url, assets, 'en-US')
    const res = await convertUnsupportedImages(testData, tmpdir(), contentTypeLookup)

    const expectedFile = path.join(tmpdir(), 'assets', path.parse(avifFile).name + '.png')
    expect(res).toBe(
      `{"_id":"1","_type":"article","image":{"_type":"image","_sanityAsset":"image@file://${expectedFile}"}}
{"_id":"2","_type":"article","image":{"_type":"image","_sanityAsset":"image@${pngFile}"}}`,
    )
    expect(fs.existsSync(expectedFile)).toBe(true)
    const notExpectedFile = path.join(tmpdir(), 'assets', path.parse(pngFile).name + '.png')
    expect(fs.existsSync(notExpectedFile)).toBe(false)
  })
})
