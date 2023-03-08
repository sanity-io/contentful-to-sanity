import {promptSingleInput} from '@/utils'

type FlagOptions = {
  required?: boolean
}

type WithTokenFlag = {
  'contentful-token'?: string
}

export async function parseManagementTokenFlag<V extends WithTokenFlag>(
  flags: V,
  options: FlagOptions & {required: true},
): Promise<string>
export async function parseManagementTokenFlag<V extends WithTokenFlag>(
  flags: V,
  options: FlagOptions & {required?: boolean},
): Promise<string | undefined>
export async function parseManagementTokenFlag<V extends WithTokenFlag>(
  flags: V,
  options: FlagOptions = {},
): Promise<string | undefined> {
  let token = flags['contentful-token']
  if (!token && options.required) {
    token = await promptSingleInput({
      message: 'Contentful management token:',
    })
  }

  return token
}
