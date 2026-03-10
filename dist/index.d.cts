import {AssetProps} from 'contentful-management'
import {ContentTypeProps} from 'contentful-management'
import {EditorInterfaceProps} from 'contentful-management'
import {EntryProps} from 'contentful-management'
import {LocaleProps} from 'contentful-management'
import {RoleProps} from 'contentful-management'
import {TagProps} from 'contentful-management'
import type {ValidationError} from 'zod-validation-error'
import {WebhookProps} from 'contentful-management'
import {z} from 'zod'

export declare function batchAction({
  datasetFile,
  environmentId,
  exportDir,
  exportFile,
  intl,
  intlIdStructure,
  keepMarkdown,
  optimizeSvgs,
  convertImages,
  locale,
  managementToken,
  accessToken,
  saveFile,
  schemaFile,
  spaceId,
  weakRefs,
}: BatchActionArgs): Promise<void>

export declare type BatchActionArgs = z.infer<typeof batchActionArgs>

export declare const batchActionArgs: z.ZodObject<
  {
    spaceId: z.ZodString
    managementToken: z.ZodString
    accessToken: z.ZodString
    environmentId: z.ZodString
    saveFile: z.ZodBoolean
    schemaFile: z.ZodEffects<z.ZodString, string, string>
    exportDir: z.ZodEffects<z.ZodString, string, string>
    exportFile: z.ZodEffects<z.ZodString, string, string>
    datasetFile: z.ZodEffects<z.ZodString, string, string>
    intl: z.ZodDefault<z.ZodEnum<['single', 'multiple']>>
    weakRefs: z.ZodBoolean
    keepMarkdown: z.ZodBoolean
    optimizeSvgs: z.ZodBoolean
    convertImages: z.ZodBoolean
    intlIdStructure: z.ZodDefault<z.ZodEnum<['subpath', 'delimiter']>>
    locale: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    exportDir: string
    exportFile: string
    datasetFile: string
    intl: 'single' | 'multiple'
    weakRefs: boolean
    keepMarkdown: boolean
    optimizeSvgs: boolean
    convertImages: boolean
    intlIdStructure: 'subpath' | 'delimiter'
    spaceId: string
    managementToken: string
    accessToken: string
    environmentId: string
    saveFile: boolean
    schemaFile: string
    locale?: string | undefined
  },
  {
    exportDir: string
    exportFile: string
    datasetFile: string
    weakRefs: boolean
    keepMarkdown: boolean
    optimizeSvgs: boolean
    convertImages: boolean
    spaceId: string
    managementToken: string
    accessToken: string
    environmentId: string
    saveFile: boolean
    schemaFile: string
    intl?: 'single' | 'multiple' | undefined
    intlIdStructure?: 'subpath' | 'delimiter' | undefined
    locale?: string | undefined
  }
>

export declare interface ContentfulExport {
  contentTypes?: ContentTypeProps[]
  tags?: TagProps[]
  editorInterfaces?: EditorInterfaceProps[]
  locales?: LocaleProps[]
  webhooks?: WebhookProps[]
  roles?: RoleProps[]
  entries?: EntryProps<Record<string, Record<string, unknown>>>[]
  assets?: AssetProps[]
}

export declare function contentfulToDataset(
  exports: {
    drafts: ContentfulExport
    published?: ContentfulExport
  },
  opts: {
    intlMode: 'single' | 'multiple'
    weakRefs: boolean
    intlIdStructure: 'subpath' | 'delimiter'
    keepMarkdown: boolean
    locale: string | undefined
  },
): Promise<string>

export declare function contentfulToStudioSchema(
  data: ContentfulExport,
  opts: {
    typescript: boolean
    intlMode: 'single' | 'multiple'
    keepMarkdown: boolean
    filepath: string
  },
): Promise<string>

