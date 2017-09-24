# contentful-to-sanity

Migrate from contentful to Sanity

## Wanted flow

```
contentful-to-sanity --space-id=foo

> Hi, and thanks for migrating to Sanity!
> For migration to proceed, we need to:
  ✔ Specify the contentful Space ID
  ☐ Specify contentful management API token
  ☐ Create or select a Sanity project
  ☐ Create or select a Sanity dataset
  ☐ Select output directory
  ☐ Select which parts you want to migrate

> That's all the information we need!
  ☐ Downloading data from Contentful
  ☐ Bootstrapping Sanity project
  ☐ Creating Sanity schema files
  ☐ Migrate content to Sanity

> That's it! All done.
> To start the Sanity studio locally, run:
>   cd <some-path> && sanity start
```

## Todo

- Migrate assets first, use same label-hash logic as import in order to include metadata (title, description) for assets, which is currently lost

## Caveats

- References to unpublished items will fail (we can't do that in Sanity, can we?)
- Media fields that can be both images and files are not handled well, always using `file`
- Validations are not ported (currently)
- Omitted fields are simply not included
