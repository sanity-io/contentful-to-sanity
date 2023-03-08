import moment from 'moment'
import {ContentFields} from 'contentful-management'
import type {RuleSpec} from '@sanity/types'

export function extractValidationRulesFromContentfulField(
  field: ContentFields | Exclude<ContentFields['items'], undefined>,
): RuleSpec[] {
  const validations = field.validations ?? []
  const rules: RuleSpec[] = []

  if ('required' in field && field.required) {
    rules.push({flag: 'presence', constraint: 'required'})
  }

  if (field.type === 'Integer') {
    rules.push({flag: 'integer'})
  }

  for (const validation of validations) {
    if (validation.unique) {
      rules.push({flag: 'unique'})
    } else if (validation.regexp?.pattern) {
      rules.push({
        flag: 'regex',
        constraint: {
          invert: false,
          pattern: new RegExp(validation.regexp.pattern),
        },
      })
    } else if (validation.size?.min) {
      rules.push({flag: 'min', constraint: validation.size.min})
    } else if (validation.size?.max) {
      rules.push({flag: 'max', constraint: validation.size.max})
    } else if (validation.dateRange?.min) {
      const min = moment(validation.dateRange.min)
      rules.push({
        flag: 'custom',
        constraint: (value) =>
          moment(value as string).isAfter(min)
            ? true
            : `Value should be no earlier than ${min.toLocaleString()}`,
      })
    } else if (validation.dateRange?.max) {
      const max = moment(validation.dateRange.max)
      rules.push({
        flag: 'custom',
        constraint: (value) =>
          moment(value as string).isBefore(max)
            ? true
            : `Value should be no later than ${max.toLocaleString()}`,
      })
    }
  }

  return rules
}
