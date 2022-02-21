import 'contentful'

declare module 'contentful' {
  interface Field {
    defaultValue?: Record<string, any>
  }

  interface FieldValidation {
    dateRange?: {
      min?: string
      max?: string
    }
    enabledMarks?: string[]
  }
}
