export class ContentfulParamsMissingError extends Error {
  constructor(params: string[]) {
    super(`Missing contentful parameters: ${params.join(', ')}`)
  }
}
