import isRelativePath from '@stdlib/assert-is-relative-path'
import isValidFilename from 'valid-filename'
import {z} from 'zod'

export const schemaActionArgs = z.object({
  exportDir: z.string().refine(isRelativePath),
  exportFile: z.string().endsWith('.json').refine(isValidFilename),
  //schemaFile: z.string().endsWith('.js').refine(isValidFilename),
  schemaFile: z.string().refine(isValidFilename),
  intl: z.enum(['single', 'multiple']).default('single'),
  keepMarkdown: z.boolean(),
})
export type SchemaActionArgs = z.infer<typeof schemaActionArgs>
