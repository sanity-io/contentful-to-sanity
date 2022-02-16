export class SanityProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`Sanity project with ID ${id} not found`)
  }
}
