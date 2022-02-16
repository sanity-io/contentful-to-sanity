import type {ReactNode} from 'react'
import {FieldType} from './FieldType'

type DefaultPreviewSelection = {
  title: string;
  subtitle: string;
}

export type SanityDocumentSchema<P = DefaultPreviewSelection> = {
  type: 'document'
  name: string
  fields: FieldType[]
  title?: string
  description?: string
  preview?: {
    select: Record<string, string>
    prepare?: (selection: P) => {
      title: string;
      subtitle: string;
      media?: ReactNode
    }
  }
}
