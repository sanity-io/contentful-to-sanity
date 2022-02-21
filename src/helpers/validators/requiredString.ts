import {z} from 'zod'

export async function requiredString(value: any): Promise<string | boolean> {
  const result = await z.string().nonempty().safeParseAsync(value)
  if (!result.success) return result.error.flatten().formErrors.join(', ')
  return true
}
