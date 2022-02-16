import path from 'path'
import fs from 'fs-extra'
import Case from 'case'
import {SanityDocumentSchema, SanityObjectSchema} from '@/types'

export async function writeRootSanitySchema(
  schemas: (SanityDocumentSchema | SanityObjectSchema)[],
  dir?: string,
): Promise<void> {
  const schemasDir = path.join(dir ?? process.cwd(), 'schemas')
  await fs.ensureDir(schemasDir)

  const importStatements = schemas.map(schema => (
    `import ${Case.camel(schema.name)} from './${schema.name}.js'`
  )).join('\n')
  const typesConcatList = schemas.map(schema => (
    `    ${Case.camel(schema.name)},`
  )).join('\n')

  await fs.writeFile(
    path.join(schemasDir, 'schema.js'),
    `
import createSchema from 'part:@sanity/base/schema-creator'
import schemaTypes from 'all:part:@sanity/base/schema-type'
${importStatements}

export default createSchema({
  name: 'default',
  types: schemaTypes.concat([
${typesConcatList}
  ])
})`,
  )
}
