import {FieldType} from './FieldType'

export type SanityObjectSchema = {
  type: 'object'
  name: string
  fields: FieldType[]
  title?: string
  description?: string
}