export declare function datasetAction({
  exportDir: _exportDir,
  exportFile,
  intl: intlMode,
  datasetFile,
  weakRefs,
  keepMarkdown,
  optimizeSvgs,
  convertImages,
  intlIdStructure,
  locale,
}: DatasetActionArgs): Promise<void>

export declare type DatasetActionArgs = z.infer<typeof datasetActionArgs>

export declare const datasetActionArgs: z.ZodObject<
  {
    exportDir: z.ZodEffects<z.ZodString, string, string>
    exportFile: z.ZodEffects<z.ZodString, string, string>
    datasetFile: z.ZodEffects<z.ZodString, string, string>
    intl: z.ZodDefault<z.ZodEnum<['single', 'multiple']>>
    weakRefs: z.ZodBoolean
    keepMarkdown: z.ZodBoolean
    optimizeSvgs: z.ZodBoolean
    convertImages: z.ZodBoolean
    intlIdStructure: z.ZodDefault<z.ZodEnum<['subpath', 'delimiter']>>
    locale: z.ZodOptional<z.ZodString>
  },
  'strip',
  z.ZodTypeAny,
  {
    exportDir: string
    exportFile: string
    datasetFile: string
    intl: 'single' | 'multiple'
    weakRefs: boolean
    keepMarkdown: boolean
    optimizeSvgs: boolean
    convertImages: boolean
    intlIdStructure: 'subpath' | 'delimiter'
    locale?: string | undefined
  },
  {
    exportDir: string
    exportFile: string
    datasetFile: string
    weakRefs: boolean
    keepMarkdown: boolean
    optimizeSvgs: boolean
    convertImages: boolean
    intl?: 'single' | 'multiple' | undefined
    intlIdStructure?: 'subpath' | 'delimiter' | undefined
    locale?: string | undefined
  }
>

export declare function exportAction({
  exportDir: _exportDir,
  spaceId,
  accessToken,
  managementToken,
  environmentId,
  saveFile,
  exportFile,
}: ExportActionArgs): Promise<void>

export declare type ExportActionArgs = z.infer<typeof exportActionArgs>

export declare const exportActionArgs: z.ZodObject<
  {
    exportDir: z.ZodEffects<z.ZodString, string, string>
    spaceId: z.ZodString
    managementToken: z.ZodString
    accessToken: z.ZodString
    environmentId: z.ZodString
    saveFile: z.ZodBoolean
    exportFile: z.ZodEffects<z.ZodString, string, string>
  },
  'strip',
  z.ZodTypeAny,
  {
    exportDir: string
    exportFile: string
    spaceId: string
    managementToken: string
    accessToken: string
    environmentId: string
    saveFile: boolean
  },
  {
    exportDir: string
    exportFile: string
    spaceId: string
    managementToken: string
    accessToken: string
    environmentId: string
    saveFile: boolean
  }
>

export declare function formatError(err: unknown): Error | ValidationError

export declare function schemaAction({
  exportDir: _exportDir,
  schemaFile,
  exportFile,
  intl: intlMode,
  keepMarkdown,
}: SchemaActionArgs): Promise<void>

export declare type SchemaActionArgs = z.infer<typeof schemaActionArgs>

export declare const schemaActionArgs: z.ZodObject<
  {
    exportDir: z.ZodEffects<z.ZodString, string, string>
    exportFile: z.ZodEffects<z.ZodString, string, string>
    schemaFile: z.ZodEffects<z.ZodString, string, string>
    intl: z.ZodDefault<z.ZodEnum<['single', 'multiple']>>
    keepMarkdown: z.ZodBoolean
  },
  'strip',
  z.ZodTypeAny,
  {
    exportDir: string
    exportFile: string
    intl: 'single' | 'multiple'
    keepMarkdown: boolean
    schemaFile: string
  },
  {
    exportDir: string
    exportFile: string
    keepMarkdown: boolean
    schemaFile: string
    intl?: 'single' | 'multiple' | undefined
  }
>

export {}
