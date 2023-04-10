import type {RuleSpec} from '@sanity/types'
import {ContentFields} from 'contentful-management'
import moment from 'moment'

export function extractValidationRulesFromContentfulField(
  field: ContentFields | Exclude<ContentFields['items'], undefined>,
  widgetId?: string,
): RuleSpec[] {
  const validations = field.validations ?? []
  const rules: RuleSpec[] = []

  if ('required' in field && field.required === true) {
    rules.push({flag: 'presence', constraint: 'required'})
  }

  if (field.type === 'Integer') {
    rules.push({flag: 'integer'})
  }

  for (const validation of validations) {
    if (validation.unique) {
      if (widgetId && widgetId !== 'slugEditor') {
        // eslint-disable-next-line no-console
        console.warn(
          "Unique validation only supported on slug fields by default. Consider adding custom validation for other unique fields or changing field to 'slug'",
        )
      }
    } else if (validation.regexp?.pattern) {
      rules.push({
        flag: 'regex',
        constraint: {
          invert: false,
          pattern: new RegExp(validation.regexp.pattern),
        },
      })
    } else if (validation.range) {
      if (validation.range?.min !== undefined) {
        rules.push({flag: 'min', constraint: validation.range.min})
      }
      if (validation.range?.max !== undefined) {
        rules.push({flag: 'max', constraint: validation.range.max})
      }
    } else if (validation.size?.min !== undefined) {
      rules.push({flag: 'min', constraint: validation.size.min})
    } else if (validation.size?.max !== undefined) {
      rules.push({flag: 'max', constraint: validation.size.max})
    } else if (validation.dateRange?.min !== undefined) {
      const min = moment(validation.dateRange.min)
      rules.push({
        flag: 'custom',
        constraint: (value) =>
          moment(value as string).isAfter(min)
            ? true
            : `Value should be no earlier than ${min.toLocaleString()}`,
      })
    } else if (validation.dateRange?.max !== undefined) {
      const max = moment(validation.dateRange.max)
      rules.push({
        flag: 'custom',
        constraint: (value) =>
          moment(value as string).isBefore(max)
            ? true
            : `Value should be no later than ${max.toLocaleString()}`,
      })
    } else if (Array.isArray(validation.in)) {
      const values = validation.in
      rules.push({
        flag: 'custom',
        // @ts-expect-error We want full contol over the validation function string
        constraint: `(value) => validateIn(${JSON.stringify(values)}, value)`,
      })
    }
  }

  return rules
}
