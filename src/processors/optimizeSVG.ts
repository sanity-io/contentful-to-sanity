import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import {Readable} from 'node:stream'

import fetch from 'node-fetch'
import {optimize} from 'svgo'

export async function optimizeSVG(dataset: string, exportDir: string) {
  // eslint-disable-next-line no-console
  console.log('Optimizing SVGs')
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
      const regex = /image@(https?:\/\/[^\s"]+\.svg)/g
      let match
      let newLine = line
      while ((match = regex.exec(line)) !== null) {
        const svgUrl = match[1]
        const response = await fetch(svgUrl)
        if (response.status === 200) {
          const svgArrayBuffer = await response.arrayBuffer()
          const svgBuffer = Buffer.from(svgArrayBuffer)
          const svgFileName = svgUrl.substring(svgUrl.lastIndexOf('/') + 1)
          const svgFilePath = path.join(exportDir, 'assets', svgFileName)
          fs.writeFileSync(svgFilePath, svgBuffer)

          const svgFileContents = fs.readFileSync(svgFilePath, {
            encoding: 'utf8',
          })

          const {data: optimizedSVG} = await optimize(svgFileContents)
          fs.writeFileSync(svgFilePath, optimizedSVG)
          newLine = newLine.replace(svgUrl, `file://${svgFilePath}`)
        } else {
          // eslint-disable-next-line no-console
          console.error(`Error fetching ${svgUrl}`, response.status)
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
