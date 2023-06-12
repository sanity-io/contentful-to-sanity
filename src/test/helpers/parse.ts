import {faker} from '@faker-js/faker'

faker.seed(123)

const mockKey = faker.string.uuid().slice(0, 8)
const mockMarks = [faker.string.uuid().slice(0, 8)]
export function parse(str: any) {
  return JSON.parse(str, (key: string, value: any): any => {
    if (key === '_key') {
      return mockKey
    }
    if (key === 'marks' && Array.isArray(value) && value.length > 0) {
      return mockMarks
    }
    return value
  })
}
