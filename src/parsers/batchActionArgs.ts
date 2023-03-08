import {z} from 'zod'

import {datasetActionArgs} from './datasetActionArgs'
import {exportActionArgs} from './exportActionArgs'
import {schemaActionArgs} from './schemaActionArgs'

export const batchActionArgs = exportActionArgs.merge(schemaActionArgs).merge(datasetActionArgs)
export type BatchActionArgs = z.infer<typeof batchActionArgs>
