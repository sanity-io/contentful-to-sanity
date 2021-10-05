const path = require('path')
const fsExtra = require('fs-extra')

module.exports = (files, options) =>
  Promise.all(
    files.map((file) =>
      fsExtra.outputFile(
        path.join(options.output, 'schemas', file.path),
        file.content
      )
    )
  )
