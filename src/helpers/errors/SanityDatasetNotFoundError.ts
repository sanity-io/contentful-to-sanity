export class SanityDatasetNotFoundError extends Error {
  constructor(name: string) {
    super(`Sanity dataset with name ${name} not found`)
  }
}
