export class ContentfulNoDefaultLocaleError extends Error {
  constructor() {
    super('No default locale found in Contentful export')
  }
}
