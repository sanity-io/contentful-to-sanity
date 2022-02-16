declare module 'contentful-export' {
  export type ExportOptions = {
    spaceId: string
    managementToken: string
    environmentId?: string
    deliveryToken?: string
    exportDir?: string
    saveFile?: boolean
    contentFile?: string
    includeDrafts?: boolean
    includeArchived?: boolean
    skipContentModel?: boolean
    skipEditorInterfaces?: boolean
    skipContent?: boolean
    skipRoles?: boolean
    skipWebhooks?: boolean
    contentOnly?: boolean
    queryEntries?: string[]
    queryAssets?: string[]
    downloadAssets?: boolean
    host?: string
    proxy?: string
    rawProxy?: boolean
    maxAllowedLimit?: number
    limit?: number
    headers?: Record<string, unknown>
    errorLogFile?: string
    useVerboseRenderer?: boolean
  }

  export type ContentfulExport = {
    contentTypes?: import('contentful-management').ContentTypeProps[]
    tags?: import('contentful-management').TagProps[]
    editorInterfaces?: import('contentful-management').EditorInterfaceProps[]
    locales?: import('contentful-management').LocaleProps[]
    webhooks?: import('contentful-management').WebhookProps[]
    roles?: import('contentful-management').RoleProps[]
    entries?: import('contentful-management').EntryProps<
      Record<string, Record<string, any>>
    >[]
    assets?: import('contentful-management').AssetProps[]
  }

  const fn: (options: ExportOptions) => Promise<ContentfulExport>
  export default fn
}
