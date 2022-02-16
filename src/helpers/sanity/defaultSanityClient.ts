import SanityClient from '@sanity/client'

export const defaultSanityClient = new SanityClient({
  apiVersion: '2022-02-07',
  useProjectHostname: false,
  dataset: 'dummy',
  useCdn: false,
})
