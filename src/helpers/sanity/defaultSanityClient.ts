import {createClient} from '@sanity/client'

export const defaultSanityClient = createClient({
  apiVersion: '2022-02-07',
  useProjectHostname: false,
  dataset: 'dummy',
  useCdn: false,
})
