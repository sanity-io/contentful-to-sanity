const ora = require('ora')
const prettyMs = require('pretty-ms')

module.exports = (opts) => {
  const spinner = ora(opts)
  const text = spinner.text
  let startTime
  let timer

  return {
    start,
    stop: stop.bind(null, 'stop'),
    succeed: stop.bind(null, 'succeed'),
    fail: stop.bind(null, 'fail'),
    warn: stop.bind(null, 'warn'),
    info: stop.bind(null, 'info'),
    stopAndPersist: stop.bind(null, 'stopAndPersist')
  }

  function start(newText) {
    startTime = Date.now()
    timer = setInterval(updateTime, 200)
    return spinner.start(newText)
  }

  function stop(method, newText) {
    clearInterval(timer)
    return spinner[method](newText || getText())
  }

  function getText() {
    const spent = Date.now() - startTime
    return `${text} (${prettyMs(spent, {secDecimalDigits: 2})})`
  }

  function updateTime() {
    spinner.text = getText()
  }
}
