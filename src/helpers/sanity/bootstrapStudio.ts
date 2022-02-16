import {execa} from 'execa'

type Options = {
  project: string
  dataset: string
  output: string
}

export function bootstrapStudio(options: Options) {
  const proc = execa('sanity', [
    'init',
    '--yes',
    '--project',
    options.project,
    '--dataset',
    options.dataset,
    '--output-path',
    options.output,
    '--template',
    'clean',
  ])

  proc.stdout?.pipe(process.stdout)

  return proc
}
