#!/usr/bin/env node

/* eslint-disable id-length, no-console, no-process-env, no-sync, no-process-exit */
require('hard-rejection/register')

const os = require('os')
const path = require('path')
const spawn = require('child_process').spawnSync
const meow = require('meow')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const sanityClient = require('@sanity/client')
const ConfigStore = require('configstore')
const spin = require('./to-publish/spin')
const migrate = require('./migrate')

const red = str => `\u001b[31mERROR: ${str}\u001b[39m`
const error = str => console.error(red(str))
const hasSanity = !spawn('sanity', ['help']).error

const cli = meow(
  `
  Usage
    $ contentful-to-sanity

  Options
    -s, --space <spaceId> Contentful space to migrate
    -p, --project <projectId> Sanity project ID to import to
    -d, --dataset <dataset> Sanity dataset to import to
    -o, --output <path> Path to create Sanity project in
    -l, --locale <locale> Locale to migrate,
    -f, --from-file <file> Import from stored contentful export file
    --sanity-token <token> Sanity token to authenticate with
    --contentful-token <token> Contentful management token to authenticate with
    --replace Replace documents in dataset if same IDs are encountered
    --missing Skip documents that already exist
    --help Show this help

  Examples
    # Migrate contentful space "m00p" to sanity project "m33p" and dataset "staging"
    $ contentful-to-sanity --space=m00p --project=m33p --dataset=staging

    # Migrate from an exported file created by contentful-export CLI tool
    $ contentful-to-sanity --from-file contentful.json --project=m33p --dataset=staging

  Environment variables (fallbacks for missing flags)
    --sanity-token = SANITY_IMPORT_TOKEN
    --contentful-token = CONTENTFUL_MANAGEMENT_TOKEN
`,
  {
    boolean: ['replace', 'missing'],
    alias: {
      s: 'space',
      p: 'project',
      d: 'dataset',
      o: 'output',
      l: 'locale'
    }
  }
)

const {flags, showHelp} = cli
const sanityToken = flags.sanityToken || getSanityToken() || process.env.SANITY_IMPORT_TOKEN
let firstPrompt = true
let spinner

if (!sanityToken && hasSanity) {
  console.log('Hi! It seems you are not logged in to Sanity locally, please run:')
  console.log('sanity login')
  process.exit(1)
}

if (!sanityToken && !hasSanity) {
  console.log("Hi! Can't seem to find any Sanity credentials locally.")
  console.log("Let's start by logging in or creating an account.")
  console.log('First, you will need to install the Sanity CLI tool:')
  console.log('  npm install -g @sanity/cli')
  console.log('Then, log in or create an account:')
  console.log('  sanity login')
  console.log('')
  console.log('Then run me again!')
  process.exit(1)
}

console.log('\nHi there! Thanks for the interest in Sanity!')

let operation = 'create'
if (flags.replace || flags.missing) {
  if (flags.replace && flags.missing) {
    error('Cannot use both `--replace` and `--missing`')
    showHelp()
  }

  operation = flags.replace ? 'createOrReplace' : 'createIfNotExists'
}

function prompt(options) {
  if (firstPrompt) {
    console.log('To migrate, we need some information from you:\n')
    firstPrompt = false
  }

  const defaults = {
    type: 'input',
    validate: validateNotEmpty,
    filter: trim
  }

  const question = Object.assign(defaults, options, {name: 'value'})
  return inquirer.prompt([question]).then(answers => answers.value)
}

function getSanityToken() {
  const configOpts = {globalConfigPath: true}
  return new ConfigStore('sanity', {}, configOpts).get('authToken')
}

async function isEmpty(dir) {
  try {
    const files = await fse.readdir(dir)
    return files.length === 0
  } catch (err) {
    if (err.code === 'ENOENT') {
      return fse.ensureDir(dir)
    }

    throw err
  }
}

function expandHome(filePath) {
  if (filePath.charCodeAt(0) === 126 /* ~ */) {
    if (filePath.charCodeAt(1) === 43 /* + */) {
      return path.join(process.cwd(), filePath.slice(2))
    }

    const home = os.homedir()
    return home ? path.join(home, filePath.slice(1)) : filePath
  }

  return filePath
}

function absolutify(dir) {
  const pathName = expandHome(dir)
  return path.isAbsolute(pathName) ? pathName : path.resolve(process.cwd(), pathName)
}

async function validateEmptyPath(dir) {
  const checkPath = absolutify(dir)
  return (await isEmpty(checkPath)) ? true : 'Given path is not empty'
}

function validateNotEmpty(str) {
  return `${str}`.length > 0 ? true : 'Cannot be empty'
}

