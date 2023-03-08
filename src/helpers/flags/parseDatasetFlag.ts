// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import {CliUx} from '@oclif/core'
import type {SanityClient} from '@sanity/client'
import inquirer from 'inquirer'

import {promptSingleInput} from 'utils'

import {SanityApiError, SanityDatasetNotFoundError} from '../errors'
import {defaultSanityClient} from '../sanity'

type FlagOptions = {
  required?: boolean
  projectId: string
  sanityToken: string
}

type WithDatasetFlag = {
  dataset?: string
}

type SanityDatasetList = ReturnType<SanityClient['datasets']['list']> extends Promise<infer V>
  ? V
  : never
type SanityDataset = SanityDatasetList[number]

export async function parseDatasetFlag<V extends WithDatasetFlag>(
  flags: V,
  options: FlagOptions & {required: true},
): Promise<SanityDataset>
export async function parseDatasetFlag<V extends WithDatasetFlag>(
  flags: V,
  options: FlagOptions & {required?: boolean},
): Promise<SanityDataset | undefined>
export async function parseDatasetFlag<V extends WithDatasetFlag>(
  flags: V,
  options: FlagOptions,
): Promise<SanityDataset | void> {
  const client = defaultSanityClient.withConfig({
    useProjectHostname: true,
    projectId: options.projectId,
    token: options.sanityToken,
  })
  let datasets: SanityDataset[] = []

  try {
    CliUx.ux.action.start('Loading datasets')
    datasets = await client.datasets.list()
    CliUx.ux.action.stop()
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined
    throw new SanityApiError(message)
  }

  const userSpecifiedDataset = datasets.find(({name}) => name === flags.dataset)
  if (flags.dataset && !userSpecifiedDataset) {
    throw new SanityDatasetNotFoundError(flags.dataset)
  }

  if (userSpecifiedDataset) {
    return userSpecifiedDataset
  }

  if (options.required) {
    let selectAnswer = {dataset: 'new'}

    if (datasets.length > 0) {
      selectAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'dataset',
          message: 'Select dataset to use',
          choices: [
            {value: 'new', name: 'Create new dataset'},
            new inquirer.Separator(),
            ...datasets.map((dataset) => ({
              value: dataset.name,
            })),
          ],
        },
      ])
    }

    if (selectAnswer.dataset === 'new') {
      const createdDataset = await client.datasets.create(
        await promptSingleInput({
          message: 'Dataset name: ',
        }),
      )
      return {
        name: createdDataset.datasetName,
        aclMode: createdDataset.aclMode,
      }
    }

    const selectedDataset = datasets.find(({name}) => name === selectAnswer.dataset)!
    return selectedDataset
  }
}
