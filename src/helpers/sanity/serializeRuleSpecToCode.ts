import type {RuleSpec} from '@sanity/types'
import {stringify} from 'javascript-stringify'
import omit from 'just-omit'

export const serializeRuleSpecToCode = (ruleSpec: RuleSpec): string => {
  switch (ruleSpec.flag) {
    case 'presence':
      if (ruleSpec.constraint === 'optional') return ''
      return 'required()'
    case 'unique':
      return 'unique()'
    case 'min':
      return `min(${ruleSpec.constraint})`
    case 'max':
      return `max(${ruleSpec.constraint})`
    case 'integer':
      return 'integer()'
    case 'length':
      return `length(${ruleSpec.constraint})`
    case 'email':
      return 'email()'
    case 'stringCasing':
      return ruleSpec.constraint === 'lowercase' ? 'lowercase()' : 'uppercase()'
    case 'regex':
      return `regex(${ruleSpec.constraint.pattern.toString()}, ${stringify(
        omit(ruleSpec.constraint, ['pattern']),
      )})`
    case 'custom':
      return `custom(${ruleSpec.constraint.toString()})`
    default:
      throw new Error('Unknown rule spec: ' + ruleSpec.flag)
  }
}
