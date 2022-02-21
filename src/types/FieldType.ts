import type {Type} from '@sanity/portable-text-editor'

export type FieldType = Omit<Type, 'type'> & {
  type: string
}
