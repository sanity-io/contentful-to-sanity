import {absolutify, isDirEmpty, promptSingleInput} from '@/utils'
import path from 'path'
import {OutputDirectoryNotEmptyError} from '@/helpers/errors'
import {pathIsEmpty, requiredString} from '../validators'

type FlagOptions = {
  required?: boolean
  checkEmpty?: boolean
}

type WithOutputFlag = {
  output?: string
}

export async function parseOutputFlag<V extends WithOutputFlag>(
  flags: V,
  options: FlagOptions & {required: true},
): Promise<string>
export async function parseOutputFlag<V extends WithOutputFlag>(
  flags: V,
  options: FlagOptions & {required?: false},
): Promise<string | undefined>
export async function parseOutputFlag<V extends WithOutputFlag>(
  flags: V,
  options: FlagOptions = {},
): Promise<string | undefined> {
  let output = flags.output
  const shouldCheckEmpty = options.checkEmpty === true

  const cwdIsEmpty = await isDirEmpty(process.cwd())
  if (!output && cwdIsEmpty && shouldCheckEmpty) {
    output = process.cwd()
  }

  if (!output && options.required) {
    output = await promptSingleInput({
      message: 'Content studio output path:',
      default: path.join(process.cwd()),
      filter: absolutify,
      validate: async (value) =>
        (await requiredString(value)) && (shouldCheckEmpty ? pathIsEmpty(value) : true),
    })
  }

  if (output) {
    output = absolutify(output)
    if (shouldCheckEmpty && !(await isDirEmpty(output))) {
      throw new OutputDirectoryNotEmptyError()
    }
  }

  return output
}
