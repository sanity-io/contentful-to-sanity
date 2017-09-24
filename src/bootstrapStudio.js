const execa = require('execa')

function bootstrapStudio(options) {
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
    'clean'
  ])

  proc.stdout.pipe(process.stdout)
  return proc
}

module.exports = bootstrapStudio
