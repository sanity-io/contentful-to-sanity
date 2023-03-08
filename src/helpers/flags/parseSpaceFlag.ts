import {promptSingleInput} from '@/utils'

type FlagOptions = {
  required?: boolean
}

type WithSpaceFlag = {
  space?: string
}

export async function parseSpaceFlag<V extends WithSpaceFlag>(
  flags: V,
  options: FlagOptions & {required: true},
): Promise<string>
export async function parseSpaceFlag<V extends WithSpaceFlag>(
  flags: V,
  options: FlagOptions & {required?: boolean},
): Promise<string | undefined>
export async function parseSpaceFlag<V extends WithSpaceFlag>(
  flags: V,
  options: FlagOptions = {},
): Promise<string | undefined> {
  let space = flags.space
  if (!space && options.required) {
    space = await promptSingleInput({
      message: 'Contentful Space ID:',
    })
  }

  return space
}
