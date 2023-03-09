import {z} from 'zod'

export async function slugString(value: any): Promise<string | boolean> {
  const result = await z
    .string()
    .nonempty()
    .regex(/^[\w-]{1,128}$/, {
      message: 'Invalid input',
    })
    .safeParseAsync(value)
  if (!result.success) return result.error.flatten().formErrors.join(', ')
  return true
}
