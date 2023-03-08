import {z} from 'zod'

import {isPathEmpty} from '../refinements'

export async function pathIsEmpty(value: any): Promise<string | boolean> {
  const result = await z
    .string()
    .nonempty()
    .refine(isPathEmpty, {
      message: 'Output path is not empty',
    })
    .safeParseAsync(value)
  if (!result.success) return result.error.flatten().formErrors.join(', ')
  return true
}
