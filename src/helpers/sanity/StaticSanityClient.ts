import type {ClientConfig} from '@sanity/client'

import {defaultSanityClient} from './defaultSanityClient'

export class StaticSanityClient {
  public static client = defaultSanityClient.clone()

  public static withConfig(config: Partial<ClientConfig>) {
    this.client = this.client.withConfig(config)
    return this.client
  }
}
