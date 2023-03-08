import {datasetAction} from '../actions/datasetAction'
import {batchAction} from '../actions/batchAction'
import {exportAction} from '../actions/exportAction'
import {schemaAction} from '../actions/schemaAction'
import {makeProgram} from './command'

const program = makeProgram({actions: {batchAction, datasetAction, exportAction, schemaAction}})

// Just run it
program.parse()
