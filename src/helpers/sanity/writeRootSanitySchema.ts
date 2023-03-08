import Case from 'case'
import fs from 'fs-extra'
import path from 'path'

import {SanityDocumentSchema, SanityObjectSchema} from '../../types'

export async function writeRootSanitySchema(
  schemas: (SanityDocumentSchema | SanityObjectSchema)[],
  dir?: string,
): Promise<void> {
  const schemasDir = path.join(dir ?? process.cwd(), 'schemas')
  await fs.ensureDir(schemasDir)

  const importStatements = schemas
    .map((schema) => {
      return `import {${Case.camel(schema.name)}Type} from './${
        schema.type === 'document' ? 'documents' : 'objects'
      }/${schema.name}.js'`
    })
    .join('\n')
  const typesConcatList = schemas.map((schema) => `  ${Case.camel(schema.name)}Type,`).join('\n')

  await fs.writeFile(
    path.join(schemasDir, 'schema.js'),
    `
${importStatements}

export const schemas = [
${typesConcatList}
]
`,
  )
}
