const exportContentful = require('./exportContentful')
const transformSchema = require('./transformSchema')
const transformData = require('./transformData')
const bootstrapStudio = require('./bootstrapStudio')
const writeToDisk = require('./writeToDisk')
const importToSanity = require('./importToSanity')
const createSanitySchema = require('./createSanitySchema')

const noop = () => {
  /* noop */
}

const steps = {
  exporting: 'Exporting from contentful',
  transformSchema: 'Transforming schema',
  transformData: 'Transforming data entries',
  createSchema: 'Creating schema definitions',
  writeToDisk: 'Writing to disk',
  done: 'Done!'
}

async function migrate(options) {
  const onProgress = options.onProgress || noop

  let data
  if (options.fromFile) {
    data = require(options.fromFile)
  } else {
    onProgress({step: steps.exporting})
    data = await exportContentful(options)
  }

  onProgress({step: steps.transformSchema})
  const schema = await transformSchema(data, options)

  onProgress({step: steps.transformData})
  const transformed = await transformData(data, options)

  onProgress({step: steps.createSchema})
  const files = await createSanitySchema(schema)
  onProgress({complete: true})

  // @todo make bootstrap silent so we can handle progress ourselves
  console.log('Bootstrapping Sanity content studio...')
  await bootstrapStudio(options)

  onProgress({step: steps.writeToDisk})
  await writeToDisk(files, options)
  onProgress({complete: true})

  // @todo pass onprogress handling onto parent
  await importToSanity(transformed, options)
  onProgress({complete: true})

  onProgress({step: steps.done, complete: true})
}

module.exports = migrate
