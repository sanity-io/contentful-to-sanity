import {z} from 'zod'
import type {ValidationError} from 'zod-validation-error'
import {fromZodError, isValidationErrorLike} from 'zod-validation-error'

export function formatError(err: unknown): Error | ValidationError {
  if (isValidationErrorLike(err)) {
    return err
  }

  if (err instanceof z.ZodError) {
    return fromZodError(err)
  }

  if (err instanceof Error) {
    return err
  }

  return new Error('Unknown error', {cause: err})
}
