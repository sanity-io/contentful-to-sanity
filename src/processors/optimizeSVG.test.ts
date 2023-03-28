/* eslint-disable @typescript-eslint/no-empty-function */
import fs from 'node:fs'

import {tmpdir} from 'os'
import {describe, expect, test} from 'vitest'

import {optimizeSVG} from './optimizeSVG'

describe('optimizeSvgs', () => {
  test('finds, downloads, optimizes and replaces SVGs', async () => {
    const svgUrl = 'https://dev.w3.org/SVG/tools/svgweb/samples/svg-files/git.svg'
    const testData = `{"_id":"1","_type":"article","image":{"_type":"image","_sanityAsset":"image@${svgUrl}"}}`
    const res = await optimizeSVG(testData, tmpdir())

    expect(res).toBe(
      `{"_id":"1","_type":"article","image":{"_type":"image","_sanityAsset":"image@file://${tmpdir}/assets/git.svg"}}`,
    )
    expect(fs.existsSync(`${tmpdir()}/assets/git.svg`)).toBe(true)
  })
})
