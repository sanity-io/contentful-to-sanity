import isRelativePath from '@stdlib/assert-is-relative-path'
import isValidFilename from 'valid-filename'
import {z} from 'zod'

export const exportActionArgs = z.object({
  exportDir: z.string().refine(isRelativePath),
  spaceId: z.string(),
  managementToken: z.string(),
  environmentId: z.string(),
  saveFile: z.boolean(),
  exportFile: z.string().endsWith('.json').refine(isValidFilename),
})
export type ExportActionArgs = z.infer<typeof exportActionArgs>
