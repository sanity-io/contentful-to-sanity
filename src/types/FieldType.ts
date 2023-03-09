import type {ObjectDefinition} from '@sanity/types'

export type FieldType = Omit<ObjectDefinition, 'type'> & {
  type: string
}
