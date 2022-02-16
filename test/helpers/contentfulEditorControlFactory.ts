import type {Control, DefinedParameters} from 'contentful-management'

export function contentfulEditorControlFactory(
  fieldId: string,
  widgetId = 'singleLine',
  widgetNamespace = 'builtin',
  settings: DefinedParameters = {},
): Control {
  return {
    fieldId,
    widgetId,
    widgetNamespace,
    settings,
  }
}
