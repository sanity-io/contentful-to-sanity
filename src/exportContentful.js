const createClients = require('contentful-batch-libs/dist/utils/create-clients')
const getFullSourceSpace = require('contentful-batch-libs/dist/get/get-full-source-space')

const requiredParams = ['space', 'contentfulToken']

module.exports = async (opts) => {
  requiredParams.forEach((param) => {
    if (!opts[param]) {
      throw new Error(`"${param}" needs to be specified`)
    }
  })

  const clients = createClients({
    sourceSpace: opts.space,
    managementApplication: 'contentful.export/4.7.7',
    sourceManagementToken: opts.contentfulToken
  })

  try {
    const result = await getFullSourceSpace({
      managementClient: clients.source.management,
      spaceId: opts.space,
      skipContentModel: false,
      skipContent: false,
      skipWebhooks: true,
      skipRoles: true,
      includeDrafts: true,
      maxAllowedLimit: 500,
      listrOptions: {renderer: 'silent'}
    }).run({data: {}})

    return result.data
  } catch (err) {
    throw new Error(`Failed to export data from Contentful:\n${err.stack}`)
  }
}