function trim(str) {
  return `${str}`.trim()
}

function createProject(client, options) {
  return client
    .request({
      method: 'POST',
      uri: '/projects',
      body: options
    })
    .then(response => ({
      projectId: response.projectId || response.id,
      displayName: options.displayName || ''
    }))
}

function promptForDatasetName() {
  return prompt({
    message: 'Dataset name:',
    default: 'production',
    validate: name => {
      return /^[-\w]{1,128}$/.test(name) || 'Invalid dataset name'
    }
  })
}

async function getOrCreateProject(client) {
  let projects
  try {
    projects = await client.projects.list()
  } catch (err) {
    throw new Error(`Failed to communicate with the Sanity API:\n${err.message}`)
  }

  if (projects.length === 0) {
    const projectName = await prompt({message: 'Project name'})
    return createProject(client, {displayName: projectName})
  }

  const projectChoices = projects.map(project => ({
    value: project.id,
    name: `${project.displayName} [${project.id}]`
  }))

  const selected = await prompt({
    message: 'Select project to use',
    type: 'list',
    choices: [
      {value: 'new', name: 'Create new project'},
      new inquirer.Separator(),
      ...projectChoices
    ]
  })

  if (selected === 'new') {
    return createProject(client, {
      displayName: await prompt({
        message: 'Informal name for your project'
      })
    })
  }

  return {
    projectId: selected,
    displayName: projects.find(proj => proj.id === selected).displayName
  }
}

async function getOrCreateDataset(userSpecified, client) {
  const datasets = await client.datasets.list()

  if (datasets.length === 0) {
    const name = await promptForDatasetName()
    await client.datasets.create(name)
    return name
  }

  if (userSpecified && !datasets.find(item => item.name === userSpecified)) {
    throw new Error(`Dataset with name "${userSpecified}" not found`)
  }

  const datasetChoices = datasets.map(dataset => ({value: dataset.name}))

  const selected = await prompt({
    message: 'Select dataset to use',
    type: 'list',
    choices: [
      {value: 'new', name: 'Create new dataset'},
      new inquirer.Separator(),
      ...datasetChoices
    ]
  })

  if (selected === 'new') {
    const newDatasetName = await promptForDatasetName()
    await client.datasets.create(newDatasetName)
    return newDatasetName
  }

  return selected
}

function onProgress(opts) {
  const {step, complete} = opts

  if (!step && complete) {
    spinner.succeed()
    return
  }

  if (spinner) {
    spinner.succeed()
  }

  if (complete) {
    spinner = spin(step).start()
    spinner.render()
    spinner.succeed()
  } else {
    spinner = spin(step).start()
  }
}

async function run() {
  let {space, project, dataset, output, fromFile} = flags
  let contentfulToken = flags.contentfulToken || process.env.CONTENTFUL_MANAGEMENT_TOKEN

  // Use current work dir if empty
  const cwdIsEmpty = await isEmpty(process.cwd())
  if (!output && cwdIsEmpty) {
    output = process.cwd()
  }

  if (!output) {
    output = await prompt({
      message: 'Output path:',
      default: path.join(process.cwd()),
      validate: validateEmptyPath,
      filter: absolutify
    })
  }

  output = absolutify(output)
  if (!await isEmpty(output)) {
    throw new Error(`Output directory (${output}) is not empty`)
  }

  if (fromFile) {
    fromFile = path.resolve(fromFile)
    require(path.resolve(fromFile))
  }

  if (!space && !fromFile) {
    space = await prompt({message: 'Contentful space ID:'})
  }

  if (!contentfulToken && !fromFile) {
    contentfulToken = await prompt({message: 'Contentful management token:'})
  }

  // Create or use project
  let client
  if (!project) {
    client = sanityClient({
      useProjectHostname: false,
      dataset: 'dummy',
      token: sanityToken,
      useCdn: false
    })

    project = (await getOrCreateProject(client)).projectId
  }

  client = sanityClient({
    projectId: project,
    dataset: dataset || 'dummy',
    token: sanityToken,
    useCdn: false
  })

  // Use or prompt for dataset
  dataset = await getOrCreateDataset(dataset, client)
  client.config({dataset})

  // Run the migration
  await migrate({
    contentfulToken,
    onProgress,
    fromFile,
    space,
    project,
    dataset,
    output,
    operation,
    client,
    locale: flags.locale
  })

  const cd = path.resolve(output) === process.cwd() ? '' : `cd ${output} && `

  console.log('To start the Sanity studio locally, run:')
  console.log(`${cd}sanity start`)
}

run()
