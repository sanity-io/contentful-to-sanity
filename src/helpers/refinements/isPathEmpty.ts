import {isDirEmpty} from 'utils'

export const isPathEmpty = async (dir: string): Promise<boolean> => {
  return isDirEmpty(dir, true)
}
