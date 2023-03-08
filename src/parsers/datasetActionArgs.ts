import isRelativePath from '@stdlib/assert-is-relative-path'
import isValidFilename from 'valid-filename'
import {z} from 'zod'

export const datasetActionArgs = z.object({
  exportDir: z.string().refine(isRelativePath),
  exportFile: z.string().refine(isValidFilename),
  datasetFile: z.string().endsWith('.ndjson').refine(isValidFilename),
  intl: z.enum(['single', 'multiple']).default('single'),
  weakRefs: z.boolean(),
  keepMarkdown: z.boolean(),
  intlIdStructure: z.enum(['subpath', 'delimiter']).default('delimiter'),
  locale: z.string().optional(),
})
export type DatasetActionArgs = z.infer<typeof datasetActionArgs>
