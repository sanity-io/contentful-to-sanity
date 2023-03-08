import {CliUx} from '@oclif/core'
import type {SanityClient} from '@sanity/client'
import inquirer from 'inquirer'

import {promptSingleInput} from '@/utils'

import {SanityApiError, SanityProjectNotFoundError} from '../errors'
import {createProject, defaultSanityClient} from '../sanity'

type FlagOptions = {
  required?: boolean
  sanityToken: string
}

type WithProjectFlag = {
  project?: string
}

type SanityProject = ReturnType<SanityClient['projects']['getById']> extends Promise<infer V>
  ? V
  : never

export async function parseProjectFlag<V extends WithProjectFlag>(
  flags: V,
  options: FlagOptions & {required: true},
): Promise<SanityProject>
export async function parseProjectFlag<V extends WithProjectFlag>(
  flags: V,
  options: FlagOptions & {required?: boolean},
): Promise<SanityProject | undefined>
export async function parseProjectFlag<V extends WithProjectFlag>(
  flags: V,
  options: FlagOptions,
): Promise<SanityProject | undefined> {
  const client = defaultSanityClient.withConfig({
    token: options.sanityToken,
  })
  let projects: SanityProject[] = []

  try {
    CliUx.ux.action.start('Loading Sanity projects')
    projects = await client.projects.list()
    CliUx.ux.action.stop()
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined
    throw new SanityApiError(message)
  }

  const userSpecifiedProject = projects.find(({id}) => id === flags.project)
  if (flags.project && !userSpecifiedProject) {
    throw new SanityProjectNotFoundError(flags.project)
  }

  if (userSpecifiedProject) {
    return userSpecifiedProject
  }

  if (options.required) {
    let selectAnswer = {project: 'new'}

    if (projects.length > 0) {
      selectAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'project',
          message: 'Select project to use',
          choices: [
            {value: 'new', name: 'Create new project'},
            new inquirer.Separator(),
            ...projects.map((project) => ({
              value: project.id,
              name: `${project.displayName} [${project.id}]`,
            })),
          ],
        },
      ])
    }

    if (selectAnswer.project === 'new') {
      return createProject({
        displayName: await promptSingleInput({
          message: 'Project name: ',
        }),
        sanityToken: options.sanityToken,
      })
    }

    const selectedProject = projects.find(({id}) => id === selectAnswer.project)!
    return selectedProject
  }
}
