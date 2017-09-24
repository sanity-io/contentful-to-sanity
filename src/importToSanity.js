const sanityImport = require('@sanity/import')
const stringToStream = require('string-to-stream')
const prettyMs = require('pretty-ms')
const ora = require('ora')

function importToSanity(documents, options) {
  const ndjson = documents.reduce((buffer, doc) => {
    return `${buffer}\n${JSON.stringify(doc)}`
  }, '')

  let currentStep
  let currentProgress
  let stepStart
  let spinInterval

  const stream = stringToStream(ndjson)
  return sanityImport(stream, {
    onProgress,
    client: options.client,
    operation: options.operation
  })

  // @todo move all progress logic out of here
  function onProgress(opts) {
    const lengthComputable = opts.total
    const sameStep = opts.step == currentStep
    const percent = getPercentage(opts)

    if (lengthComputable && opts.total === opts.current) {
      clearInterval(spinInterval)
      spinInterval = null
    }

    if (sameStep && !lengthComputable) {
      return
    }

    if (sameStep) {
      const timeSpent = prettyMs(Date.now() - stepStart, {secDecimalDigits: 2})
      currentProgress.text = `${percent}${opts.step} (${timeSpent})`
      currentProgress.render()
      return
    }

    // Moved to a new step
    const prevStep = currentStep
    const prevStepStart = stepStart
    stepStart = Date.now()
    currentStep = opts.step

    if (spinInterval) {
      clearInterval(spinInterval)
      spinInterval = null
    }

    if (currentProgress && currentProgress.succeed) {
      const timeSpent = prettyMs(Date.now() - prevStepStart, {
        secDecimalDigits: 2
      })
      currentProgress.text = `[100%] ${prevStep} (${timeSpent})`
      currentProgress.succeed()
    }

    currentProgress = ora(`[0%] ${opts.step} (0.00s)`).start()

    if (!lengthComputable) {
      spinInterval = setInterval(() => {
        const timeSpent = prettyMs(Date.now() - prevStepStart, {
          secDecimalDigits: 2
        })
        currentProgress.text = `${percent}${opts.step} (${timeSpent})`
        currentProgress.render()
      }, 60)
    }
  }

  function getPercentage(opts) {
    if (!opts.total) {
      return ''
    }

    const percent = Math.floor(opts.current / opts.total * 100)
    return `[${percent}%] `
  }
}

module.exports = importToSanity
