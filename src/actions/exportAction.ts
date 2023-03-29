import isAbsolutePath from '@stdlib/assert-is-absolute-path'
import contentfulExport, {type Options as ContentfulExportOptions} from 'contentful-export'
import {mkdirp} from 'mkdirp'
import path from 'path'
import invariant from 'tiny-invariant'

import type {ExportActionArgs} from '../parsers/exportActionArgs'
import {absolutify} from '../utils/absolutify'

export async function exportAction({
  exportDir: _exportDir,
  spaceId,
  accessToken,
  managementToken,
  environmentId,
  saveFile,
  exportFile,
}: ExportActionArgs) {
  const exportDir = absolutify(_exportDir)
  invariant(isAbsolutePath(exportDir), 'exportDir must be an absolute path')
  // Contentful needs the directory to exist or it'll fail
  await mkdirp(exportDir)

  // eslint-disable-next-line no-warning-comments
  // @TODO use https://listr2.kilic.dev/ to add interactive prompts if spaceId or managementToken are missing

  const options: ContentfulExportOptions = {
    spaceId,
    managementToken,
    environmentId,
    skipContentModel: false,
    skipEditorInterfaces: false,
    includeDrafts: true,
    includeArchived: true,
    // If saveFile is false, then we're not exporting data, we're exporting what we need to generate a schema
    skipWebhooks: true,
    skipRoles: true,
    downloadAssets: false,
    maxAllowedLimit: 250,
    contentFile: exportFile,
    // errorLogFile: `${exportFile}.error.log`,
    // Options related to exports to the filesystem, not relevant if used in a Remix loader and a pass-through export just
    // to preview the schema
    // saveFile: false,
    // skipConntent: true,
    exportDir,
    skipContent: false,
    saveFile,
  }

  // Export the content model and editor interfaces, drafts. Published versions
  // will not be available in the export since if they are changed only the
  // current draft edits will be included.
  await contentfulExport(options)

  // We solve that by running an additional export of only published content
  // with a delivery token
  await contentfulExport({
    ...options,
    //skipContentModel: true,
    //skipEditorInterfaces: true,
    includeDrafts: false,
    includeArchived: false,
    deliveryToken: accessToken,
    contentFile: path.parse(exportFile).name + '.published.json',
  })
}
