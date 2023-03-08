import type {BatchActionArgs} from '../parsers/batchActionArgs'
import {datasetAction} from './datasetAction'
import {exportAction} from './exportAction'
import {schemaAction} from './schemaAction'

export async function batchAction({
  datasetFile,
  environmentId,
  exportDir,
  exportFile,
  intl,
  intlIdStructure,
  keepMarkdown,
  locale,
  managementToken,
  saveFile,
  schemaFile,
  spaceId,
  weakRefs,
}: BatchActionArgs) {
  await exportAction({
    environmentId,
    exportDir,
    exportFile,
    managementToken,
    saveFile,
    spaceId,
  })

  await Promise.allSettled([
    schemaAction({
      exportDir,
      exportFile,
      intl,
      keepMarkdown,
      schemaFile,
    }),
    datasetAction({
      datasetFile,
      exportDir,
      exportFile,
      intl,
      intlIdStructure,
      keepMarkdown,
      locale,
      weakRefs,
    }),
  ])
}
