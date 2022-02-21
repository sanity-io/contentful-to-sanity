import Configstore from 'configstore'
import {spawnSync} from 'child_process'
import {SanityNotAuthenticatedError} from '@/helpers/errors'

type FlagOptions = {
  required?: boolean
}

type WithSanityTokenFlag = {
  'sanity-token'?: string
}

export const SanityConfigStore = new Configstore('sanity', {}, {
  globalConfigPath: true,
})

export async function parseSanityTokenFlag<V extends WithSanityTokenFlag>(
  flags: V,
  options: FlagOptions & { required: true }
): Promise<string>;
export async function parseSanityTokenFlag<V extends WithSanityTokenFlag>(
  flags: V,
  options: FlagOptions & { required?: false }
): Promise<string | undefined>;
export async function parseSanityTokenFlag<V extends WithSanityTokenFlag>(
  flags: V,
  options: FlagOptions = {},
): Promise<string | undefined> {
  const hasSanity = !spawnSync('sanity', ['help']).error
  const sanityToken: string | undefined =
    flags['sanity-token'] ||
    SanityConfigStore.get('authToken') ||
    process.env.SANITY_IMPORT_TOKEN

  if (options.required) {
    if (!sanityToken && hasSanity) {
      console.log(
        'Hi! It seems you are not logged in to Sanity locally, please run:',
      )
      console.log('sanity login')
      throw new SanityNotAuthenticatedError()
    }

    if (!sanityToken) {
      console.log("Hi! Can't seem to find any Sanity credentials locally.")
      console.log("Let's start by logging in or creating an account.")
      console.log('First, you will need to install the Sanity CLI tool:')
      console.log('  npm install -g @sanity/cli')
      console.log('Then, log in or create an account:')
      console.log('  sanity login')
      console.log('')
      console.log('Then run me again!')
      throw new SanityNotAuthenticatedError()
    }
  }

  return sanityToken
}

