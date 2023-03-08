import set from 'just-safe-set'
import get from 'just-safe-get'
import omit from 'just-omit'
import {
  AnySanityFieldSchema,
  ArraySanityFieldSchema,
  BlockSanityFieldSchema,
  BooleanSanityFieldSchema,
  DateSanityFieldSchema,
  DatetimeSanityFieldSchema,
  FileSanityFieldSchema,
  GeopointSanityFieldSchema,
  ImageSanityFieldSchema,
  NumberSanityFieldSchema,
  ReferenceSanityFieldSchema,
  SlugSanityFieldSchema,
  StringSanityFieldSchema,
  TextSanityFieldSchema,
  UrlSanityFieldSchema,
} from '@/types'

type FactoryObject<Schema extends AnySanityFieldSchema> = Required<{
  [K in keyof Schema]: (value: Schema[K]) => FactoryObject<Schema>
}> & {
  build: <T extends string = never>(omit?: T[]) => Omit<Schema, T>
  anonymous: () => Omit<Schema, 'name'>
}

const createFactoryProxy = <Schema extends AnySanityFieldSchema>(initialSchema: Schema) => {
  let clonedSchema = {...initialSchema}
  const buildFn = (keys?: (keyof Schema)[]) => {
    const emptyKeysToOmit = Object.keys(clonedSchema).filter((key) => {
      const value = get(clonedSchema, key)
      return (
        typeof value === 'undefined' ||
        value === null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0)
      )
    }) as (keyof Schema)[]
    return omit(clonedSchema, [...(keys ?? []), ...emptyKeysToOmit])
  }

  const proxy = new Proxy<FactoryObject<Schema>>({} as FactoryObject<Schema>, {
    get(target, prop) {
      if (prop !== 'build' && prop !== 'anonymous' && typeof prop === 'string') {
        return (value: any): FactoryObject<Schema> => {
          if (typeof value === 'undefined') {
            clonedSchema = omit(clonedSchema, [prop as keyof Schema]) as typeof clonedSchema
          } else {
            if (typeof value === 'object') {
              for (const key in value) {
                if (typeof value[key] === 'undefined') {
                  delete value[key]
                }
              }
            }

            set(clonedSchema, prop, value)
          }

          return proxy
        }
      }

      if (prop === 'build') {
        return buildFn
      }

      if (prop === 'anonymous') {
        return () => buildFn(['name'])
      }
    },
  })
  return proxy
}

export const numberFieldSchemaFactory = (name: string) =>
  createFactoryProxy<NumberSanityFieldSchema>({
    name,
    type: 'number',
  })

export const stringFieldSchemaFactory = (name: string) =>
  createFactoryProxy<StringSanityFieldSchema>({
    name,
    type: 'string',
  })

export const textFieldSchemaFactory = (name: string) =>
  createFactoryProxy<TextSanityFieldSchema>({
    name,
    type: 'text',
  })

export const urlFieldSchemaFactory = (name: string) =>
  createFactoryProxy<UrlSanityFieldSchema>({
    name,
    type: 'url',
  })

export const slugFieldSchemaFactory = (name: string) =>
  createFactoryProxy<SlugSanityFieldSchema>({
    name,
    type: 'slug',
  })

export const geopointFieldSchemaFactory = (name: string) =>
  createFactoryProxy<GeopointSanityFieldSchema>({
    name,
    type: 'geopoint',
  })

export const booleanFieldSchemaFactory = (name: string) =>
  createFactoryProxy<BooleanSanityFieldSchema>({
    name,
    type: 'boolean',
  })

export const dateFieldSchemaFactory = (name: string) =>
  createFactoryProxy<DateSanityFieldSchema>({
    name,
    type: 'date',
  })

export const datetimeFieldSchemaFactory = (name: string) =>
  createFactoryProxy<DatetimeSanityFieldSchema>({
    name,
    type: 'datetime',
  })

export const blockFieldSchemaFactory = (name: string) =>
  createFactoryProxy<BlockSanityFieldSchema>({
    name,
    type: 'block',
  })

export const arrayFieldSchemaFactory = (name: string) =>
  createFactoryProxy<ArraySanityFieldSchema>({
    name,
    type: 'array',
    of: [],
  })

export const referenceFieldSchemaFactory = (name: string) =>
  createFactoryProxy<ReferenceSanityFieldSchema>({
    name,
    type: 'reference',
  })

export const imageFieldSchemaFactory = (name: string) =>
  createFactoryProxy<ImageSanityFieldSchema>({
    name,
    type: 'image',
  })

export const fileFieldSchemaFactory = (name: string) =>
  createFactoryProxy<FileSanityFieldSchema>({
    name,
    type: 'file',
  })
