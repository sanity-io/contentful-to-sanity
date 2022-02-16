export class ContentfulNoLocalesError extends Error {
  constructor() {
    super('No importable locales defined')
  }
}
