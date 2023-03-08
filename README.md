# contentful-to-sanity

This package liberates Contentful spaces, creating Sanity projects and schemas as it goes.

<!-- toc -->

- [Intallation](#installation)
- [Requirements](#requirements)
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Installation

<!-- installation -->

```sh-session
$ npm install -g contentful-to-sanity
```

<!-- installationstop -->

## Requirements

<!-- requirements -->

Requires node.js version >= 12

<!-- requirementsstop -->

# Usage

<!-- usage -->

1. Install the CLI tool (see _Installation_ above)
2. Install the Sanity CLI tool (if not already done) and log in
   `npm install -g @sanity/cli && sanity login`
3. Open Contentful and navigate to your space: https://app.contentful.com/
4. Find the contentful space ID of your project (under _Space settings_ → _General_)
5. Create a content management token (under _Space settings_ → _API keys_ → _Content management tokens_ → _Generate personal token_)
6. Run the migration tool (see [Commands](#commands))
<!-- usagestop -->

# Commands

<!-- commands -->

- [`contentful-to-sanity help [COMMAND]`](#contentful-to-sanity-help-command)

## `contentful-to-sanity help [COMMAND]`

Display help for contentful-to-sanity.

```
USAGE
  $ contentful-to-sanity help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for contentful-to-sanity.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.10/src/commands/help.ts)_

<!-- commandsstop -->
