# contentful-to-sanity

Migrate from contentful to Sanity

## Installation

```
npm install -g @sanity/contentful-to-sanity
```

## Requirements

Requires node.js version >= 7.6

## Usage

```
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
```

## Caveats

- Only published items will be imported
- Validations are not ported (currently)
- Omitted fields are not included

## License

MIT-licensed. See LICENSE.
