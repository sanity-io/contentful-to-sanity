import {defaultSanityHttpClient} from './deafultSanityHttpClient'
import type {SanityClient} from '@sanity/client'

type SanityProject = ReturnType<SanityClient['projects']['getById']> extends Promise<infer V>
  ? V
  : never
type Options = {
  displayName: string
  sanityToken: string
}

export const createProject = async ({
  displayName,
  sanityToken,
}: Options): Promise<SanityProject> => {
  const {data} = await defaultSanityHttpClient.post<SanityProject>(
    '/projects',
    {
      displayName,
    },
    {
      headers: {
        Authorization: 'Bearer ' + sanityToken,
      },
    },
  )
  return data
}
