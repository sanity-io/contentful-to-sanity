export class OutputDirectoryNotEmptyError extends Error {
  constructor() {
    super('Output directory is not empty')
  }
}
