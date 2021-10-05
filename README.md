# contentful-to-sanity

This package liberates Contentful spaces, creating Sanity projects and schemas as it goes.

## Installation

```
npm install -g contentful-to-sanity
```

## Requirements

Requires node.js version >= 12

## Usage

1. Install the CLI tool (see _Installation_ above)
2. Install the Sanity CLI tool (if not already done) and log in

   `npm install -g @sanity/cli && sanity login`

3. Open Contentful and navigate to your space: https://app.contentful.com/
4. Find the contentful space ID of your project (under _Space settings_ → _General_)
5. Create a content management token (under _Space settings_ → _API keys_ → _Content management tokens_ → _Generate personal token_)
6. Run the migration tool:

   `contentful-to-sanity --space <your-space-id> --contentful-token <your contentful token>`

## Documentation

```
  Usage
    $ contentful-to-sanity

  Options
    -s, --space <spaceId> Contentful space to migrate
    -p, --project <projectId> Sanity project ID to import to
    -d, --dataset <dataset> Sanity dataset to import to
    -o, --output <path> Path to create Sanity project in
    -l, --locale <locale> Locale to migrate
    -f, --from-file <file> Import from stored contentful export file
    --sanity-token <token> Sanity token to authenticate with
    --contentful-token <token> Contentful management token to authenticate with
    --replace Replace documents in dataset if same IDs are encountered
    --missing Skip documents that already exist
    --keep-markdown Keeps markdown as-is. Converts to block content format by default.
    --weak-refs Use weak references (allow import to continue on broken references)
    --help Show this help

  Examples
    # Migrate contentful space "4cfSp4c3" with contentful token "d4t-t0k3n", prompt for info
    $ contentful-to-sanity --space=4cfSp4c3 --contentful-token=d4t-t0k3n

    # Migrate contentful space "4cfSp4c3" to sanity project "s4ni7yp" and dataset "staging"
    $ contentful-to-sanity --space=4cfSp4c3 --project=s4ni7yp --dataset=staging

    # Migrate from an exported file created by contentful-export CLI tool
    $ contentful-to-sanity --from-file contentful.json --project=s4ni7yp --dataset=staging

  Environment variables (fallbacks for missing flags)
    --sanity-token = SANITY_IMPORT_TOKEN
    --contentful-token = CONTENTFUL_MANAGEMENT_TOKEN
```

## Caveats

- Only published items will be imported
- Markdown is converted on a best-effort basis. Certain features (like tables) are not supported. Arbitrary HTML is either skipped or unwrapped to simple text values. Inline images are currently skipped. You can disable markdown conversion by using `--keep-markdown`.
- Validations are not ported (currently)
- Omitted fields are not included
- Fields that accept both images and files currently only allow images

## License

MIT-licensed. See LICENSE.
