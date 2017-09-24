# contentful-to-sanity

Migrate from contentful to Sanity

## Todo

- Migrate assets first, use same label-hash logic as import in order to include metadata (title, description) for assets, which is currently lost

## Caveats

- References to unpublished items will fail (we can't do that in Sanity, can we?)
- Media fields that can be both images and files are not handled well, always using `file`
- Validations are not ported (currently)
- Omitted fields are simply not included
