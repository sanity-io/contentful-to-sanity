"use strict";
var index = require("./index.cjs"), commander = require("commander"), version = "4.2.10";
const outdirArgument = ["<outdir>", "The directory to save the Contentful export in."], exportFileOption = [
  "--export-file [name]",
  "The filename for the exported JSON document that holds your Contentful data.",
  "contentful.json"
], schemaFileOption = [
  "--schema-file [name]",
  "The filename for the generated Sanity Studio schema definitions file. Use `.js` file endings to strip TypeScript syntax.",
  "schema.ts"
], datasetFileOption = [
  "--dataset-file [name]",
  "The filename for the generated NDJSON document that can be used with the Sanity CLI `import` command",
  "dataset.ndjson"
], spaceIdOption = ["-s, --space-id <space-id>", "The Contentful space ID"], environmentIdOption = [
  "-e, --environment-id [environment-id[",
  "Contentful environment",
  "master"
], managementTokenOption = [
  "-t, --management-token <management-token>",
  "Contentful Management API token"
], accessTokenOption = [
  "-a, --access-token <access-token>",
  "Contentful Content Delivery API access token"
], intlOption = new commander.Option(
  "--intl [mode]",
  "Define the intl behavior. This is disabled by default and only one locale will be considered."
).default("single").choices(["single", "multiple"]), weakRefsOption = ["--weak-refs", "Use weak refs instead of strong ones", !1], intlIdStructureOption = new commander.Option(
  "--intl-id-structure [type]",
  "Defines the ID behavior for i18n. See @sanity/document-internationalization for more info"
).default("delimiter").choices(["subpath", "delimiter"]), markdownOption = [
  "--keep-markdown",
  "Whether to keep markdown as-is or convert it to portable text",
  !1
], optimizeSvgOption = [
  "--optimize-svgs",
  "Whether to optimize SVGs before importing them",
  !1
], convertImagesOption = [
  "--convert-images",
  "Whether to convert unsupported image formats before importing them",
  !1
], localeOption = [
  "--locale [id]",
  "The locale to import. This should be used when using the intl single mode"
], requiredAction = (name) => () => {
  throw new TypeError(`Missing required action: ${name}`);
}, requiredActions = {
  batchAction: requiredAction("batchAction"),
  exportAction: requiredAction("schemaAction"),
  schemaAction: requiredAction("schemaAction"),
  datasetAction: requiredAction("datasetAction")
};
function makeProgram(opts = {}) {
  const program2 = new commander.Command(), actions = { ...requiredActions, ...opts.actions };
  return opts.exitOverride && program2.exitOverride(), opts.suppressOutput && program2.configureOutput({
    writeOut: () => {
    },
    writeErr: () => {
    }
  }), program2.version(version).allowExcessArguments(!1).allowUnknownOption(!1), program2.command("export").argument(...outdirArgument).requiredOption(...spaceIdOption).requiredOption(...managementTokenOption).requiredOption(...accessTokenOption).option(...environmentIdOption).option(...exportFileOption).action((exportDir, options) => {
    try {
      const args = index.exportActionArgs.parse({
        exportDir,
        ...options,
        saveFile: !0
      });
      return actions.exportAction(args);
    } catch (err) {
      throw index.formatError(err);
    }
  }), program2.command("schema").argument(...outdirArgument).option(...exportFileOption).option(...schemaFileOption).option(...markdownOption).addOption(intlOption).action((exportDir, options) => {
    try {
      const args = index.schemaActionArgs.parse({
        exportDir,
        ...options
      });
      return actions.schemaAction(args);
    } catch (err) {
      throw index.formatError(err);
    }
  }), program2.command("dataset").argument(...outdirArgument).option(...exportFileOption).option(...datasetFileOption).option(...markdownOption).option(...optimizeSvgOption).option(...convertImagesOption).addOption(intlOption).option(...weakRefsOption).addOption(intlIdStructureOption).option(...localeOption).action((exportDir, options) => {
    try {
      const args = index.datasetActionArgs.parse({
        exportDir,
        ...options
      });
      return actions.datasetAction(args);
    } catch (err) {
      throw index.formatError(err);
    }
  }), program2.command("batch", { isDefault: !0 }).description("Runs the export, schema and dataset commands in sequence.").argument(...outdirArgument).requiredOption(...spaceIdOption).requiredOption(...managementTokenOption).requiredOption(...accessTokenOption).option(...environmentIdOption).option(...exportFileOption).option(...schemaFileOption).option(...datasetFileOption).option(...markdownOption).option(...optimizeSvgOption).option(...convertImagesOption).option(...weakRefsOption).addOption(intlIdStructureOption).option(...localeOption).action((exportDir, options) => {
    try {
      const args = index.batchActionArgs.parse({
        exportDir,
        ...options,
        saveFile: !0
      });
      return actions.batchAction(args);
    } catch (err) {
      throw index.formatError(err);
    }
  }), program2;
}
const program = makeProgram({ actions: { batchAction: index.batchAction, datasetAction: index.datasetAction, exportAction: index.exportAction, schemaAction: index.schemaAction } });
program.parse();
//# sourceMappingURL=cli.cjs.map
