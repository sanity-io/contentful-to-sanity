import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import {Readable} from 'node:stream'

import fetch from 'node-fetch'
import sharp from 'sharp'

export async function convertUnsupportedImages(
  dataset: string,
  exportDir: string,
  contentTypeLookup: (url: string) => string | undefined,
) {
  // eslint-disable-next-line no-console
  console.log('Converting images')
  const stream = new Readable()
  stream.push(dataset)
  stream.push(null)

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  })
  // Create dir if it doesn't exist
  const assetsDir = path.join(exportDir, 'assets')
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir)
  }

  const out: string[] = []
  for await (const line of rl) {
    try {
      const regex = /image@(https?:\/\/[^\s"]+)/g
      let match
      let newLine = line.trim()
      while ((match = regex.exec(line)) !== null) {
        const url = match[1]
        const contentType = contentTypeLookup(url)
        if (contentType === 'image/avif') {
          const fileName = path.parse(url).name
          const filePath = path.join(exportDir, 'assets', `${fileName}.png`)
          await fetch(url)
            .then((res) => res.buffer())
            .then((buffer) => sharp(buffer).png().toFile(filePath))
            .then(() => (newLine = newLine.replace(url, `file://${filePath}`)))
            .catch((err) => {
              // eslint-disable-next-line no-console
              console.error(err)
            })
        }
      }
      out.push(newLine)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  return out.join('\n')
}
