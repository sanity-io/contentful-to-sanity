require('hard-rejection/register')

const exportContentful = require('./exportContentful')
const fsExtra = require('fs-extra')
const path = require('path')

exportContentful({
  exportId: 'foo',
  spaceId: '4hht6erl7cex',
  contentfulToken: 'CFPAT-8a623a25d796271119d02a7eb2d939fa8eb97784ae9ebf21335f135de1d3c72e'
}).then(res =>
  Promise.all(
    Object.keys(res).map(item =>
      fsExtra.outputJson(path.join(__dirname, '..', 'output', 'data', `${item}.json`), res[item], {
        spaces: 2
      })
    )
  )
)
