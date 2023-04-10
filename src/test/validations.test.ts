import type {CustomValidator} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {serializeRuleSpecToCode} from '../helpers/sanity/serializeRuleSpecToCode'
import {extractValidationRulesFromContentfulField} from '../utils'

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

    const validator: CustomValidator = (value) =>
      value === 'foo' ? true : {message: 'Value must be foo'}

    expect(serializeRuleSpecToCode({flag: 'custom', constraint: validator})).toEqual(
      'custom((value) => value === "foo" ? true : { message: "Value must be foo" })',
    )
  })

  test('transforms uri validation to javascript according to Sanity Studio validations API', () => {
    expect(
      serializeRuleSpecToCode({
        flag: 'uri',
        constraint: {
          options: {
            scheme: [/^ftp/],
            allowCredentials: true,
            allowRelative: true,
            relativeOnly: false,
          },
        },
      }),
    ).to.equal('uri({scheme:[/^ftp/],allowCredentials:true,allowRelative:true,relativeOnly:false})')

    expect(
      serializeRuleSpecToCode({
        flag: 'uri',
        constraint: {
          options: {
            // @ts-expect-error wrong type
            scheme: ['http', 'https'], // This type seems to be wrong in @sanity/types. See https://www.sanity.io/docs/url-type
          },
        },
      }),
    ).to.equal(`uri({scheme:['http','https']})`)
  })

  test('integer max', () => {
    const field = {
      id: 'number',
      name: 'number',
      type: 'Integer',
      localized: false,
      required: false,
      validations: [
        {
          range: {
            max: 10,
          },
        },
      ],
      disabled: false,
      omitted: false,
    }

    const validations = extractValidationRulesFromContentfulField(field)

    expect(validations).to.deep.equal([{flag: 'integer'}, {flag: 'max', constraint: 10}])
  })

  test('integer min', () => {
    const field = {
      id: 'number',
      name: 'number',
      type: 'Integer',
      localized: false,
      required: false,
      validations: [
        {
          range: {
            min: 1,
          },
        },
      ],
      disabled: false,
      omitted: false,
    }

    const validations = extractValidationRulesFromContentfulField(field)

    expect(validations).to.deep.equal([{flag: 'integer'}, {flag: 'min', constraint: 1}])
  })

  test('integer max and min', () => {
    const field = {
      id: 'number',
      name: 'number',
      type: 'Integer',
      localized: false,
      required: false,
      validations: [
        {
          range: {
            min: 1,
            max: 10,
          },
          message: 'Needs that special range',
        },
      ],
      disabled: false,
      omitted: false,
    }

    const validations = extractValidationRulesFromContentfulField(field)

    expect(validations).to.deep.equal([
      {flag: 'integer'},
      {flag: 'min', constraint: 1},
      {flag: 'max', constraint: 10},
    ])
  })

  test('decimal range', () => {
    const field = {
      id: 'dec',
      name: 'dec',
      type: 'Number',
      localized: false,
      required: false,
      validations: [
        {
          range: {
            min: 0,
            max: 1,
          },
        },
      ],
      disabled: false,
      omitted: false,
    }
    const validations = extractValidationRulesFromContentfulField(field)

    expect(validations).to.deep.equal([
      {flag: 'min', constraint: 0},
      {flag: 'max', constraint: 1},
    ])
  })

  /*
  test('value needs to be in set', () => {
    const field = {
      id: 'dec',
      name: 'dec',
      type: 'Number',
      localized: false,
      required: false,
      validations: [
        {
          in: [10, 29, 50],
        },
      ],
      disabled: false,
      omitted: false,
    }
    const validations = extractValidationRulesFromContentfulField(field)

    expect(validations).to.deep.equal([{flag: 'custom', constraint: 'validateIn([10,29,50])'}])
  })
  */

  test('Does not add unique() validations', () => {
    const field = {
      id: 'dec',
      name: 'dec',
      type: 'Number',
      localized: false,
      required: false,
      validations: [
        {
          unique: true,
        },
      ],
      disabled: false,
      omitted: false,
    }
    const validations = extractValidationRulesFromContentfulField(field)
    expect(validations.length).toBe(0)
  })
})
