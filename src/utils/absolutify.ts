import path from 'path'
import {expandHome} from './expandHome'

export function absolutify(dir: string): string {
  const pathName = expandHome(dir)
  return path.isAbsolute(pathName) ?
    pathName :
    path.resolve(process.cwd(), pathName)
}
