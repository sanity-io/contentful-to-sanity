// import type runContentfulExport from 'contentful-export'

// export type InferredContentfulExport = Awaited<ReturnType<typeof runContentfulExport>>
export interface ContentfulExport {
  contentTypes?: import('contentful-management').ContentTypeProps[]
  tags?: import('contentful-management').TagProps[]
  editorInterfaces?: import('contentful-management').EditorInterfaceProps[]
  locales?: import('contentful-management').LocaleProps[]
  webhooks?: import('contentful-management').WebhookProps[]
  roles?: import('contentful-management').RoleProps[]
  entries?: import('contentful-management').EntryProps<Record<string, Record<string, unknown>>>[]
  assets?: import('contentful-management').AssetProps[]
}
