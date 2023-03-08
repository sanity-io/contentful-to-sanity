import isAbsolutePath from '@stdlib/assert-is-absolute-path'
import contentfulExport from 'contentful-export'
import {mkdirp} from 'mkdirp'
import invariant from 'tiny-invariant'

import type {ExportActionArgs} from '../parsers/exportActionArgs'
import {absolutify} from '../utils/absolutify'

export async function exportAction({
  exportDir: _exportDir,
  spaceId,
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

  await contentfulExport({
    spaceId,
    managementToken,
    environmentId,
    skipContentModel: false,
    skipEditorInterfaces: false,
    // If saveFile is false, then we're not exporting data, we're exporting what we need to generate a schema
    skipWebhooks: true,
    skipRoles: true,
    downloadAssets: false,
    maxAllowedLimit: 50,
    contentFile: exportFile,
    // errorLogFile: `${exportFile}.error.log`,
    // Options related to exports to the filesystem, not relevant if used in a Remix loader and a pass-through export just
    // to preview the schema
    // saveFile: false,
    // skipConntent: true,
    exportDir,
    skipContent: false,
    saveFile,
  })
}
