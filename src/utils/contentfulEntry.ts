import {type EntryProps} from 'contentful-management'

export function isDraft(entry: EntryProps<Record<string, Record<string, any>>>): boolean {
  return entry.sys.publishedVersion === undefined
}

export function isChanged(entry: EntryProps<Record<string, Record<string, any>>>): boolean {
  return !!entry.sys.publishedVersion && entry.sys.version >= entry.sys.publishedVersion + 2
}

export function isPublished(entry: EntryProps<Record<string, Record<string, any>>>): boolean {
  return !!entry.sys.publishedVersion && entry.sys.version == entry.sys.publishedVersion + 1
}
