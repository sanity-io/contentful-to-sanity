import 'contentful-management'

declare module 'contentful-management' {
  type ContentfulFieldValidation = import('contentful').FieldValidation
  interface ContentTypeFieldValidation extends ContentfulFieldValidation {
  }
}
