export class SanityNotAuthenticatedError extends Error {
  constructor() {
    super('Not authenticatd with Sanity, please pass a token or login using the sanity CLI')
  }
}
