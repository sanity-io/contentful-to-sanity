import {ContentfulExport} from 'contentful-export'
import {Control} from 'contentful-management'

export function findEditorControlForField(
  fieldId: string,
  contentTypeId: string,
  data: ContentfulExport,
): Control | null {
  const editor = data.editorInterfaces?.find((ed) => ed.sys.contentType.sys.id === contentTypeId)
  const control = editor?.controls?.find((ctrl) => ctrl.fieldId === fieldId)

  if (editor && control) {
    return control
  }

  return null
}
