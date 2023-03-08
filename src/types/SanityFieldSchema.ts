import type {SanityDocument} from '@sanity/client'
import type {Block, CurrentUser, File, Image, Reference, Rule, RuleSpec, Slug} from '@sanity/types'
import {ReactNode} from 'react'

type CallbackParam<V = any, P = any> = {
  value?: V
  parent?: P
  document: SanityDocument
  currentUser: CurrentUser
}

export type LinkedType = Omit<AnySanityFieldSchema, 'name'>

export type BaseSanityFieldSchema<T extends string, V = any, O = any, E = unknown> = {
  type: T
  name: string
  title?: string
  hidden?: boolean | ((param: CallbackParam) => boolean)
  readOnly?: boolean | ((param: CallbackParam) => boolean)
  description?: string
  initialValue?: Record<string, V> // this is a per-locale object which is not supported but will be replaced in the stringification process
  options?: O
  validation?: ((rule: Rule) => Rule) | RuleSpec[] // rule-spec array is not actually supported but will be replaced in the stringification process
} & E

export type ArraySanityFieldSchema = BaseSanityFieldSchema<
  'array',
  any[],
  {
    sortable?: boolean
    layout?: 'tag' | 'grid'
    list?: {value: string; title: string}[]
    editModal?: 'dialog' | 'fullscreen' | 'popover'
  },
  {
    of: LinkedType[]
  }
>

export type BlockSanityFieldSchema = BaseSanityFieldSchema<
  'block',
  Block,
  {
    spellCheck?: boolean
  },
  {
    styles?: {title: string; value: string}[]
    lists?: {title: string; value: string}[]
    marks?: {
      decorators?: {title: string; value: string}[]
      annotations?: LinkedType[]
    }
    of?: LinkedType[]
  }
>

export type DateSanityFieldSchema = BaseSanityFieldSchema<
  'date',
  string,
  {
    dateFormat?: string
  }
>

export type DatetimeSanityFieldSchema = BaseSanityFieldSchema<
  'datetime',
  string,
  {
    dateFormat?: string
    timeFormat?: string
    timeStep?: number
  }
>

export type FileSanityFieldSchema = BaseSanityFieldSchema<
  'file',
  File,
  {
    storeOriginalFilename?: boolean
    accept?: string
    sources?: any[] // @TODO Image source type?
  },
  {
    fields?: LinkedType[]
  }
>

export type GeopointSanityFieldSchema = BaseSanityFieldSchema<'geopoint', string>

export type ImageSanityFieldSchema = BaseSanityFieldSchema<
  'image',
  Image,
  {
    metadata?: ('exif' | 'location' | 'lqip' | 'blurhash' | 'palette')[]
    hotspot?: boolean
    storeOriginalFilename?: boolean
    accept?: string
    sources?: any[] // @TODO Image source type?
  },
  {
    fields?: LinkedType[]
  }
>

export type NumberSanityFieldSchema = BaseSanityFieldSchema<
  'number',
  number,
  {
    list?: number[] | {title: string; value: number}[]
    layout?: 'radio' | 'dropdown'
    direction?: 'horizontal' | 'vertical'
  }
>

// @TODO incomplete as unnecessary for contentful since inline objects don't exist
export type ObjectSanityFieldSchema = BaseSanityFieldSchema<
  'object',
  any,
  {},
  {
    fields?: AnySanityFieldSchema[] // @TODO
    inputComponent?: ReactNode
  }
>

export type ReferenceSanityFieldSchema = BaseSanityFieldSchema<
  'reference',
  Reference,
  {
    disableNew?: boolean
    filter?:
      | string
      | ((params: CallbackParam) => {
          filter: string
          filterParams?: any
        })
    filterParams?: any
  },
  {
    to?: LinkedType[]
    weak?: boolean
  }
>

export type SlugSanityFieldSchema = BaseSanityFieldSchema<
  'slug',
  Slug,
  {
    source?: string
    maxLength?: number
    slugify?: (value: any) => string
    isUnique?: (slug: Slug) => boolean | Promise<boolean>
  }
>

export type StringSanityFieldSchema = BaseSanityFieldSchema<
  'string',
  string,
  {
    list?: string[] | {title: string; value: string}[]
    layout?: 'radio' | 'dropdown'
    direction?: 'horizontal' | 'vertical'
  }
>

export type TextSanityFieldSchema = BaseSanityFieldSchema<
  'text',
  string,
  {},
  {
    rows?: number
  }
>

export type UrlSanityFieldSchema = BaseSanityFieldSchema<'url', string>

export type BooleanSanityFieldSchema = BaseSanityFieldSchema<
  'boolean',
  boolean,
  {
    layout?: 'switch' | 'checkbox'
  }
>

export type AnySpecificSanityFieldSchema =
  | ArraySanityFieldSchema
  | BlockSanityFieldSchema
  | DateSanityFieldSchema
  | DatetimeSanityFieldSchema
  | FileSanityFieldSchema
  | GeopointSanityFieldSchema
  | ImageSanityFieldSchema
  | NumberSanityFieldSchema
  | ObjectSanityFieldSchema
  | ReferenceSanityFieldSchema
  | SlugSanityFieldSchema
  | StringSanityFieldSchema
  | TextSanityFieldSchema
  | UrlSanityFieldSchema
  | BooleanSanityFieldSchema

export type AnySanityFieldSchema = AnySpecificSanityFieldSchema | BaseSanityFieldSchema<string>
