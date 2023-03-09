import type {CustomValidator} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {serializeRuleSpecToCode} from '../helpers/sanity/serializeRuleSpecToCode'

describe('Validations', () => {
  test('transforms RuleSpec to javascript according to Sanity Studio validations API', () => {
    expect(serializeRuleSpecToCode({flag: 'presence', constraint: 'required'})).to.equal(
      'required()',
    )

    expect(serializeRuleSpecToCode({flag: 'presence', constraint: 'optional'})).to.equal('')

    expect(serializeRuleSpecToCode({flag: 'unique'})).to.equal('unique()')

    expect(serializeRuleSpecToCode({flag: 'min', constraint: 29})).to.equal('min(29)')

    expect(serializeRuleSpecToCode({flag: 'max', constraint: 29})).to.equal('max(29)')

    expect(serializeRuleSpecToCode({flag: 'integer'})).to.equal('integer()')

    expect(serializeRuleSpecToCode({flag: 'length', constraint: 29})).to.equal('length(29)')

    expect(serializeRuleSpecToCode({flag: 'email'})).to.equal('email()')

    expect(
      serializeRuleSpecToCode({
        flag: 'stringCasing',
        constraint: 'lowercase',
      }),
    ).to.equal('lowercase()')

    expect(
      serializeRuleSpecToCode({
        flag: 'stringCasing',
        constraint: 'uppercase',
      }),
    ).to.equal('uppercase()')

    const pattern = /^\d{3}/
    expect(
      serializeRuleSpecToCode({
        flag: 'regex',
        constraint: {pattern, invert: false},
      }),
    ).to.equal(`regex(${pattern}, {invert:false})`)

    expect(
      serializeRuleSpecToCode({
        flag: 'regex',
        constraint: {pattern, invert: true},
      }),
    ).to.equal(`regex(${pattern}, {invert:true})`)

    expect(
      serializeRuleSpecToCode({
        flag: 'regex',
        constraint: {pattern, name: 'reggie', invert: false},
      }),
    ).to.equal(`regex(${pattern}, {name:'reggie',invert:false})`)

    const validator: CustomValidator = (value, _) =>
      value === 'foo' ? true : {message: 'Value must be foo'}

    expect(serializeRuleSpecToCode({flag: 'custom', constraint: validator})).toEqual(
      'custom((value, _) => value === "foo" ? true : { message: "Value must be foo" })',
    )
  })
})
