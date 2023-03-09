# contentful-to-sanity

[![npm stat](https://img.shields.io/npm/dm/contentful-to-sanity.svg?style=flat-square)](https://npm-stat.com/charts.html?package=contentful-to-sanity)
[![npm version](https://img.shields.io/npm/v/contentful-to-sanity.svg?style=flat-square)](https://www.npmjs.com/package/contentful-to-sanity)

This package liberates Contentful spaces, creating Sanity projects and schemas as it goes.

## Usage

### 1. Open Contentful and navigate to your space: https://app.contentful.com/

Find the contentful space ID of your project (under _Space settings_ → _General_).
Create a content management token (under _Space settings_ → _API keys_ → _Content management tokens_ → _Generate personal token_).

### 2. Setup a clean Sanity v3 Studio and connect it to, or crate, the Sanity project and dataset you want as your destination:

```bash
npx sanity@latest init --template clean --output-path ./migrate
```

### 4. Run the migration, which prepares a dataset.ndjson file for the later import step:

```bash
npx contentful-to-sanity@latest -s <cspace ID> -t <personal token> ./migrate
```

### 5. Start the dataset import process, which will finish in the background:

```bash
cd ./migrate && npx sanity dataset import ./dataset.ndjson
```

### 6. Open `./migrate/sanity.config.ts`

If you chose the `clean` template it should look like this

```ts
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'default',
  title: '<project-name>',

  projectId: '<project-id>',
  dataset: '<dataset>',

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
```

Now replace the `schemaTypes` import with the generated one:

```diff
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
-import {schemaTypes} from './schemas'
+import {types as schemaTypes} from './schema'

export default defineConfig({
  name: 'default',
  title: '<project-name>',
```

### 7. Try the Studio 🎉

```bash
npx sanity dev
```

You don't have to wait for the `import dataset.ndjson` job to finish befoer the Studio is ready for use. The Studio will keep up to speed with the progress of the import job in real-time.

## Commands

For more information on the available commands and their options, run `contentful-to-sanity --help`.

## Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/contentful-to-sanity/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.

## License

MIT © [Sanity.io](https://www.sanity.io/)
