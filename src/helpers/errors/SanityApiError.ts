export class SanityApiError extends Error {
  constructor(message?: string) {
    super(`Failed to communicate with the Sanity API:\n${message}`)
  }
}
