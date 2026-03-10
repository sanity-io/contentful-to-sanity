"use strict";
Object.defineProperty(exports, "__esModule", { value: !0 });
var promises = require("node:fs/promises"), path = require("node:path"), isAbsolutePath = require("@stdlib/assert-is-absolute-path"), invariant = require("tiny-invariant"), compact = require("just-compact"), contentfulRichTextToPortableText = require("@portabletext/contentful-rich-text-to-portable-text"), objectHash = require("object-hash"), crypto = require("crypto"), blockTools = require("@sanity/block-tools"), schema = require("@sanity/schema"), jsdom = require("jsdom"), md = require("markdown-it"), omit = require("just-omit"), get = require("just-safe-get"), set = require("just-safe-set"), fs = require("node:fs"), readline = require("node:readline"), node_stream = require("node:stream"), fetch = require("node-fetch"), sharp = require("sharp"), svgo = require("svgo"), os = require("node:os"), contentfulExport = require("contentful-export"), mkdirp = require("mkdirp"), path$1 = require("path"), Case = require("case"), javascriptStringify = require("javascript-stringify"), prettier = require("prettier"), isRelativePath = require("@stdlib/assert-is-relative-path"), zod = require("zod"), zodValidationError = require("zod-validation-error");
function _interopDefaultCompat(e) {
  return e && typeof e == "object" && "default" in e ? e : { default: e };
}
var path__default = /* @__PURE__ */ _interopDefaultCompat(path), isAbsolutePath__default = /* @__PURE__ */ _interopDefaultCompat(isAbsolutePath), invariant__default = /* @__PURE__ */ _interopDefaultCompat(invariant), compact__default = /* @__PURE__ */ _interopDefaultCompat(compact), objectHash__default = /* @__PURE__ */ _interopDefaultCompat(objectHash), crypto__default = /* @__PURE__ */ _interopDefaultCompat(crypto), md__default = /* @__PURE__ */ _interopDefaultCompat(md), omit__default = /* @__PURE__ */ _interopDefaultCompat(omit), get__default = /* @__PURE__ */ _interopDefaultCompat(get), set__default = /* @__PURE__ */ _interopDefaultCompat(set), fs__default = /* @__PURE__ */ _interopDefaultCompat(fs), readline__default = /* @__PURE__ */ _interopDefaultCompat(readline), fetch__default = /* @__PURE__ */ _interopDefaultCompat(fetch), sharp__default = /* @__PURE__ */ _interopDefaultCompat(sharp), os__default = /* @__PURE__ */ _interopDefaultCompat(os), contentfulExport__default = /* @__PURE__ */ _interopDefaultCompat(contentfulExport), path__default$1 = /* @__PURE__ */ _interopDefaultCompat(path$1), Case__default = /* @__PURE__ */ _interopDefaultCompat(Case), prettier__default = /* @__PURE__ */ _interopDefaultCompat(prettier), isRelativePath__default = /* @__PURE__ */ _interopDefaultCompat(isRelativePath);
function isDraft(entry) {
  return entry.sys.publishedVersion === void 0;
}
function isChanged(entry) {
  return !!entry.sys.publishedVersion && entry.sys.version >= entry.sys.publishedVersion + 2;
}
function isArchived(entry) {
  return !!entry.sys.archivedVersion;
}
function prefixUrl(url) {
  return url.startsWith("//") ? `https:${url}` : url;
}
function contentfulLinkToSanityReference(id, link, locale, data, options = {}) {
  if (link.sys.linkType === "Asset") {
    const asset = data.assets?.find((item) => item.sys.id === link.sys.id);
    if (asset) {
      const file = asset.fields.file?.[locale];
      if (!file)
        return console.warn(`Missing file in asset [${asset.sys.id}]`), null;
      const type = file.contentType.startsWith("image/") ? "image" : "file";
      return file.url ? {
        _type: type,
        _sanityAsset: `${type}@${prefixUrl(file.url)}`
      } : (console.warn(`Missing asset url [${asset.sys.id}]`), null);
    }
    return console.warn(`Missing asset with ID [${link.sys.id}]`), null;
  }
  const linkedEntry = data.entries && data.entries.find((item) => item.sys.id === link.sys.id);
  if (!linkedEntry)
    return console.warn(`Missing entry with ID [${link.sys.id}]`), null;
  if (isDraft(linkedEntry)) {
    if (id.startsWith("drafts.")) {
      const type = linkedEntry.sys.contentType.sys.id;
      return {
        _type: "reference",
        _ref: `drafts.${link.sys.id}`,
        _weak: !0,
        _strengthenOnPublish: {
          type,
          template: {
            id: type,
            params: {}
          }
        }
      };
    }
    return console.warn(`Link to draft entry with ID [${link.sys.id}]`), null;
  }
  return {
    _type: "reference",
    _ref: link.sys.id,
    _weak: options.weakRefs
  };
}
const coreTypes = [
  { name: "array", jsonType: "array", type: "type" },
  { name: "block", jsonType: "object", type: "type" },
  { name: "boolean", jsonType: "boolean", type: "type" },
  { name: "datetime", jsonType: "string", type: "type" },
  { name: "date", jsonType: "string", type: "type" },
  { name: "document", jsonType: "object", type: "type" },
  { name: "email", jsonType: "string", type: "type" },
  { name: "file", jsonType: "object", type: "type" },
  { name: "geopoint", jsonType: "object", type: "type" },
  { name: "image", jsonType: "object", type: "type" },
  { name: "number", jsonType: "number", type: "type" },
  { name: "object", jsonType: "object", type: "type" },
  { name: "reference", jsonType: "object", type: "type" },
  { name: "crossDatasetReference", jsonType: "object", type: "type" },
  { name: "slug", jsonType: "object", type: "type" },
  { name: "string", jsonType: "string", type: "type" },
  { name: "telephone", jsonType: "string", type: "type" },
  { name: "text", jsonType: "string", type: "type" },
  { name: "url", jsonType: "string", type: "type" }
], FUTURE_RESERVED = ["any", "time", "date"], isReservedName = (name) => {
  const coreTypeNames = coreTypes.map((typeDef) => typeDef.name), reservedTypeNames = FUTURE_RESERVED.concat(coreTypeNames);
  return name === "type" || reservedTypeNames.includes(name) || !!name.match(/^sanity|system\./);
}, contentfulTypeNameToSanityTypeName = (name) => {
  const isCollision = isReservedName(name), sanityTypeName = isCollision ? `contentful_${name}` : name;
  return {
    isCollision,
    name: sanityTypeName
  };
};
function buildI18nId(forId, locale, idStructure) {
  return idStructure === "subpath" ? `i18n.${forId}.${locale}` : `${forId}__i18n_${locale}`;
}
function createIntlFields(forId, locale, options) {
  const result = {
    __i18n_lang: locale
  };
  return locale === options.defaultLocale && (result.__i18n_refs = options.supportedLocales.filter((lang) => lang !== options.defaultLocale).map((lang) => ({
    _key: lang,
    _type: "reference",
    _ref: buildI18nId(forId, lang, options.idStructure)
  }))), locale !== options.defaultLocale && (result.__i18n_base = {
    _type: "reference",
    _ref: forId
  }), result;
}
function findEditorControlForField(fieldId, contentTypeId, data) {
  const editor = data.editorInterfaces?.find((ed) => ed.sys.contentType.sys.id === contentTypeId), control = editor?.controls?.find((ctrl) => ctrl.fieldId === fieldId);
  return editor && control ? control : null;
}
function generateKey(length = 8) {
  return crypto__default.default.randomBytes(length * 2).toString("base64").replace(/[^\da-z]/gi, "").slice(0, length);
}
const createFactoryProxy = (initialSchema) => {
  let clonedSchema = { ...initialSchema };
  const buildFn = (keys) => {
    const emptyKeysToOmit = Object.keys(clonedSchema).filter((key) => {
      const value = get__default.default(clonedSchema, key);
      return typeof value > "u" || value === null || Array.isArray(value) && value.length === 0 || typeof value == "object" && Object.keys(value).length === 0;
    });
    return omit__default.default(clonedSchema, [...keys ?? [], ...emptyKeysToOmit]);
  }, proxy = new Proxy({}, {
    get(target, prop) {
      if (prop !== "build" && prop !== "anonymous" && typeof prop == "string")
        return (value) => {
          if (typeof value > "u")
            clonedSchema = omit__default.default(clonedSchema, [prop]);
          else {
            if (typeof value == "object")
              for (const key in value)
                typeof value[key] > "u" && delete value[key];
            set__default.default(clonedSchema, prop, value);
          }
          return proxy;
        };
      if (prop === "build")
        return buildFn;
      if (prop === "anonymous")
        return () => buildFn(["name"]);
    }
  });
  return proxy;
}, numberFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "number"
}), stringFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "string"
}), textFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "text"
}), urlFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "url"
}), slugFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "slug"
}), geopointFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "geopoint"
}), booleanFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "boolean"
}), dateFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "date"
}), datetimeFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "datetime"
}), blockFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "block"
}), arrayFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "array",
  of: []
}), referenceFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "reference"
}), imageFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "image"
}), fileFieldSchemaFactory = (name) => createFactoryProxy({
  name,
  type: "file"
}), mockSchema = schema.Schema.compile({
  name: "default",
  types: [
    {
      name: "mock",
      type: "object",
      fields: [
        arrayFieldSchemaFactory("body").name("body").of([blockFieldSchemaFactory("block").build(), imageFieldSchemaFactory("image").build()]).build()
      ]
    }
  ]
}), blockContentType = mockSchema.get("mock").fields.find((field) => field.name === "body").type;
function markdownToBlocks(input) {
  const html = md__default.default({ html: !0 }).render(input);
  return blockTools.htmlToBlocks(html, blockContentType, {
    parseHtml: (parsedHtml) => new jsdom.JSDOM(parsedHtml).window.document,
    rules: [
      {
        deserialize(el, next, block) {
          if (isElement(el) && el.tagName === "P" && el.childNodes.length === 1) {
            const firstChildNode = el.childNodes[0];
            if (firstChildNode.tagName === "IMG") {
              const src = firstChildNode.getAttribute("src") ?? "";
              return block({
                _type: "image",
                _sanityAsset: `image@${src.replace(/^\/\//, "https://")}`
              });
            }
          }
        }
      }
    ]
  });
}
function isElement(node) {
  return node.nodeType === 1;
}
function objectIsContentfulLink(value) {
  return value && typeof value == "object" && "sys" in value && "type" in value.sys && value.sys.type === "Link";
}
function objectIsContentfulLocation(value) {
  return value && typeof value == "object" && typeof value.sys == "object" && "lat" in value && "lon" in value.sys;
}
function objectIsContentfulRichText(value) {
  return value && typeof value == "object" && "nodeType" in value && value.nodeType === "document";
}
function contentfulEntryToSanityObject(id, entry, locale, data, options) {
  let doc = {
    _id: id,
    _rev: entry.sys.id,
    _type: contentfulTypeNameToSanityTypeName(entry.sys.contentType.sys.id).name,
    _createdAt: entry.sys.createdAt,
    _updatedAt: entry.sys.updatedAt
  };
  options.useMultiLocale && (doc = {
    ...doc,
    ...createIntlFields(doc._id, locale, {
      idStructure: options.idStructure,
      defaultLocale: options.defaultLocale,
      supportedLocales: options.supportedLocales
    })
  });
  const fields = Object.entries(entry.fields);
  for (const [key, values] of fields) {
    const widgetId = findEditorControlForField(key, entry.sys.contentType.sys.id, data)?.widgetId, value = values[locale];
    if (typeof value == "string" || typeof value == "number" || typeof value == "boolean")
      widgetId === "slugEditor" ? doc[key] = { current: value } : widgetId === "markdown" && !options.keepMarkdown ? doc[key] = markdownToBlocks(String(value)) : doc[key] = value;
    else if (widgetId === "objectEditor" && typeof value == "object")
      doc[key] = JSON.stringify(value);
    else if (objectIsContentfulLink(value))
      doc[key] = contentfulLinkToSanityReference(id, value, locale, data, options);
    else if (objectIsContentfulLocation(value))
      doc[key] = {
        _type: "geopoint",
        lat: value.lat,
        lng: value.lon
      };
    else if (objectIsContentfulRichText(value)) {
      const referenceResolver = (node) => contentfulLinkToSanityReference(id, node.data.target, locale, data, options), transformers = {
        hr: () => [
          {
            _type: "break",
            _key: generateKey(),
            style: "lineBreak"
          }
        ],
        // Table nodes have no portable text equivalent — skip them gracefully.
        table: () => (console.warn(
          `Table content in rich text is not supported and will be skipped during migration.
  Entry ID: ${entry.sys.id}
  Content type: ${entry.sys.contentType.sys.id}
  Field: ${key}`
        ), []),
        "table-row": () => [],
        "table-header-cell": () => [],
        "table-cell": () => []
      };
      doc[key] = contentfulRichTextToPortableText.toPortableText(value, {
        generateKey: (node) => `k${objectHash__default.default(node).slice(0, 7)}`,
        referenceResolver,
        transformers
      });
    } else
      Array.isArray(value) && (doc[key] = compact__default.default(
        value.map((val) => objectIsContentfulLink(val) ? contentfulLinkToSanityReference(id, val, locale, data, options) : val)
      ));
  }
  return doc;
}
class ContentfulNoDefaultLocaleError extends Error {
  constructor() {
    super("No default locale found in Contentful export");
  }
}
class ContentfulNoLocalesError extends Error {
  constructor() {
    super("No importable locales defined");
  }
}
function localeDataFromExport(data, opts) {
  const useMultiLocale = opts.intlMode === "multiple", defaultLocale = data.locales?.find((locale) => !!locale.default);
  if (!defaultLocale)
    throw new ContentfulNoDefaultLocaleError();
  const localesToImport = (useMultiLocale ? (data.locales ?? []).map(({ code }) => code) : opts.locale ? [opts.locale] : compact__default.default([defaultLocale?.code])).filter((code) => data?.locales?.some((locale) => locale.code === code));
  if (!defaultLocale)
    throw new ContentfulNoDefaultLocaleError();
  if (localesToImport.length === 0)
    throw new ContentfulNoLocalesError();
  return {
    localesToImport,
    useMultiLocale,
    defaultLocale
  };
}
async function contentfulToDataset(exports$1, opts) {
  const data = exports$1.drafts;
  invariant__default.default(exports$1.drafts.entries, "Expected data.entries to be defined"), invariant__default.default(exports$1.drafts.entries.length > 0, "Expected data.entries to be defined");
  const { localesToImport, useMultiLocale, defaultLocale } = localeDataFromExport(data, opts), importableEntries = /* @__PURE__ */ new Set();
  for (const entry of exports$1.drafts.entries)
    for (const locale of localesToImport)
      if (isChanged(entry) || isDraft(entry) || isArchived(entry)) {
        const id = isArchived(entry) ? entry.sys.id : `drafts.${entry.sys.id}`, sanityObject = contentfulEntryToSanityObject(id, entry, locale, data, {
          useMultiLocale,
          idStructure: opts.intlIdStructure,
          defaultLocale: defaultLocale.code,
          supportedLocales: localesToImport,
          keepMarkdown: opts.keepMarkdown,
          weakRefs: opts.weakRefs
        });
        isArchived(entry) && (sanityObject.contentfulArchived = !0), importableEntries.add(sanityObject);
      }
  for (const entry of exports$1.published?.entries ?? [])
    for (const locale of localesToImport) {
      const id = entry.sys.id;
      importableEntries.add(
        contentfulEntryToSanityObject(id, entry, locale, data, {
          useMultiLocale,
          idStructure: opts.intlIdStructure,
          defaultLocale: defaultLocale.code,
          supportedLocales: localesToImport,
          keepMarkdown: opts.keepMarkdown,
          weakRefs: opts.weakRefs
        })
      );
    }
  return [
    {
      _id: "contentful.migration",
      _type: "contentful.migration",
      migratedAt: /* @__PURE__ */ new Date()
    },
    ...importableEntries
  ].map((entry) => JSON.stringify(entry)).join(`
`);
}
async function convertUnsupportedImages(dataset, exportDir, contentTypeLookup) {
  console.log("Converting images");
  const stream = new node_stream.Readable();
  stream.push(dataset), stream.push(null);
  const rl = readline__default.default.createInterface({
    input: stream,
    crlfDelay: 1 / 0
  }), assetsDir = path__default.default.join(exportDir, "assets");
  fs__default.default.existsSync(assetsDir) || fs__default.default.mkdirSync(assetsDir);
  const out = [];
  for await (const line of rl)
    try {
      const regex = /image@(https?:\/\/[^\s"]+)/g;
      let match, newLine = line.trim();
      for (; (match = regex.exec(line)) !== null; ) {
        const url = match[1];
        if (contentTypeLookup(url) === "image/avif") {
          const fileName = path__default.default.parse(url).name, filePath = path__default.default.join(exportDir, "assets", `${fileName}.png`);
          await fetch__default.default(url).then((res) => res.buffer()).then((buffer) => sharp__default.default(buffer).png().toFile(filePath)).then(() => newLine = newLine.replace(url, `file://${filePath}`)).catch((err) => {
            console.error(err);
          });
        }
      }
      out.push(newLine);
    } catch (err) {
      console.error(err);
    }
  return out.join(`
`);
}
async function optimizeSVG(dataset, exportDir) {
  console.log("Optimizing SVGs");
  const stream = new node_stream.Readable();
  stream.push(dataset), stream.push(null);
  const rl = readline__default.default.createInterface({
    input: stream,
    crlfDelay: 1 / 0
  }), assetsDir = path__default.default.join(exportDir, "assets");
  fs__default.default.existsSync(assetsDir) || fs__default.default.mkdirSync(assetsDir);
  const out = [];
  for await (const line of rl) {
    let newLine = line;
    try {
      const regex = /image@(https?:\/\/[^\s"]+\.svg)/g;
      let match;
      for (; (match = regex.exec(line)) !== null; ) {
        const svgUrl = match[1], response = await fetch__default.default(svgUrl);
        if (response.status === 200) {
          const svgArrayBuffer = await response.arrayBuffer(), svgBuffer = Buffer.from(svgArrayBuffer), svgFileName = svgUrl.substring(svgUrl.lastIndexOf("/") + 1), svgFilePath = path__default.default.join(exportDir, "assets", svgFileName);
          fs__default.default.writeFileSync(svgFilePath, svgBuffer);
          const svgFileContents = fs__default.default.readFileSync(svgFilePath, {
            encoding: "utf8"
          }), { data: optimizedSVG } = await svgo.optimize(svgFileContents);
          fs__default.default.writeFileSync(svgFilePath, optimizedSVG), newLine = newLine.replace(svgUrl, `file://${JSON.stringify(svgFilePath).slice(1, -1)}`);
        } else
          console.error(`Error fetching ${svgUrl}`, response.status);
      }
    } catch (err) {
      console.error(err);
    }
    out.push(newLine);
  }
  return out.join(`
`);
}
function expandHome(filePath) {
  if (filePath.charCodeAt(0) === 126) {
    if (filePath.charCodeAt(1) === 43)
      return path__default.default.join(process.cwd(), filePath.slice(2));
    const home = os__default.default.homedir();
    return home ? path__default.default.join(home, filePath.slice(1)) : filePath;
  }
  return filePath;
}
function absolutify(dir) {
  const pathName = expandHome(dir);
  return path__default.default.isAbsolute(pathName) ? pathName : path__default.default.resolve(process.cwd(), pathName);
}
function contentfulAssetUrlToContentType(url, assets, localeId) {
  const asset = assets.find((a) => {
    if (!a.fields.file)
      return !1;
    const assetUrl = a.fields.file[localeId].url;
    return assetUrl && prefixUrl(assetUrl) === prefixUrl(url);
  });
  if (asset)
    return asset?.fields.file[localeId].contentType;
  const extension = url.split(".").pop();
  if (extension)
    return `image/${extension}`;
}
async function datasetAction({
  exportDir: _exportDir,
  exportFile,
  intl: intlMode,
  datasetFile,
  weakRefs,
  keepMarkdown,
  optimizeSvgs,
  convertImages,
  intlIdStructure,
  locale
}) {
  const exportDir = absolutify(_exportDir);
  invariant__default.default(isAbsolutePath__default.default(exportDir), "exportDir must be an absolute path");
  const exportFilePath = path__default.default.join(exportDir, exportFile);
  invariant__default.default(
    isAbsolutePath__default.default(exportFilePath),
    `exportFilePath must be an absolute path: ${exportFilePath}`
  );
  const publishedExportFilePath = path__default.default.join(
    exportDir,
    path__default.default.parse(exportFile).name + ".published.json"
  ), datasetFilePath = path__default.default.join(exportDir, datasetFile);
  invariant__default.default(
    isAbsolutePath__default.default(datasetFilePath),
    `datasetFilePath must be an absolute path: ${datasetFilePath}`
  );
  const draftData = JSON.parse(await promises.readFile(exportFilePath, "utf8")), publishedData = JSON.parse(
    await promises.readFile(publishedExportFilePath, "utf8")
  ), convertedDataset = await contentfulToDataset(
    {
      drafts: draftData,
      published: publishedData
    },
    {
      intlMode,
      weakRefs,
      intlIdStructure,
      keepMarkdown,
      locale
    }
  );
  let dataset = convertedDataset;
  if (optimizeSvgs && (dataset = await optimizeSVG(convertedDataset, exportDir)), convertImages) {
    const { defaultLocale } = localeDataFromExport(draftData, {
      intlMode,
      locale
    });
    dataset = await convertUnsupportedImages(dataset, exportDir, (url) => {
      draftData.assets && contentfulAssetUrlToContentType(url, draftData.assets, defaultLocale.code);
      const ext = path__default.default.parse(url).ext;
      return ext ? `image/${ext.slice(1)}` : void 0;
    });
  }
  await promises.writeFile(datasetFilePath, dataset);
}
async function exportAction({
  exportDir: _exportDir,
  spaceId,
  accessToken,
  managementToken,
  environmentId,
  saveFile,
  exportFile
}) {
  const exportDir = absolutify(_exportDir);
  invariant__default.default(isAbsolutePath__default.default(exportDir), "exportDir must be an absolute path"), await mkdirp.mkdirp(exportDir);
  const options = {
    spaceId,
    managementToken,
    environmentId,
    skipContentModel: !1,
    skipEditorInterfaces: !1,
    includeDrafts: !0,
    includeArchived: !0,
    // If saveFile is false, then we're not exporting data, we're exporting what we need to generate a schema
    skipWebhooks: !0,
    skipRoles: !0,
    downloadAssets: !1,
    maxAllowedLimit: 250,
    contentFile: exportFile,
    // errorLogFile: `${exportFile}.error.log`,
    // Options related to exports to the filesystem, not relevant if used in a Remix loader and a pass-through export just
    // to preview the schema
    // saveFile: false,
    // skipConntent: true,
    exportDir,
    skipContent: !1,
    saveFile
  };
  await contentfulExport__default.default(options), await contentfulExport__default.default({
    ...options,
    //skipContentModel: true,
    //skipEditorInterfaces: true,
    includeDrafts: !1,
    includeArchived: !1,
    deliveryToken: accessToken,
    contentFile: path__default$1.default.parse(exportFile).name + ".published.json"
  });
}
var commonjsGlobal = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x.default : x;
}
function commonjsRequire(path2) {
  throw new Error('Could not dynamically require "' + path2 + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var moment$1 = { exports: {} };
(function(module2, exports$1) {
  (function(global2, factory) {
    module2.exports = factory();
  })(commonjsGlobal, function() {
    var hookCallback;
    function hooks() {
      return hookCallback.apply(null, arguments);
    }
    function setHookCallback(callback) {
      hookCallback = callback;
    }
    function isArray(input) {
      return input instanceof Array || Object.prototype.toString.call(input) === "[object Array]";
    }
    function isObject(input) {
      return input != null && Object.prototype.toString.call(input) === "[object Object]";
    }
    function hasOwnProp(a, b) {
      return Object.prototype.hasOwnProperty.call(a, b);
    }
    function isObjectEmpty(obj) {
      if (Object.getOwnPropertyNames)
        return Object.getOwnPropertyNames(obj).length === 0;
      var k;
      for (k in obj)
        if (hasOwnProp(obj, k))
          return !1;
      return !0;
    }
    function isUndefined(input) {
      return input === void 0;
    }
    function isNumber(input) {
      return typeof input == "number" || Object.prototype.toString.call(input) === "[object Number]";
    }
    function isDate(input) {
      return input instanceof Date || Object.prototype.toString.call(input) === "[object Date]";
    }
    function map(arr, fn) {
      var res = [], i, arrLen = arr.length;
      for (i = 0; i < arrLen; ++i)
        res.push(fn(arr[i], i));
      return res;
    }
    function extend(a, b) {
      for (var i in b)
        hasOwnProp(b, i) && (a[i] = b[i]);
      return hasOwnProp(b, "toString") && (a.toString = b.toString), hasOwnProp(b, "valueOf") && (a.valueOf = b.valueOf), a;
    }
    function createUTC(input, format2, locale2, strict) {
      return createLocalOrUTC(input, format2, locale2, strict, !0).utc();
    }
    function defaultParsingFlags() {
      return {
        empty: !1,
        unusedTokens: [],
        unusedInput: [],
        overflow: -2,
        charsLeftOver: 0,
        nullInput: !1,
        invalidEra: null,
        invalidMonth: null,
        invalidFormat: !1,
        userInvalidated: !1,
        iso: !1,
        parsedDateParts: [],
        era: null,
        meridiem: null,
        rfc2822: !1,
        weekdayMismatch: !1
      };
    }
    function getParsingFlags(m) {
      return m._pf == null && (m._pf = defaultParsingFlags()), m._pf;
    }
    var some;
    Array.prototype.some ? some = Array.prototype.some : some = function(fun) {
      var t = Object(this), len = t.length >>> 0, i;
      for (i = 0; i < len; i++)
        if (i in t && fun.call(this, t[i], i, t))
          return !0;
      return !1;
    };
    function isValid(m) {
      var flags = null, parsedParts = !1, isNowValid = m._d && !isNaN(m._d.getTime());
      if (isNowValid && (flags = getParsingFlags(m), parsedParts = some.call(flags.parsedDateParts, function(i) {
        return i != null;
      }), isNowValid = flags.overflow < 0 && !flags.empty && !flags.invalidEra && !flags.invalidMonth && !flags.invalidWeekday && !flags.weekdayMismatch && !flags.nullInput && !flags.invalidFormat && !flags.userInvalidated && (!flags.meridiem || flags.meridiem && parsedParts), m._strict && (isNowValid = isNowValid && flags.charsLeftOver === 0 && flags.unusedTokens.length === 0 && flags.bigHour === void 0)), Object.isFrozen == null || !Object.isFrozen(m))
        m._isValid = isNowValid;
      else
        return isNowValid;
      return m._isValid;
    }
    function createInvalid(flags) {
      var m = createUTC(NaN);
      return flags != null ? extend(getParsingFlags(m), flags) : getParsingFlags(m).userInvalidated = !0, m;
    }
    var momentProperties = hooks.momentProperties = [], updateInProgress = !1;
    function copyConfig(to2, from2) {
      var i, prop, val, momentPropertiesLen = momentProperties.length;
      if (isUndefined(from2._isAMomentObject) || (to2._isAMomentObject = from2._isAMomentObject), isUndefined(from2._i) || (to2._i = from2._i), isUndefined(from2._f) || (to2._f = from2._f), isUndefined(from2._l) || (to2._l = from2._l), isUndefined(from2._strict) || (to2._strict = from2._strict), isUndefined(from2._tzm) || (to2._tzm = from2._tzm), isUndefined(from2._isUTC) || (to2._isUTC = from2._isUTC), isUndefined(from2._offset) || (to2._offset = from2._offset), isUndefined(from2._pf) || (to2._pf = getParsingFlags(from2)), isUndefined(from2._locale) || (to2._locale = from2._locale), momentPropertiesLen > 0)
        for (i = 0; i < momentPropertiesLen; i++)
          prop = momentProperties[i], val = from2[prop], isUndefined(val) || (to2[prop] = val);
      return to2;
    }
    function Moment(config) {
      copyConfig(this, config), this._d = new Date(config._d != null ? config._d.getTime() : NaN), this.isValid() || (this._d = /* @__PURE__ */ new Date(NaN)), updateInProgress === !1 && (updateInProgress = !0, hooks.updateOffset(this), updateInProgress = !1);
    }
    function isMoment(obj) {
      return obj instanceof Moment || obj != null && obj._isAMomentObject != null;
    }
    function warn(msg) {
      hooks.suppressDeprecationWarnings === !1 && typeof console < "u" && console.warn && console.warn("Deprecation warning: " + msg);
    }
    function deprecate(msg, fn) {
      var firstTime = !0;
      return extend(function() {
        if (hooks.deprecationHandler != null && hooks.deprecationHandler(null, msg), firstTime) {
          var args = [], arg, i, key, argLen = arguments.length;
          for (i = 0; i < argLen; i++) {
            if (arg = "", typeof arguments[i] == "object") {
              arg += `
[` + i + "] ";
              for (key in arguments[0])
                hasOwnProp(arguments[0], key) && (arg += key + ": " + arguments[0][key] + ", ");
              arg = arg.slice(0, -2);
            } else
              arg = arguments[i];
            args.push(arg);
          }
          warn(
            msg + `
Arguments: ` + Array.prototype.slice.call(args).join("") + `
` + new Error().stack
          ), firstTime = !1;
        }
        return fn.apply(this, arguments);
      }, fn);
    }
    var deprecations = {};
    function deprecateSimple(name, msg) {
      hooks.deprecationHandler != null && hooks.deprecationHandler(name, msg), deprecations[name] || (warn(msg), deprecations[name] = !0);
    }
    hooks.suppressDeprecationWarnings = !1, hooks.deprecationHandler = null;
    function isFunction(input) {
      return typeof Function < "u" && input instanceof Function || Object.prototype.toString.call(input) === "[object Function]";
    }
    function set2(config) {
      var prop, i;
      for (i in config)
        hasOwnProp(config, i) && (prop = config[i], isFunction(prop) ? this[i] = prop : this["_" + i] = prop);
      this._config = config, this._dayOfMonthOrdinalParseLenient = new RegExp(
        (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + "|" + /\d{1,2}/.source
      );
    }
    function mergeConfigs(parentConfig, childConfig) {
      var res = extend({}, parentConfig), prop;
      for (prop in childConfig)
        hasOwnProp(childConfig, prop) && (isObject(parentConfig[prop]) && isObject(childConfig[prop]) ? (res[prop] = {}, extend(res[prop], parentConfig[prop]), extend(res[prop], childConfig[prop])) : childConfig[prop] != null ? res[prop] = childConfig[prop] : delete res[prop]);
      for (prop in parentConfig)
        hasOwnProp(parentConfig, prop) && !hasOwnProp(childConfig, prop) && isObject(parentConfig[prop]) && (res[prop] = extend({}, res[prop]));
      return res;
    }
    function Locale(config) {
      config != null && this.set(config);
    }
    var keys;
    Object.keys ? keys = Object.keys : keys = function(obj) {
      var i, res = [];
      for (i in obj)
        hasOwnProp(obj, i) && res.push(i);
      return res;
    };
    var defaultCalendar = {
      sameDay: "[Today at] LT",
      nextDay: "[Tomorrow at] LT",
      nextWeek: "dddd [at] LT",
      lastDay: "[Yesterday at] LT",
      lastWeek: "[Last] dddd [at] LT",
      sameElse: "L"
    };
    function calendar(key, mom, now2) {
      var output = this._calendar[key] || this._calendar.sameElse;
      return isFunction(output) ? output.call(mom, now2) : output;
    }
    function zeroFill(number, targetLength, forceSign) {
      var absNumber = "" + Math.abs(number), zerosToFill = targetLength - absNumber.length, sign2 = number >= 0;
      return (sign2 ? forceSign ? "+" : "" : "-") + Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }
    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g, localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, formatFunctions = {}, formatTokenFunctions = {};
    function addFormatToken(token2, padded, ordinal2, callback) {
      var func = callback;
      typeof callback == "string" && (func = function() {
        return this[callback]();
      }), token2 && (formatTokenFunctions[token2] = func), padded && (formatTokenFunctions[padded[0]] = function() {
        return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
      }), ordinal2 && (formatTokenFunctions[ordinal2] = function() {
        return this.localeData().ordinal(
          func.apply(this, arguments),
          token2
        );
      });
    }
    function removeFormattingTokens(input) {
      return input.match(/\[[\s\S]/) ? input.replace(/^\[|\]$/g, "") : input.replace(/\\/g, "");
    }
    function makeFormatFunction(format2) {
      var array = format2.match(formattingTokens), i, length;
      for (i = 0, length = array.length; i < length; i++)
        formatTokenFunctions[array[i]] ? array[i] = formatTokenFunctions[array[i]] : array[i] = removeFormattingTokens(array[i]);
      return function(mom) {
        var output = "", i2;
        for (i2 = 0; i2 < length; i2++)
          output += isFunction(array[i2]) ? array[i2].call(mom, format2) : array[i2];
        return output;
      };
    }
    function formatMoment(m, format2) {
      return m.isValid() ? (format2 = expandFormat(format2, m.localeData()), formatFunctions[format2] = formatFunctions[format2] || makeFormatFunction(format2), formatFunctions[format2](m)) : m.localeData().invalidDate();
    }
    function expandFormat(format2, locale2) {
      var i = 5;
      function replaceLongDateFormatTokens(input) {
        return locale2.longDateFormat(input) || input;
      }
      for (localFormattingTokens.lastIndex = 0; i >= 0 && localFormattingTokens.test(format2); )
        format2 = format2.replace(
          localFormattingTokens,
          replaceLongDateFormatTokens
        ), localFormattingTokens.lastIndex = 0, i -= 1;
      return format2;
    }
    var defaultLongDateFormat = {
      LTS: "h:mm:ss A",
      LT: "h:mm A",
      L: "MM/DD/YYYY",
      LL: "MMMM D, YYYY",
      LLL: "MMMM D, YYYY h:mm A",
      LLLL: "dddd, MMMM D, YYYY h:mm A"
    };
    function longDateFormat(key) {
      var format2 = this._longDateFormat[key], formatUpper = this._longDateFormat[key.toUpperCase()];
      return format2 || !formatUpper ? format2 : (this._longDateFormat[key] = formatUpper.match(formattingTokens).map(function(tok) {
        return tok === "MMMM" || tok === "MM" || tok === "DD" || tok === "dddd" ? tok.slice(1) : tok;
      }).join(""), this._longDateFormat[key]);
    }
    var defaultInvalidDate = "Invalid date";
    function invalidDate() {
      return this._invalidDate;
    }
    var defaultOrdinal = "%d", defaultDayOfMonthOrdinalParse = /\d{1,2}/;
    function ordinal(number) {
      return this._ordinal.replace("%d", number);
    }
    var defaultRelativeTime = {
      future: "in %s",
      past: "%s ago",
      s: "a few seconds",
      ss: "%d seconds",
      m: "a minute",
      mm: "%d minutes",
      h: "an hour",
      hh: "%d hours",
      d: "a day",
      dd: "%d days",
      w: "a week",
      ww: "%d weeks",
      M: "a month",
      MM: "%d months",
      y: "a year",
      yy: "%d years"
    };
    function relativeTime(number, withoutSuffix, string, isFuture) {
      var output = this._relativeTime[string];
      return isFunction(output) ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
    }
    function pastFuture(diff2, output) {
      var format2 = this._relativeTime[diff2 > 0 ? "future" : "past"];
      return isFunction(format2) ? format2(output) : format2.replace(/%s/i, output);
    }
    var aliases = {
      D: "date",
      dates: "date",
      date: "date",
      d: "day",
      days: "day",
      day: "day",
      e: "weekday",
      weekdays: "weekday",
      weekday: "weekday",
      E: "isoWeekday",
      isoweekdays: "isoWeekday",
      isoweekday: "isoWeekday",
      DDD: "dayOfYear",
      dayofyears: "dayOfYear",
      dayofyear: "dayOfYear",
      h: "hour",
      hours: "hour",
      hour: "hour",
      ms: "millisecond",
      milliseconds: "millisecond",
      millisecond: "millisecond",
      m: "minute",
      minutes: "minute",
      minute: "minute",
      M: "month",
      months: "month",
      month: "month",
      Q: "quarter",
      quarters: "quarter",
      quarter: "quarter",
      s: "second",
      seconds: "second",
      second: "second",
      gg: "weekYear",
      weekyears: "weekYear",
      weekyear: "weekYear",
      GG: "isoWeekYear",
      isoweekyears: "isoWeekYear",
      isoweekyear: "isoWeekYear",
      w: "week",
      weeks: "week",
      week: "week",
      W: "isoWeek",
      isoweeks: "isoWeek",
      isoweek: "isoWeek",
      y: "year",
      years: "year",
      year: "year"
    };
    function normalizeUnits(units) {
      return typeof units == "string" ? aliases[units] || aliases[units.toLowerCase()] : void 0;
    }
    function normalizeObjectUnits(inputObject) {
      var normalizedInput = {}, normalizedProp, prop;
      for (prop in inputObject)
        hasOwnProp(inputObject, prop) && (normalizedProp = normalizeUnits(prop), normalizedProp && (normalizedInput[normalizedProp] = inputObject[prop]));
      return normalizedInput;
    }
    var priorities = {
      date: 9,
      day: 11,
      weekday: 11,
      isoWeekday: 11,
      dayOfYear: 4,
      hour: 13,
      millisecond: 16,
      minute: 14,
      month: 8,
      quarter: 7,
      second: 15,
      weekYear: 1,
      isoWeekYear: 1,
      week: 5,
      isoWeek: 5,
      year: 1
    };
    function getPrioritizedUnits(unitsObj) {
      var units = [], u;
      for (u in unitsObj)
        hasOwnProp(unitsObj, u) && units.push({ unit: u, priority: priorities[u] });
      return units.sort(function(a, b) {
        return a.priority - b.priority;
      }), units;
    }
    var match1 = /\d/, match2 = /\d\d/, match3 = /\d{3}/, match4 = /\d{4}/, match6 = /[+-]?\d{6}/, match1to2 = /\d\d?/, match3to4 = /\d\d\d\d?/, match5to6 = /\d\d\d\d\d\d?/, match1to3 = /\d{1,3}/, match1to4 = /\d{1,4}/, match1to6 = /[+-]?\d{1,6}/, matchUnsigned = /\d+/, matchSigned = /[+-]?\d+/, matchOffset = /Z|[+-]\d\d:?\d\d/gi, matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i, match1to2NoLeadingZero = /^[1-9]\d?/, match1to2HasZero = /^([1-9]\d|\d)/, regexes;
    regexes = {};
    function addRegexToken(token2, regex, strictRegex) {
      regexes[token2] = isFunction(regex) ? regex : function(isStrict, localeData2) {
        return isStrict && strictRegex ? strictRegex : regex;
      };
    }
    function getParseRegexForToken(token2, config) {
      return hasOwnProp(regexes, token2) ? regexes[token2](config._strict, config._locale) : new RegExp(unescapeFormat(token2));
    }
    function unescapeFormat(s) {
      return regexEscape(
        s.replace("\\", "").replace(
          /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
          function(matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
          }
        )
      );
    }
    function regexEscape(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
    function absFloor(number) {
      return number < 0 ? Math.ceil(number) || 0 : Math.floor(number);
    }
    function toInt(argumentForCoercion) {
      var coercedNumber = +argumentForCoercion, value = 0;
      return coercedNumber !== 0 && isFinite(coercedNumber) && (value = absFloor(coercedNumber)), value;
    }
    var tokens = {};
    function addParseToken(token2, callback) {
      var i, func = callback, tokenLen;
      for (typeof token2 == "string" && (token2 = [token2]), isNumber(callback) && (func = function(input, array) {
        array[callback] = toInt(input);
      }), tokenLen = token2.length, i = 0; i < tokenLen; i++)
        tokens[token2[i]] = func;
    }
    function addWeekParseToken(token2, callback) {
      addParseToken(token2, function(input, array, config, token3) {
        config._w = config._w || {}, callback(input, config._w, config, token3);
      });
    }
    function addTimeToArrayFromToken(token2, input, config) {
      input != null && hasOwnProp(tokens, token2) && tokens[token2](input, config._a, config, token2);
    }
    function isLeapYear(year) {
      return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    }
    var YEAR = 0, MONTH = 1, DATE = 2, HOUR = 3, MINUTE = 4, SECOND = 5, MILLISECOND = 6, WEEK = 7, WEEKDAY = 8;
    addFormatToken("Y", 0, 0, function() {
      var y = this.year();
      return y <= 9999 ? zeroFill(y, 4) : "+" + y;
    }), addFormatToken(0, ["YY", 2], 0, function() {
      return this.year() % 100;
    }), addFormatToken(0, ["YYYY", 4], 0, "year"), addFormatToken(0, ["YYYYY", 5], 0, "year"), addFormatToken(0, ["YYYYYY", 6, !0], 0, "year"), addRegexToken("Y", matchSigned), addRegexToken("YY", match1to2, match2), addRegexToken("YYYY", match1to4, match4), addRegexToken("YYYYY", match1to6, match6), addRegexToken("YYYYYY", match1to6, match6), addParseToken(["YYYYY", "YYYYYY"], YEAR), addParseToken("YYYY", function(input, array) {
      array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    }), addParseToken("YY", function(input, array) {
      array[YEAR] = hooks.parseTwoDigitYear(input);
    }), addParseToken("Y", function(input, array) {
      array[YEAR] = parseInt(input, 10);
    });
    function daysInYear(year) {
      return isLeapYear(year) ? 366 : 365;
    }
    hooks.parseTwoDigitYear = function(input) {
      return toInt(input) + (toInt(input) > 68 ? 1900 : 2e3);
    };
    var getSetYear = makeGetSet("FullYear", !0);
    function getIsLeapYear() {
      return isLeapYear(this.year());
    }
    function makeGetSet(unit, keepTime) {
      return function(value) {
        return value != null ? (set$1(this, unit, value), hooks.updateOffset(this, keepTime), this) : get2(this, unit);
      };
    }
    function get2(mom, unit) {
      if (!mom.isValid())
        return NaN;
      var d = mom._d, isUTC = mom._isUTC;
      switch (unit) {
        case "Milliseconds":
          return isUTC ? d.getUTCMilliseconds() : d.getMilliseconds();
        case "Seconds":
          return isUTC ? d.getUTCSeconds() : d.getSeconds();
        case "Minutes":
          return isUTC ? d.getUTCMinutes() : d.getMinutes();
        case "Hours":
          return isUTC ? d.getUTCHours() : d.getHours();
        case "Date":
          return isUTC ? d.getUTCDate() : d.getDate();
        case "Day":
          return isUTC ? d.getUTCDay() : d.getDay();
        case "Month":
          return isUTC ? d.getUTCMonth() : d.getMonth();
        case "FullYear":
          return isUTC ? d.getUTCFullYear() : d.getFullYear();
        default:
          return NaN;
      }
    }
    function set$1(mom, unit, value) {
      var d, isUTC, year, month, date;
      if (!(!mom.isValid() || isNaN(value))) {
        switch (d = mom._d, isUTC = mom._isUTC, unit) {
          case "Milliseconds":
            return void (isUTC ? d.setUTCMilliseconds(value) : d.setMilliseconds(value));
          case "Seconds":
            return void (isUTC ? d.setUTCSeconds(value) : d.setSeconds(value));
          case "Minutes":
            return void (isUTC ? d.setUTCMinutes(value) : d.setMinutes(value));
          case "Hours":
            return void (isUTC ? d.setUTCHours(value) : d.setHours(value));
          case "Date":
            return void (isUTC ? d.setUTCDate(value) : d.setDate(value));
          case "FullYear":
            break;
          default:
            return;
        }
        year = value, month = mom.month(), date = mom.date(), date = date === 29 && month === 1 && !isLeapYear(year) ? 28 : date, isUTC ? d.setUTCFullYear(year, month, date) : d.setFullYear(year, month, date);
      }
    }
    function stringGet(units) {
      return units = normalizeUnits(units), isFunction(this[units]) ? this[units]() : this;
    }
    function stringSet(units, value) {
      if (typeof units == "object") {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units), i, prioritizedLen = prioritized.length;
        for (i = 0; i < prioritizedLen; i++)
          this[prioritized[i].unit](units[prioritized[i].unit]);
      } else if (units = normalizeUnits(units), isFunction(this[units]))
        return this[units](value);
      return this;
    }
    function mod(n, x) {
      return (n % x + x) % x;
    }
    var indexOf;
    Array.prototype.indexOf ? indexOf = Array.prototype.indexOf : indexOf = function(o) {
      var i;
      for (i = 0; i < this.length; ++i)
        if (this[i] === o)
          return i;
      return -1;
    };
    function daysInMonth(year, month) {
      if (isNaN(year) || isNaN(month))
        return NaN;
      var modMonth = mod(month, 12);
      return year += (month - modMonth) / 12, modMonth === 1 ? isLeapYear(year) ? 29 : 28 : 31 - modMonth % 7 % 2;
    }
    addFormatToken("M", ["MM", 2], "Mo", function() {
      return this.month() + 1;
    }), addFormatToken("MMM", 0, 0, function(format2) {
      return this.localeData().monthsShort(this, format2);
    }), addFormatToken("MMMM", 0, 0, function(format2) {
      return this.localeData().months(this, format2);
    }), addRegexToken("M", match1to2, match1to2NoLeadingZero), addRegexToken("MM", match1to2, match2), addRegexToken("MMM", function(isStrict, locale2) {
      return locale2.monthsShortRegex(isStrict);
    }), addRegexToken("MMMM", function(isStrict, locale2) {
      return locale2.monthsRegex(isStrict);
    }), addParseToken(["M", "MM"], function(input, array) {
      array[MONTH] = toInt(input) - 1;
    }), addParseToken(["MMM", "MMMM"], function(input, array, config, token2) {
      var month = config._locale.monthsParse(input, token2, config._strict);
      month != null ? array[MONTH] = month : getParsingFlags(config).invalidMonth = input;
    });
    var defaultLocaleMonths = "January_February_March_April_May_June_July_August_September_October_November_December".split(
      "_"
    ), defaultLocaleMonthsShort = "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"), MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/, defaultMonthsShortRegex = matchWord, defaultMonthsRegex = matchWord;
    function localeMonths(m, format2) {
      return m ? isArray(this._months) ? this._months[m.month()] : this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format2) ? "format" : "standalone"][m.month()] : isArray(this._months) ? this._months : this._months.standalone;
    }
    function localeMonthsShort(m, format2) {
      return m ? isArray(this._monthsShort) ? this._monthsShort[m.month()] : this._monthsShort[MONTHS_IN_FORMAT.test(format2) ? "format" : "standalone"][m.month()] : isArray(this._monthsShort) ? this._monthsShort : this._monthsShort.standalone;
    }
    function handleStrictParse(monthName, format2, strict) {
      var i, ii, mom, llc = monthName.toLocaleLowerCase();
      if (!this._monthsParse)
        for (this._monthsParse = [], this._longMonthsParse = [], this._shortMonthsParse = [], i = 0; i < 12; ++i)
          mom = createUTC([2e3, i]), this._shortMonthsParse[i] = this.monthsShort(
            mom,
            ""
          ).toLocaleLowerCase(), this._longMonthsParse[i] = this.months(mom, "").toLocaleLowerCase();
      return strict ? format2 === "MMM" ? (ii = indexOf.call(this._shortMonthsParse, llc), ii !== -1 ? ii : null) : (ii = indexOf.call(this._longMonthsParse, llc), ii !== -1 ? ii : null) : format2 === "MMM" ? (ii = indexOf.call(this._shortMonthsParse, llc), ii !== -1 ? ii : (ii = indexOf.call(this._longMonthsParse, llc), ii !== -1 ? ii : null)) : (ii = indexOf.call(this._longMonthsParse, llc), ii !== -1 ? ii : (ii = indexOf.call(this._shortMonthsParse, llc), ii !== -1 ? ii : null));
    }
    function localeMonthsParse(monthName, format2, strict) {
      var i, mom, regex;
      if (this._monthsParseExact)
        return handleStrictParse.call(this, monthName, format2, strict);
      for (this._monthsParse || (this._monthsParse = [], this._longMonthsParse = [], this._shortMonthsParse = []), i = 0; i < 12; i++) {
        if (mom = createUTC([2e3, i]), strict && !this._longMonthsParse[i] && (this._longMonthsParse[i] = new RegExp(
          "^" + this.months(mom, "").replace(".", "") + "$",
          "i"
        ), this._shortMonthsParse[i] = new RegExp(
          "^" + this.monthsShort(mom, "").replace(".", "") + "$",
          "i"
        )), !strict && !this._monthsParse[i] && (regex = "^" + this.months(mom, "") + "|^" + this.monthsShort(mom, ""), this._monthsParse[i] = new RegExp(regex.replace(".", ""), "i")), strict && format2 === "MMMM" && this._longMonthsParse[i].test(monthName))
          return i;
        if (strict && format2 === "MMM" && this._shortMonthsParse[i].test(monthName))
          return i;
        if (!strict && this._monthsParse[i].test(monthName))
          return i;
      }
    }
    function setMonth(mom, value) {
      if (!mom.isValid())
        return mom;
      if (typeof value == "string") {
        if (/^\d+$/.test(value))
          value = toInt(value);
        else if (value = mom.localeData().monthsParse(value), !isNumber(value))
          return mom;
      }
      var month = value, date = mom.date();
      return date = date < 29 ? date : Math.min(date, daysInMonth(mom.year(), month)), mom._isUTC ? mom._d.setUTCMonth(month, date) : mom._d.setMonth(month, date), mom;
    }
    function getSetMonth(value) {
      return value != null ? (setMonth(this, value), hooks.updateOffset(this, !0), this) : get2(this, "Month");
    }
    function getDaysInMonth() {
      return daysInMonth(this.year(), this.month());
    }
    function monthsShortRegex(isStrict) {
      return this._monthsParseExact ? (hasOwnProp(this, "_monthsRegex") || computeMonthsParse.call(this), isStrict ? this._monthsShortStrictRegex : this._monthsShortRegex) : (hasOwnProp(this, "_monthsShortRegex") || (this._monthsShortRegex = defaultMonthsShortRegex), this._monthsShortStrictRegex && isStrict ? this._monthsShortStrictRegex : this._monthsShortRegex);
    }
    function monthsRegex(isStrict) {
      return this._monthsParseExact ? (hasOwnProp(this, "_monthsRegex") || computeMonthsParse.call(this), isStrict ? this._monthsStrictRegex : this._monthsRegex) : (hasOwnProp(this, "_monthsRegex") || (this._monthsRegex = defaultMonthsRegex), this._monthsStrictRegex && isStrict ? this._monthsStrictRegex : this._monthsRegex);
    }
    function computeMonthsParse() {
      function cmpLenRev(a, b) {
        return b.length - a.length;
      }
      var shortPieces = [], longPieces = [], mixedPieces = [], i, mom, shortP, longP;
      for (i = 0; i < 12; i++)
        mom = createUTC([2e3, i]), shortP = regexEscape(this.monthsShort(mom, "")), longP = regexEscape(this.months(mom, "")), shortPieces.push(shortP), longPieces.push(longP), mixedPieces.push(longP), mixedPieces.push(shortP);
      shortPieces.sort(cmpLenRev), longPieces.sort(cmpLenRev), mixedPieces.sort(cmpLenRev), this._monthsRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i"), this._monthsShortRegex = this._monthsRegex, this._monthsStrictRegex = new RegExp(
        "^(" + longPieces.join("|") + ")",
        "i"
      ), this._monthsShortStrictRegex = new RegExp(
        "^(" + shortPieces.join("|") + ")",
        "i"
      );
    }
    function createDate(y, m, d, h, M, s, ms) {
      var date;
      return y < 100 && y >= 0 ? (date = new Date(y + 400, m, d, h, M, s, ms), isFinite(date.getFullYear()) && date.setFullYear(y)) : date = new Date(y, m, d, h, M, s, ms), date;
    }
    function createUTCDate(y) {
      var date, args;
      return y < 100 && y >= 0 ? (args = Array.prototype.slice.call(arguments), args[0] = y + 400, date = new Date(Date.UTC.apply(null, args)), isFinite(date.getUTCFullYear()) && date.setUTCFullYear(y)) : date = new Date(Date.UTC.apply(null, arguments)), date;
    }
    function firstWeekOffset(year, dow, doy) {
      var fwd = 7 + dow - doy, fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;
      return -fwdlw + fwd - 1;
    }
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
      var localWeekday = (7 + weekday - dow) % 7, weekOffset = firstWeekOffset(year, dow, doy), dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset, resYear, resDayOfYear;
      return dayOfYear <= 0 ? (resYear = year - 1, resDayOfYear = daysInYear(resYear) + dayOfYear) : dayOfYear > daysInYear(year) ? (resYear = year + 1, resDayOfYear = dayOfYear - daysInYear(year)) : (resYear = year, resDayOfYear = dayOfYear), {
        year: resYear,
        dayOfYear: resDayOfYear
      };
    }
    function weekOfYear(mom, dow, doy) {
      var weekOffset = firstWeekOffset(mom.year(), dow, doy), week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1, resWeek, resYear;
      return week < 1 ? (resYear = mom.year() - 1, resWeek = week + weeksInYear(resYear, dow, doy)) : week > weeksInYear(mom.year(), dow, doy) ? (resWeek = week - weeksInYear(mom.year(), dow, doy), resYear = mom.year() + 1) : (resYear = mom.year(), resWeek = week), {
        week: resWeek,
        year: resYear
      };
    }
    function weeksInYear(year, dow, doy) {
      var weekOffset = firstWeekOffset(year, dow, doy), weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
      return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }
    addFormatToken("w", ["ww", 2], "wo", "week"), addFormatToken("W", ["WW", 2], "Wo", "isoWeek"), addRegexToken("w", match1to2, match1to2NoLeadingZero), addRegexToken("ww", match1to2, match2), addRegexToken("W", match1to2, match1to2NoLeadingZero), addRegexToken("WW", match1to2, match2), addWeekParseToken(
      ["w", "ww", "W", "WW"],
      function(input, week, config, token2) {
        week[token2.substr(0, 1)] = toInt(input);
      }
    );
    function localeWeek(mom) {
      return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }
    var defaultLocaleWeek = {
      dow: 0,
      // Sunday is the first day of the week.
      doy: 6
      // The week that contains Jan 6th is the first week of the year.
    };
    function localeFirstDayOfWeek() {
      return this._week.dow;
    }
    function localeFirstDayOfYear() {
      return this._week.doy;
    }
    function getSetWeek(input) {
      var week = this.localeData().week(this);
      return input == null ? week : this.add((input - week) * 7, "d");
    }
    function getSetISOWeek(input) {
      var week = weekOfYear(this, 1, 4).week;
      return input == null ? week : this.add((input - week) * 7, "d");
    }
    addFormatToken("d", 0, "do", "day"), addFormatToken("dd", 0, 0, function(format2) {
      return this.localeData().weekdaysMin(this, format2);
    }), addFormatToken("ddd", 0, 0, function(format2) {
      return this.localeData().weekdaysShort(this, format2);
    }), addFormatToken("dddd", 0, 0, function(format2) {
      return this.localeData().weekdays(this, format2);
    }), addFormatToken("e", 0, 0, "weekday"), addFormatToken("E", 0, 0, "isoWeekday"), addRegexToken("d", match1to2), addRegexToken("e", match1to2), addRegexToken("E", match1to2), addRegexToken("dd", function(isStrict, locale2) {
      return locale2.weekdaysMinRegex(isStrict);
    }), addRegexToken("ddd", function(isStrict, locale2) {
      return locale2.weekdaysShortRegex(isStrict);
    }), addRegexToken("dddd", function(isStrict, locale2) {
      return locale2.weekdaysRegex(isStrict);
    }), addWeekParseToken(["dd", "ddd", "dddd"], function(input, week, config, token2) {
      var weekday = config._locale.weekdaysParse(input, token2, config._strict);
      weekday != null ? week.d = weekday : getParsingFlags(config).invalidWeekday = input;
    }), addWeekParseToken(["d", "e", "E"], function(input, week, config, token2) {
      week[token2] = toInt(input);
    });
    function parseWeekday(input, locale2) {
      return typeof input != "string" ? input : isNaN(input) ? (input = locale2.weekdaysParse(input), typeof input == "number" ? input : null) : parseInt(input, 10);
    }
    function parseIsoWeekday(input, locale2) {
      return typeof input == "string" ? locale2.weekdaysParse(input) % 7 || 7 : isNaN(input) ? null : input;
    }
    function shiftWeekdays(ws, n) {
      return ws.slice(n, 7).concat(ws.slice(0, n));
    }
    var defaultLocaleWeekdays = "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"), defaultLocaleWeekdaysShort = "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"), defaultLocaleWeekdaysMin = "Su_Mo_Tu_We_Th_Fr_Sa".split("_"), defaultWeekdaysRegex = matchWord, defaultWeekdaysShortRegex = matchWord, defaultWeekdaysMinRegex = matchWord;
    function localeWeekdays(m, format2) {
      var weekdays = isArray(this._weekdays) ? this._weekdays : this._weekdays[m && m !== !0 && this._weekdays.isFormat.test(format2) ? "format" : "standalone"];
      return m === !0 ? shiftWeekdays(weekdays, this._week.dow) : m ? weekdays[m.day()] : weekdays;
    }
    function localeWeekdaysShort(m) {
      return m === !0 ? shiftWeekdays(this._weekdaysShort, this._week.dow) : m ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }
    function localeWeekdaysMin(m) {
      return m === !0 ? shiftWeekdays(this._weekdaysMin, this._week.dow) : m ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }
    function handleStrictParse$1(weekdayName, format2, strict) {
      var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
      if (!this._weekdaysParse)
        for (this._weekdaysParse = [], this._shortWeekdaysParse = [], this._minWeekdaysParse = [], i = 0; i < 7; ++i)
          mom = createUTC([2e3, 1]).day(i), this._minWeekdaysParse[i] = this.weekdaysMin(
            mom,
            ""
          ).toLocaleLowerCase(), this._shortWeekdaysParse[i] = this.weekdaysShort(
            mom,
            ""
          ).toLocaleLowerCase(), this._weekdaysParse[i] = this.weekdays(mom, "").toLocaleLowerCase();
      return strict ? format2 === "dddd" ? (ii = indexOf.call(this._weekdaysParse, llc), ii !== -1 ? ii : null) : format2 === "ddd" ? (ii = indexOf.call(this._shortWeekdaysParse, llc), ii !== -1 ? ii : null) : (ii = indexOf.call(this._minWeekdaysParse, llc), ii !== -1 ? ii : null) : format2 === "dddd" ? (ii = indexOf.call(this._weekdaysParse, llc), ii !== -1 || (ii = indexOf.call(this._shortWeekdaysParse, llc), ii !== -1) ? ii : (ii = indexOf.call(this._minWeekdaysParse, llc), ii !== -1 ? ii : null)) : format2 === "ddd" ? (ii = indexOf.call(this._shortWeekdaysParse, llc), ii !== -1 || (ii = indexOf.call(this._weekdaysParse, llc), ii !== -1) ? ii : (ii = indexOf.call(this._minWeekdaysParse, llc), ii !== -1 ? ii : null)) : (ii = indexOf.call(this._minWeekdaysParse, llc), ii !== -1 || (ii = indexOf.call(this._weekdaysParse, llc), ii !== -1) ? ii : (ii = indexOf.call(this._shortWeekdaysParse, llc), ii !== -1 ? ii : null));
    }
    function localeWeekdaysParse(weekdayName, format2, strict) {
      var i, mom, regex;
      if (this._weekdaysParseExact)
        return handleStrictParse$1.call(this, weekdayName, format2, strict);
      for (this._weekdaysParse || (this._weekdaysParse = [], this._minWeekdaysParse = [], this._shortWeekdaysParse = [], this._fullWeekdaysParse = []), i = 0; i < 7; i++) {
        if (mom = createUTC([2e3, 1]).day(i), strict && !this._fullWeekdaysParse[i] && (this._fullWeekdaysParse[i] = new RegExp(
          "^" + this.weekdays(mom, "").replace(".", "\\.?") + "$",
          "i"
        ), this._shortWeekdaysParse[i] = new RegExp(
          "^" + this.weekdaysShort(mom, "").replace(".", "\\.?") + "$",
          "i"
        ), this._minWeekdaysParse[i] = new RegExp(
          "^" + this.weekdaysMin(mom, "").replace(".", "\\.?") + "$",
          "i"
        )), this._weekdaysParse[i] || (regex = "^" + this.weekdays(mom, "") + "|^" + this.weekdaysShort(mom, "") + "|^" + this.weekdaysMin(mom, ""), this._weekdaysParse[i] = new RegExp(regex.replace(".", ""), "i")), strict && format2 === "dddd" && this._fullWeekdaysParse[i].test(weekdayName))
          return i;
        if (strict && format2 === "ddd" && this._shortWeekdaysParse[i].test(weekdayName))
          return i;
        if (strict && format2 === "dd" && this._minWeekdaysParse[i].test(weekdayName))
          return i;
        if (!strict && this._weekdaysParse[i].test(weekdayName))
          return i;
      }
    }
    function getSetDayOfWeek(input) {
      if (!this.isValid())
        return input != null ? this : NaN;
      var day = get2(this, "Day");
      return input != null ? (input = parseWeekday(input, this.localeData()), this.add(input - day, "d")) : day;
    }
    function getSetLocaleDayOfWeek(input) {
      if (!this.isValid())
        return input != null ? this : NaN;
      var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
      return input == null ? weekday : this.add(input - weekday, "d");
    }
    function getSetISODayOfWeek(input) {
      if (!this.isValid())
        return input != null ? this : NaN;
      if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
      } else
        return this.day() || 7;
    }
    function weekdaysRegex(isStrict) {
      return this._weekdaysParseExact ? (hasOwnProp(this, "_weekdaysRegex") || computeWeekdaysParse.call(this), isStrict ? this._weekdaysStrictRegex : this._weekdaysRegex) : (hasOwnProp(this, "_weekdaysRegex") || (this._weekdaysRegex = defaultWeekdaysRegex), this._weekdaysStrictRegex && isStrict ? this._weekdaysStrictRegex : this._weekdaysRegex);
    }
    function weekdaysShortRegex(isStrict) {
      return this._weekdaysParseExact ? (hasOwnProp(this, "_weekdaysRegex") || computeWeekdaysParse.call(this), isStrict ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex) : (hasOwnProp(this, "_weekdaysShortRegex") || (this._weekdaysShortRegex = defaultWeekdaysShortRegex), this._weekdaysShortStrictRegex && isStrict ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex);
    }
    function weekdaysMinRegex(isStrict) {
      return this._weekdaysParseExact ? (hasOwnProp(this, "_weekdaysRegex") || computeWeekdaysParse.call(this), isStrict ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex) : (hasOwnProp(this, "_weekdaysMinRegex") || (this._weekdaysMinRegex = defaultWeekdaysMinRegex), this._weekdaysMinStrictRegex && isStrict ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex);
    }
    function computeWeekdaysParse() {
      function cmpLenRev(a, b) {
        return b.length - a.length;
      }
      var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [], i, mom, minp, shortp, longp;
      for (i = 0; i < 7; i++)
        mom = createUTC([2e3, 1]).day(i), minp = regexEscape(this.weekdaysMin(mom, "")), shortp = regexEscape(this.weekdaysShort(mom, "")), longp = regexEscape(this.weekdays(mom, "")), minPieces.push(minp), shortPieces.push(shortp), longPieces.push(longp), mixedPieces.push(minp), mixedPieces.push(shortp), mixedPieces.push(longp);
      minPieces.sort(cmpLenRev), shortPieces.sort(cmpLenRev), longPieces.sort(cmpLenRev), mixedPieces.sort(cmpLenRev), this._weekdaysRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i"), this._weekdaysShortRegex = this._weekdaysRegex, this._weekdaysMinRegex = this._weekdaysRegex, this._weekdaysStrictRegex = new RegExp(
        "^(" + longPieces.join("|") + ")",
        "i"
      ), this._weekdaysShortStrictRegex = new RegExp(
        "^(" + shortPieces.join("|") + ")",
        "i"
      ), this._weekdaysMinStrictRegex = new RegExp(
        "^(" + minPieces.join("|") + ")",
        "i"
      );
    }
    function hFormat() {
      return this.hours() % 12 || 12;
    }
    function kFormat() {
      return this.hours() || 24;
    }
    addFormatToken("H", ["HH", 2], 0, "hour"), addFormatToken("h", ["hh", 2], 0, hFormat), addFormatToken("k", ["kk", 2], 0, kFormat), addFormatToken("hmm", 0, 0, function() {
      return "" + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    }), addFormatToken("hmmss", 0, 0, function() {
      return "" + hFormat.apply(this) + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
    }), addFormatToken("Hmm", 0, 0, function() {
      return "" + this.hours() + zeroFill(this.minutes(), 2);
    }), addFormatToken("Hmmss", 0, 0, function() {
      return "" + this.hours() + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
    });
    function meridiem(token2, lowercase) {
      addFormatToken(token2, 0, 0, function() {
        return this.localeData().meridiem(
          this.hours(),
          this.minutes(),
          lowercase
        );
      });
    }
    meridiem("a", !0), meridiem("A", !1);
    function matchMeridiem(isStrict, locale2) {
      return locale2._meridiemParse;
    }
    addRegexToken("a", matchMeridiem), addRegexToken("A", matchMeridiem), addRegexToken("H", match1to2, match1to2HasZero), addRegexToken("h", match1to2, match1to2NoLeadingZero), addRegexToken("k", match1to2, match1to2NoLeadingZero), addRegexToken("HH", match1to2, match2), addRegexToken("hh", match1to2, match2), addRegexToken("kk", match1to2, match2), addRegexToken("hmm", match3to4), addRegexToken("hmmss", match5to6), addRegexToken("Hmm", match3to4), addRegexToken("Hmmss", match5to6), addParseToken(["H", "HH"], HOUR), addParseToken(["k", "kk"], function(input, array, config) {
      var kInput = toInt(input);
      array[HOUR] = kInput === 24 ? 0 : kInput;
    }), addParseToken(["a", "A"], function(input, array, config) {
      config._isPm = config._locale.isPM(input), config._meridiem = input;
    }), addParseToken(["h", "hh"], function(input, array, config) {
      array[HOUR] = toInt(input), getParsingFlags(config).bigHour = !0;
    }), addParseToken("hmm", function(input, array, config) {
      var pos = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos)), array[MINUTE] = toInt(input.substr(pos)), getParsingFlags(config).bigHour = !0;
    }), addParseToken("hmmss", function(input, array, config) {
      var pos1 = input.length - 4, pos2 = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos1)), array[MINUTE] = toInt(input.substr(pos1, 2)), array[SECOND] = toInt(input.substr(pos2)), getParsingFlags(config).bigHour = !0;
    }), addParseToken("Hmm", function(input, array, config) {
      var pos = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos)), array[MINUTE] = toInt(input.substr(pos));
    }), addParseToken("Hmmss", function(input, array, config) {
      var pos1 = input.length - 4, pos2 = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos1)), array[MINUTE] = toInt(input.substr(pos1, 2)), array[SECOND] = toInt(input.substr(pos2));
    });
    function localeIsPM(input) {
      return (input + "").toLowerCase().charAt(0) === "p";
    }
    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i, getSetHour = makeGetSet("Hours", !0);
    function localeMeridiem(hours2, minutes2, isLower) {
      return hours2 > 11 ? isLower ? "pm" : "PM" : isLower ? "am" : "AM";
    }
    var baseConfig = {
      calendar: defaultCalendar,
      longDateFormat: defaultLongDateFormat,
      invalidDate: defaultInvalidDate,
      ordinal: defaultOrdinal,
      dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
      relativeTime: defaultRelativeTime,
      months: defaultLocaleMonths,
      monthsShort: defaultLocaleMonthsShort,
      week: defaultLocaleWeek,
      weekdays: defaultLocaleWeekdays,
      weekdaysMin: defaultLocaleWeekdaysMin,
      weekdaysShort: defaultLocaleWeekdaysShort,
      meridiemParse: defaultLocaleMeridiemParse
    }, locales = {}, localeFamilies = {}, globalLocale;
    function commonPrefix(arr1, arr2) {
      var i, minl = Math.min(arr1.length, arr2.length);
      for (i = 0; i < minl; i += 1)
        if (arr1[i] !== arr2[i])
          return i;
      return minl;
    }
    function normalizeLocale(key) {
      return key && key.toLowerCase().replace("_", "-");
    }
    function chooseLocale(names) {
      for (var i = 0, j, next, locale2, split; i < names.length; ) {
        for (split = normalizeLocale(names[i]).split("-"), j = split.length, next = normalizeLocale(names[i + 1]), next = next ? next.split("-") : null; j > 0; ) {
          if (locale2 = loadLocale(split.slice(0, j).join("-")), locale2)
            return locale2;
          if (next && next.length >= j && commonPrefix(split, next) >= j - 1)
            break;
          j--;
        }
        i++;
      }
      return globalLocale;
    }
    function isLocaleNameSane(name) {
      return !!(name && name.match("^[^/\\\\]*$"));
    }
    function loadLocale(name) {
      var oldLocale = null, aliasedRequire;
      if (locales[name] === void 0 && module2 && module2.exports && isLocaleNameSane(name))
        try {
          oldLocale = globalLocale._abbr, aliasedRequire = commonjsRequire, aliasedRequire("./locale/" + name), getSetGlobalLocale(oldLocale);
        } catch {
          locales[name] = null;
        }
      return locales[name];
    }
    function getSetGlobalLocale(key, values) {
      var data;
      return key && (isUndefined(values) ? data = getLocale(key) : data = defineLocale(key, values), data ? globalLocale = data : typeof console < "u" && console.warn && console.warn(
        "Locale " + key + " not found. Did you forget to load it?"
      )), globalLocale._abbr;
    }
    function defineLocale(name, config) {
      if (config !== null) {
        var locale2, parentConfig = baseConfig;
        if (config.abbr = name, locales[name] != null)
          deprecateSimple(
            "defineLocaleOverride",
            "use moment.updateLocale(localeName, config) to change an existing locale. moment.defineLocale(localeName, config) should only be used for creating a new locale See http://momentjs.com/guides/#/warnings/define-locale/ for more info."
          ), parentConfig = locales[name]._config;
        else if (config.parentLocale != null)
          if (locales[config.parentLocale] != null)
            parentConfig = locales[config.parentLocale]._config;
          else if (locale2 = loadLocale(config.parentLocale), locale2 != null)
            parentConfig = locale2._config;
          else
            return localeFamilies[config.parentLocale] || (localeFamilies[config.parentLocale] = []), localeFamilies[config.parentLocale].push({
              name,
              config
            }), null;
        return locales[name] = new Locale(mergeConfigs(parentConfig, config)), localeFamilies[name] && localeFamilies[name].forEach(function(x) {
          defineLocale(x.name, x.config);
        }), getSetGlobalLocale(name), locales[name];
      } else
        return delete locales[name], null;
    }
    function updateLocale(name, config) {
      if (config != null) {
        var locale2, tmpLocale, parentConfig = baseConfig;
        locales[name] != null && locales[name].parentLocale != null ? locales[name].set(mergeConfigs(locales[name]._config, config)) : (tmpLocale = loadLocale(name), tmpLocale != null && (parentConfig = tmpLocale._config), config = mergeConfigs(parentConfig, config), tmpLocale == null && (config.abbr = name), locale2 = new Locale(config), locale2.parentLocale = locales[name], locales[name] = locale2), getSetGlobalLocale(name);
      } else
        locales[name] != null && (locales[name].parentLocale != null ? (locales[name] = locales[name].parentLocale, name === getSetGlobalLocale() && getSetGlobalLocale(name)) : locales[name] != null && delete locales[name]);
      return locales[name];
    }
    function getLocale(key) {
      var locale2;
      if (key && key._locale && key._locale._abbr && (key = key._locale._abbr), !key)
        return globalLocale;
      if (!isArray(key)) {
        if (locale2 = loadLocale(key), locale2)
          return locale2;
        key = [key];
      }
      return chooseLocale(key);
    }
    function listLocales() {
      return keys(locales);
    }
    function checkOverflow(m) {
      var overflow, a = m._a;
      return a && getParsingFlags(m).overflow === -2 && (overflow = a[MONTH] < 0 || a[MONTH] > 11 ? MONTH : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH]) ? DATE : a[HOUR] < 0 || a[HOUR] > 24 || a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0) ? HOUR : a[MINUTE] < 0 || a[MINUTE] > 59 ? MINUTE : a[SECOND] < 0 || a[SECOND] > 59 ? SECOND : a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND : -1, getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE) && (overflow = DATE), getParsingFlags(m)._overflowWeeks && overflow === -1 && (overflow = WEEK), getParsingFlags(m)._overflowWeekday && overflow === -1 && (overflow = WEEKDAY), getParsingFlags(m).overflow = overflow), m;
    }
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/, basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/, tzRegex = /Z|[+-]\d\d(?::?\d\d)?/, isoDates = [
      ["YYYYYY-MM-DD", /[+-]\d{6}-\d\d-\d\d/],
      ["YYYY-MM-DD", /\d{4}-\d\d-\d\d/],
      ["GGGG-[W]WW-E", /\d{4}-W\d\d-\d/],
      ["GGGG-[W]WW", /\d{4}-W\d\d/, !1],
      ["YYYY-DDD", /\d{4}-\d{3}/],
      ["YYYY-MM", /\d{4}-\d\d/, !1],
      ["YYYYYYMMDD", /[+-]\d{10}/],
      ["YYYYMMDD", /\d{8}/],
      ["GGGG[W]WWE", /\d{4}W\d{3}/],
      ["GGGG[W]WW", /\d{4}W\d{2}/, !1],
      ["YYYYDDD", /\d{7}/],
      ["YYYYMM", /\d{6}/, !1],
      ["YYYY", /\d{4}/, !1]
    ], isoTimes = [
      ["HH:mm:ss.SSSS", /\d\d:\d\d:\d\d\.\d+/],
      ["HH:mm:ss,SSSS", /\d\d:\d\d:\d\d,\d+/],
      ["HH:mm:ss", /\d\d:\d\d:\d\d/],
      ["HH:mm", /\d\d:\d\d/],
      ["HHmmss.SSSS", /\d\d\d\d\d\d\.\d+/],
      ["HHmmss,SSSS", /\d\d\d\d\d\d,\d+/],
      ["HHmmss", /\d\d\d\d\d\d/],
      ["HHmm", /\d\d\d\d/],
      ["HH", /\d\d/]
    ], aspNetJsonRegex = /^\/?Date\((-?\d+)/i, rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/, obsOffsets = {
      UT: 0,
      GMT: 0,
      EDT: -4 * 60,
      EST: -5 * 60,
      CDT: -5 * 60,
      CST: -6 * 60,
      MDT: -6 * 60,
      MST: -7 * 60,
      PDT: -7 * 60,
      PST: -8 * 60
    };
    function configFromISO(config) {
      var i, l, string = config._i, match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string), allowTime, dateFormat, timeFormat, tzFormat, isoDatesLen = isoDates.length, isoTimesLen = isoTimes.length;
      if (match) {
        for (getParsingFlags(config).iso = !0, i = 0, l = isoDatesLen; i < l; i++)
          if (isoDates[i][1].exec(match[1])) {
            dateFormat = isoDates[i][0], allowTime = isoDates[i][2] !== !1;
            break;
          }
        if (dateFormat == null) {
          config._isValid = !1;
          return;
        }
        if (match[3]) {
          for (i = 0, l = isoTimesLen; i < l; i++)
            if (isoTimes[i][1].exec(match[3])) {
              timeFormat = (match[2] || " ") + isoTimes[i][0];
              break;
            }
          if (timeFormat == null) {
            config._isValid = !1;
            return;
          }
        }
        if (!allowTime && timeFormat != null) {
          config._isValid = !1;
          return;
        }
        if (match[4])
          if (tzRegex.exec(match[4]))
            tzFormat = "Z";
          else {
            config._isValid = !1;
            return;
          }
        config._f = dateFormat + (timeFormat || "") + (tzFormat || ""), configFromStringAndFormat(config);
      } else
        config._isValid = !1;
    }
    function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
      var result = [
        untruncateYear(yearStr),
        defaultLocaleMonthsShort.indexOf(monthStr),
        parseInt(dayStr, 10),
        parseInt(hourStr, 10),
        parseInt(minuteStr, 10)
      ];
      return secondStr && result.push(parseInt(secondStr, 10)), result;
    }
    function untruncateYear(yearStr) {
      var year = parseInt(yearStr, 10);
      return year <= 49 ? 2e3 + year : year <= 999 ? 1900 + year : year;
    }
    function preprocessRFC2822(s) {
      return s.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }
    function checkWeekday(weekdayStr, parsedInput, config) {
      if (weekdayStr) {
        var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr), weekdayActual = new Date(
          parsedInput[0],
          parsedInput[1],
          parsedInput[2]
        ).getDay();
        if (weekdayProvided !== weekdayActual)
          return getParsingFlags(config).weekdayMismatch = !0, config._isValid = !1, !1;
      }
      return !0;
    }
    function calculateOffset(obsOffset, militaryOffset, numOffset) {
      if (obsOffset)
        return obsOffsets[obsOffset];
      if (militaryOffset)
        return 0;
      var hm = parseInt(numOffset, 10), m = hm % 100, h = (hm - m) / 100;
      return h * 60 + m;
    }
    function configFromRFC2822(config) {
      var match = rfc2822.exec(preprocessRFC2822(config._i)), parsedArray;
      if (match) {
        if (parsedArray = extractFromRFC2822Strings(
          match[4],
          match[3],
          match[2],
          match[5],
          match[6],
          match[7]
        ), !checkWeekday(match[1], parsedArray, config))
          return;
        config._a = parsedArray, config._tzm = calculateOffset(match[8], match[9], match[10]), config._d = createUTCDate.apply(null, config._a), config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm), getParsingFlags(config).rfc2822 = !0;
      } else
        config._isValid = !1;
    }
    function configFromString(config) {
      var matched = aspNetJsonRegex.exec(config._i);
      if (matched !== null) {
        config._d = /* @__PURE__ */ new Date(+matched[1]);
        return;
      }
      if (configFromISO(config), config._isValid === !1)
        delete config._isValid;
      else
        return;
      if (configFromRFC2822(config), config._isValid === !1)
        delete config._isValid;
      else
        return;
      config._strict ? config._isValid = !1 : hooks.createFromInputFallback(config);
    }
    hooks.createFromInputFallback = deprecate(
      "value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.",
      function(config) {
        config._d = /* @__PURE__ */ new Date(config._i + (config._useUTC ? " UTC" : ""));
      }
    );
    function defaults(a, b, c) {
      return a ?? b ?? c;
    }
    function currentDateArray(config) {
      var nowValue = new Date(hooks.now());
      return config._useUTC ? [
        nowValue.getUTCFullYear(),
        nowValue.getUTCMonth(),
        nowValue.getUTCDate()
      ] : [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }
    function configFromArray(config) {
      var i, date, input = [], currentDate, expectedWeekday, yearToUse;
      if (!config._d) {
        for (currentDate = currentDateArray(config), config._w && config._a[DATE] == null && config._a[MONTH] == null && dayOfYearFromWeekInfo(config), config._dayOfYear != null && (yearToUse = defaults(config._a[YEAR], currentDate[YEAR]), (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) && (getParsingFlags(config)._overflowDayOfYear = !0), date = createUTCDate(yearToUse, 0, config._dayOfYear), config._a[MONTH] = date.getUTCMonth(), config._a[DATE] = date.getUTCDate()), i = 0; i < 3 && config._a[i] == null; ++i)
          config._a[i] = input[i] = currentDate[i];
        for (; i < 7; i++)
          config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
        config._a[HOUR] === 24 && config._a[MINUTE] === 0 && config._a[SECOND] === 0 && config._a[MILLISECOND] === 0 && (config._nextDay = !0, config._a[HOUR] = 0), config._d = (config._useUTC ? createUTCDate : createDate).apply(
          null,
          input
        ), expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay(), config._tzm != null && config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm), config._nextDay && (config._a[HOUR] = 24), config._w && typeof config._w.d < "u" && config._w.d !== expectedWeekday && (getParsingFlags(config).weekdayMismatch = !0);
      }
    }
    function dayOfYearFromWeekInfo(config) {
      var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;
      w = config._w, w.GG != null || w.W != null || w.E != null ? (dow = 1, doy = 4, weekYear = defaults(
        w.GG,
        config._a[YEAR],
        weekOfYear(createLocal(), 1, 4).year
      ), week = defaults(w.W, 1), weekday = defaults(w.E, 1), (weekday < 1 || weekday > 7) && (weekdayOverflow = !0)) : (dow = config._locale._week.dow, doy = config._locale._week.doy, curWeek = weekOfYear(createLocal(), dow, doy), weekYear = defaults(w.gg, config._a[YEAR], curWeek.year), week = defaults(w.w, curWeek.week), w.d != null ? (weekday = w.d, (weekday < 0 || weekday > 6) && (weekdayOverflow = !0)) : w.e != null ? (weekday = w.e + dow, (w.e < 0 || w.e > 6) && (weekdayOverflow = !0)) : weekday = dow), week < 1 || week > weeksInYear(weekYear, dow, doy) ? getParsingFlags(config)._overflowWeeks = !0 : weekdayOverflow != null ? getParsingFlags(config)._overflowWeekday = !0 : (temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy), config._a[YEAR] = temp.year, config._dayOfYear = temp.dayOfYear);
    }
    hooks.ISO_8601 = function() {
    }, hooks.RFC_2822 = function() {
    };
    function configFromStringAndFormat(config) {
      if (config._f === hooks.ISO_8601) {
        configFromISO(config);
        return;
      }
      if (config._f === hooks.RFC_2822) {
        configFromRFC2822(config);
        return;
      }
      config._a = [], getParsingFlags(config).empty = !0;
      var string = "" + config._i, i, parsedInput, tokens2, token2, skipped, stringLength = string.length, totalParsedInputLength = 0, era, tokenLen;
      for (tokens2 = expandFormat(config._f, config._locale).match(formattingTokens) || [], tokenLen = tokens2.length, i = 0; i < tokenLen; i++)
        token2 = tokens2[i], parsedInput = (string.match(getParseRegexForToken(token2, config)) || [])[0], parsedInput && (skipped = string.substr(0, string.indexOf(parsedInput)), skipped.length > 0 && getParsingFlags(config).unusedInput.push(skipped), string = string.slice(
          string.indexOf(parsedInput) + parsedInput.length
        ), totalParsedInputLength += parsedInput.length), formatTokenFunctions[token2] ? (parsedInput ? getParsingFlags(config).empty = !1 : getParsingFlags(config).unusedTokens.push(token2), addTimeToArrayFromToken(token2, parsedInput, config)) : config._strict && !parsedInput && getParsingFlags(config).unusedTokens.push(token2);
      getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength, string.length > 0 && getParsingFlags(config).unusedInput.push(string), config._a[HOUR] <= 12 && getParsingFlags(config).bigHour === !0 && config._a[HOUR] > 0 && (getParsingFlags(config).bigHour = void 0), getParsingFlags(config).parsedDateParts = config._a.slice(0), getParsingFlags(config).meridiem = config._meridiem, config._a[HOUR] = meridiemFixWrap(
        config._locale,
        config._a[HOUR],
        config._meridiem
      ), era = getParsingFlags(config).era, era !== null && (config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR])), configFromArray(config), checkOverflow(config);
    }
    function meridiemFixWrap(locale2, hour, meridiem2) {
      var isPm;
      return meridiem2 == null ? hour : locale2.meridiemHour != null ? locale2.meridiemHour(hour, meridiem2) : (locale2.isPM != null && (isPm = locale2.isPM(meridiem2), isPm && hour < 12 && (hour += 12), !isPm && hour === 12 && (hour = 0)), hour);
    }
    function configFromStringAndArray(config) {
      var tempConfig, bestMoment, scoreToBeat, i, currentScore, validFormatFound, bestFormatIsValid = !1, configfLen = config._f.length;
      if (configfLen === 0) {
        getParsingFlags(config).invalidFormat = !0, config._d = /* @__PURE__ */ new Date(NaN);
        return;
      }
      for (i = 0; i < configfLen; i++)
        currentScore = 0, validFormatFound = !1, tempConfig = copyConfig({}, config), config._useUTC != null && (tempConfig._useUTC = config._useUTC), tempConfig._f = config._f[i], configFromStringAndFormat(tempConfig), isValid(tempConfig) && (validFormatFound = !0), currentScore += getParsingFlags(tempConfig).charsLeftOver, currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10, getParsingFlags(tempConfig).score = currentScore, bestFormatIsValid ? currentScore < scoreToBeat && (scoreToBeat = currentScore, bestMoment = tempConfig) : (scoreToBeat == null || currentScore < scoreToBeat || validFormatFound) && (scoreToBeat = currentScore, bestMoment = tempConfig, validFormatFound && (bestFormatIsValid = !0));
      extend(config, bestMoment || tempConfig);
    }
    function configFromObject(config) {
      if (!config._d) {
        var i = normalizeObjectUnits(config._i), dayOrDate = i.day === void 0 ? i.date : i.day;
        config._a = map(
          [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
          function(obj) {
            return obj && parseInt(obj, 10);
          }
        ), configFromArray(config);
      }
    }
    function createFromConfig(config) {
      var res = new Moment(checkOverflow(prepareConfig(config)));
      return res._nextDay && (res.add(1, "d"), res._nextDay = void 0), res;
    }
    function prepareConfig(config) {
      var input = config._i, format2 = config._f;
      return config._locale = config._locale || getLocale(config._l), input === null || format2 === void 0 && input === "" ? createInvalid({ nullInput: !0 }) : (typeof input == "string" && (config._i = input = config._locale.preparse(input)), isMoment(input) ? new Moment(checkOverflow(input)) : (isDate(input) ? config._d = input : isArray(format2) ? configFromStringAndArray(config) : format2 ? configFromStringAndFormat(config) : configFromInput(config), isValid(config) || (config._d = null), config));
    }
    function configFromInput(config) {
      var input = config._i;
      isUndefined(input) ? config._d = new Date(hooks.now()) : isDate(input) ? config._d = new Date(input.valueOf()) : typeof input == "string" ? configFromString(config) : isArray(input) ? (config._a = map(input.slice(0), function(obj) {
        return parseInt(obj, 10);
      }), configFromArray(config)) : isObject(input) ? configFromObject(config) : isNumber(input) ? config._d = new Date(input) : hooks.createFromInputFallback(config);
    }
    function createLocalOrUTC(input, format2, locale2, strict, isUTC) {
      var c = {};
      return (format2 === !0 || format2 === !1) && (strict = format2, format2 = void 0), (locale2 === !0 || locale2 === !1) && (strict = locale2, locale2 = void 0), (isObject(input) && isObjectEmpty(input) || isArray(input) && input.length === 0) && (input = void 0), c._isAMomentObject = !0, c._useUTC = c._isUTC = isUTC, c._l = locale2, c._i = input, c._f = format2, c._strict = strict, createFromConfig(c);
    }
    function createLocal(input, format2, locale2, strict) {
      return createLocalOrUTC(input, format2, locale2, strict, !1);
    }
    var prototypeMin = deprecate(
      "moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/",
      function() {
        var other = createLocal.apply(null, arguments);
        return this.isValid() && other.isValid() ? other < this ? this : other : createInvalid();
      }
    ), prototypeMax = deprecate(
      "moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/",
      function() {
        var other = createLocal.apply(null, arguments);
        return this.isValid() && other.isValid() ? other > this ? this : other : createInvalid();
      }
    );
    function pickBy(fn, moments) {
      var res, i;
      if (moments.length === 1 && isArray(moments[0]) && (moments = moments[0]), !moments.length)
        return createLocal();
      for (res = moments[0], i = 1; i < moments.length; ++i)
        (!moments[i].isValid() || moments[i][fn](res)) && (res = moments[i]);
      return res;
    }
    function min() {
      var args = [].slice.call(arguments, 0);
      return pickBy("isBefore", args);
    }
    function max() {
      var args = [].slice.call(arguments, 0);
      return pickBy("isAfter", args);
    }
    var now = function() {
      return Date.now ? Date.now() : +/* @__PURE__ */ new Date();
    }, ordering = [
      "year",
      "quarter",
      "month",
      "week",
      "day",
      "hour",
      "minute",
      "second",
      "millisecond"
    ];
    function isDurationValid(m) {
      var key, unitHasDecimal = !1, i, orderLen = ordering.length;
      for (key in m)
        if (hasOwnProp(m, key) && !(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key]))))
          return !1;
      for (i = 0; i < orderLen; ++i)
        if (m[ordering[i]]) {
          if (unitHasDecimal)
            return !1;
          parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]]) && (unitHasDecimal = !0);
        }
      return !0;
    }
    function isValid$1() {
      return this._isValid;
    }
    function createInvalid$1() {
      return createDuration(NaN);
    }
    function Duration(duration) {
      var normalizedInput = normalizeObjectUnits(duration), years2 = normalizedInput.year || 0, quarters = normalizedInput.quarter || 0, months2 = normalizedInput.month || 0, weeks2 = normalizedInput.week || normalizedInput.isoWeek || 0, days2 = normalizedInput.day || 0, hours2 = normalizedInput.hour || 0, minutes2 = normalizedInput.minute || 0, seconds2 = normalizedInput.second || 0, milliseconds2 = normalizedInput.millisecond || 0;
      this._isValid = isDurationValid(normalizedInput), this._milliseconds = +milliseconds2 + seconds2 * 1e3 + // 1000
      minutes2 * 6e4 + // 1000 * 60
      hours2 * 1e3 * 60 * 60, this._days = +days2 + weeks2 * 7, this._months = +months2 + quarters * 3 + years2 * 12, this._data = {}, this._locale = getLocale(), this._bubble();
    }
    function isDuration(obj) {
      return obj instanceof Duration;
    }
    function absRound(number) {
      return number < 0 ? Math.round(-1 * number) * -1 : Math.round(number);
    }
    function compareArrays(array1, array2, dontConvert) {
      var len = Math.min(array1.length, array2.length), lengthDiff = Math.abs(array1.length - array2.length), diffs = 0, i;
      for (i = 0; i < len; i++)
        toInt(array1[i]) !== toInt(array2[i]) && diffs++;
      return diffs + lengthDiff;
    }
    function offset(token2, separator) {
      addFormatToken(token2, 0, 0, function() {
        var offset2 = this.utcOffset(), sign2 = "+";
        return offset2 < 0 && (offset2 = -offset2, sign2 = "-"), sign2 + zeroFill(~~(offset2 / 60), 2) + separator + zeroFill(~~offset2 % 60, 2);
      });
    }
    offset("Z", ":"), offset("ZZ", ""), addRegexToken("Z", matchShortOffset), addRegexToken("ZZ", matchShortOffset), addParseToken(["Z", "ZZ"], function(input, array, config) {
      config._useUTC = !0, config._tzm = offsetFromString(matchShortOffset, input);
    });
    var chunkOffset = /([\+\-]|\d\d)/gi;
    function offsetFromString(matcher, string) {
      var matches = (string || "").match(matcher), chunk, parts, minutes2;
      return matches === null ? null : (chunk = matches[matches.length - 1] || [], parts = (chunk + "").match(chunkOffset) || ["-", 0, 0], minutes2 = +(parts[1] * 60) + toInt(parts[2]), minutes2 === 0 ? 0 : parts[0] === "+" ? minutes2 : -minutes2);
    }
    function cloneWithOffset(input, model) {
      var res, diff2;
      return model._isUTC ? (res = model.clone(), diff2 = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf(), res._d.setTime(res._d.valueOf() + diff2), hooks.updateOffset(res, !1), res) : createLocal(input).local();
    }
    function getDateOffset(m) {
      return -Math.round(m._d.getTimezoneOffset());
    }
    hooks.updateOffset = function() {
    };
    function getSetOffset(input, keepLocalTime, keepMinutes) {
      var offset2 = this._offset || 0, localAdjust;
      if (!this.isValid())
        return input != null ? this : NaN;
      if (input != null) {
        if (typeof input == "string") {
          if (input = offsetFromString(matchShortOffset, input), input === null)
            return this;
        } else
          Math.abs(input) < 16 && !keepMinutes && (input = input * 60);
        return !this._isUTC && keepLocalTime && (localAdjust = getDateOffset(this)), this._offset = input, this._isUTC = !0, localAdjust != null && this.add(localAdjust, "m"), offset2 !== input && (!keepLocalTime || this._changeInProgress ? addSubtract(
          this,
          createDuration(input - offset2, "m"),
          1,
          !1
        ) : this._changeInProgress || (this._changeInProgress = !0, hooks.updateOffset(this, !0), this._changeInProgress = null)), this;
      } else
        return this._isUTC ? offset2 : getDateOffset(this);
    }
    function getSetZone(input, keepLocalTime) {
      return input != null ? (typeof input != "string" && (input = -input), this.utcOffset(input, keepLocalTime), this) : -this.utcOffset();
    }
    function setOffsetToUTC(keepLocalTime) {
      return this.utcOffset(0, keepLocalTime);
    }
    function setOffsetToLocal(keepLocalTime) {
      return this._isUTC && (this.utcOffset(0, keepLocalTime), this._isUTC = !1, keepLocalTime && this.subtract(getDateOffset(this), "m")), this;
    }
    function setOffsetToParsedOffset() {
      if (this._tzm != null)
        this.utcOffset(this._tzm, !1, !0);
      else if (typeof this._i == "string") {
        var tZone = offsetFromString(matchOffset, this._i);
        tZone != null ? this.utcOffset(tZone) : this.utcOffset(0, !0);
      }
      return this;
    }
    function hasAlignedHourOffset(input) {
      return this.isValid() ? (input = input ? createLocal(input).utcOffset() : 0, (this.utcOffset() - input) % 60 === 0) : !1;
    }
    function isDaylightSavingTime() {
      return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset();
    }
    function isDaylightSavingTimeShifted() {
      if (!isUndefined(this._isDSTShifted))
        return this._isDSTShifted;
      var c = {}, other;
      return copyConfig(c, this), c = prepareConfig(c), c._a ? (other = c._isUTC ? createUTC(c._a) : createLocal(c._a), this._isDSTShifted = this.isValid() && compareArrays(c._a, other.toArray()) > 0) : this._isDSTShifted = !1, this._isDSTShifted;
    }
    function isLocal() {
      return this.isValid() ? !this._isUTC : !1;
    }
    function isUtcOffset() {
      return this.isValid() ? this._isUTC : !1;
    }
    function isUtc() {
      return this.isValid() ? this._isUTC && this._offset === 0 : !1;
    }
    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/, isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;
    function createDuration(input, key) {
      var duration = input, match = null, sign2, ret, diffRes;
      return isDuration(input) ? duration = {
        ms: input._milliseconds,
        d: input._days,
        M: input._months
      } : isNumber(input) || !isNaN(+input) ? (duration = {}, key ? duration[key] = +input : duration.milliseconds = +input) : (match = aspNetRegex.exec(input)) ? (sign2 = match[1] === "-" ? -1 : 1, duration = {
        y: 0,
        d: toInt(match[DATE]) * sign2,
        h: toInt(match[HOUR]) * sign2,
        m: toInt(match[MINUTE]) * sign2,
        s: toInt(match[SECOND]) * sign2,
        ms: toInt(absRound(match[MILLISECOND] * 1e3)) * sign2
        // the millisecond decimal point is included in the match
      }) : (match = isoRegex.exec(input)) ? (sign2 = match[1] === "-" ? -1 : 1, duration = {
        y: parseIso(match[2], sign2),
        M: parseIso(match[3], sign2),
        w: parseIso(match[4], sign2),
        d: parseIso(match[5], sign2),
        h: parseIso(match[6], sign2),
        m: parseIso(match[7], sign2),
        s: parseIso(match[8], sign2)
      }) : duration == null ? duration = {} : typeof duration == "object" && ("from" in duration || "to" in duration) && (diffRes = momentsDifference(
        createLocal(duration.from),
        createLocal(duration.to)
      ), duration = {}, duration.ms = diffRes.milliseconds, duration.M = diffRes.months), ret = new Duration(duration), isDuration(input) && hasOwnProp(input, "_locale") && (ret._locale = input._locale), isDuration(input) && hasOwnProp(input, "_isValid") && (ret._isValid = input._isValid), ret;
    }
    createDuration.fn = Duration.prototype, createDuration.invalid = createInvalid$1;
    function parseIso(inp, sign2) {
      var res = inp && parseFloat(inp.replace(",", "."));
      return (isNaN(res) ? 0 : res) * sign2;
    }
    function positiveMomentsDifference(base, other) {
      var res = {};
      return res.months = other.month() - base.month() + (other.year() - base.year()) * 12, base.clone().add(res.months, "M").isAfter(other) && --res.months, res.milliseconds = +other - +base.clone().add(res.months, "M"), res;
    }
    function momentsDifference(base, other) {
      var res;
      return base.isValid() && other.isValid() ? (other = cloneWithOffset(other, base), base.isBefore(other) ? res = positiveMomentsDifference(base, other) : (res = positiveMomentsDifference(other, base), res.milliseconds = -res.milliseconds, res.months = -res.months), res) : { milliseconds: 0, months: 0 };
    }
    function createAdder(direction, name) {
      return function(val, period) {
        var dur, tmp;
        return period !== null && !isNaN(+period) && (deprecateSimple(
          name,
          "moment()." + name + "(period, number) is deprecated. Please use moment()." + name + "(number, period). See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info."
        ), tmp = val, val = period, period = tmp), dur = createDuration(val, period), addSubtract(this, dur, direction), this;
      };
    }
    function addSubtract(mom, duration, isAdding, updateOffset) {
      var milliseconds2 = duration._milliseconds, days2 = absRound(duration._days), months2 = absRound(duration._months);
      mom.isValid() && (updateOffset = updateOffset ?? !0, months2 && setMonth(mom, get2(mom, "Month") + months2 * isAdding), days2 && set$1(mom, "Date", get2(mom, "Date") + days2 * isAdding), milliseconds2 && mom._d.setTime(mom._d.valueOf() + milliseconds2 * isAdding), updateOffset && hooks.updateOffset(mom, days2 || months2));
    }
    var add = createAdder(1, "add"), subtract = createAdder(-1, "subtract");
    function isString(input) {
      return typeof input == "string" || input instanceof String;
    }
    function isMomentInput(input) {
      return isMoment(input) || isDate(input) || isString(input) || isNumber(input) || isNumberOrStringArray(input) || isMomentInputObject(input) || input === null || input === void 0;
    }
    function isMomentInputObject(input) {
      var objectTest = isObject(input) && !isObjectEmpty(input), propertyTest = !1, properties = [
        "years",
        "year",
        "y",
        "months",
        "month",
        "M",
        "days",
        "day",
        "d",
        "dates",
        "date",
        "D",
        "hours",
        "hour",
        "h",
        "minutes",
        "minute",
        "m",
        "seconds",
        "second",
        "s",
        "milliseconds",
        "millisecond",
        "ms"
      ], i, property, propertyLen = properties.length;
      for (i = 0; i < propertyLen; i += 1)
        property = properties[i], propertyTest = propertyTest || hasOwnProp(input, property);
      return objectTest && propertyTest;
    }
    function isNumberOrStringArray(input) {
      var arrayTest = isArray(input), dataTypeTest = !1;
      return arrayTest && (dataTypeTest = input.filter(function(item) {
        return !isNumber(item) && isString(input);
      }).length === 0), arrayTest && dataTypeTest;
    }
    function isCalendarSpec(input) {
      var objectTest = isObject(input) && !isObjectEmpty(input), propertyTest = !1, properties = [
        "sameDay",
        "nextDay",
        "lastDay",
        "nextWeek",
        "lastWeek",
        "sameElse"
      ], i, property;
      for (i = 0; i < properties.length; i += 1)
        property = properties[i], propertyTest = propertyTest || hasOwnProp(input, property);
      return objectTest && propertyTest;
    }
    function getCalendarFormat(myMoment, now2) {
      var diff2 = myMoment.diff(now2, "days", !0);
      return diff2 < -6 ? "sameElse" : diff2 < -1 ? "lastWeek" : diff2 < 0 ? "lastDay" : diff2 < 1 ? "sameDay" : diff2 < 2 ? "nextDay" : diff2 < 7 ? "nextWeek" : "sameElse";
    }
    function calendar$1(time, formats) {
      arguments.length === 1 && (arguments[0] ? isMomentInput(arguments[0]) ? (time = arguments[0], formats = void 0) : isCalendarSpec(arguments[0]) && (formats = arguments[0], time = void 0) : (time = void 0, formats = void 0));
      var now2 = time || createLocal(), sod = cloneWithOffset(now2, this).startOf("day"), format2 = hooks.calendarFormat(this, sod) || "sameElse", output = formats && (isFunction(formats[format2]) ? formats[format2].call(this, now2) : formats[format2]);
      return this.format(
        output || this.localeData().calendar(format2, this, createLocal(now2))
      );
    }
    function clone() {
      return new Moment(this);
    }
    function isAfter(input, units) {
      var localInput = isMoment(input) ? input : createLocal(input);
      return this.isValid() && localInput.isValid() ? (units = normalizeUnits(units) || "millisecond", units === "millisecond" ? this.valueOf() > localInput.valueOf() : localInput.valueOf() < this.clone().startOf(units).valueOf()) : !1;
    }
    function isBefore(input, units) {
      var localInput = isMoment(input) ? input : createLocal(input);
      return this.isValid() && localInput.isValid() ? (units = normalizeUnits(units) || "millisecond", units === "millisecond" ? this.valueOf() < localInput.valueOf() : this.clone().endOf(units).valueOf() < localInput.valueOf()) : !1;
    }
    function isBetween(from2, to2, units, inclusivity) {
      var localFrom = isMoment(from2) ? from2 : createLocal(from2), localTo = isMoment(to2) ? to2 : createLocal(to2);
      return this.isValid() && localFrom.isValid() && localTo.isValid() ? (inclusivity = inclusivity || "()", (inclusivity[0] === "(" ? this.isAfter(localFrom, units) : !this.isBefore(localFrom, units)) && (inclusivity[1] === ")" ? this.isBefore(localTo, units) : !this.isAfter(localTo, units))) : !1;
    }
    function isSame(input, units) {
      var localInput = isMoment(input) ? input : createLocal(input), inputMs;
      return this.isValid() && localInput.isValid() ? (units = normalizeUnits(units) || "millisecond", units === "millisecond" ? this.valueOf() === localInput.valueOf() : (inputMs = localInput.valueOf(), this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf())) : !1;
    }
    function isSameOrAfter(input, units) {
      return this.isSame(input, units) || this.isAfter(input, units);
    }
    function isSameOrBefore(input, units) {
      return this.isSame(input, units) || this.isBefore(input, units);
    }
    function diff(input, units, asFloat) {
      var that, zoneDelta, output;
      if (!this.isValid())
        return NaN;
      if (that = cloneWithOffset(input, this), !that.isValid())
        return NaN;
      switch (zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4, units = normalizeUnits(units), units) {
        case "year":
          output = monthDiff(this, that) / 12;
          break;
        case "month":
          output = monthDiff(this, that);
          break;
        case "quarter":
          output = monthDiff(this, that) / 3;
          break;
        case "second":
          output = (this - that) / 1e3;
          break;
        case "minute":
          output = (this - that) / 6e4;
          break;
        case "hour":
          output = (this - that) / 36e5;
          break;
        case "day":
          output = (this - that - zoneDelta) / 864e5;
          break;
        case "week":
          output = (this - that - zoneDelta) / 6048e5;
          break;
        default:
          output = this - that;
      }
      return asFloat ? output : absFloor(output);
    }
    function monthDiff(a, b) {
      if (a.date() < b.date())
        return -monthDiff(b, a);
      var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()), anchor = a.clone().add(wholeMonthDiff, "months"), anchor2, adjust;
      return b - anchor < 0 ? (anchor2 = a.clone().add(wholeMonthDiff - 1, "months"), adjust = (b - anchor) / (anchor - anchor2)) : (anchor2 = a.clone().add(wholeMonthDiff + 1, "months"), adjust = (b - anchor) / (anchor2 - anchor)), -(wholeMonthDiff + adjust) || 0;
    }
    hooks.defaultFormat = "YYYY-MM-DDTHH:mm:ssZ", hooks.defaultFormatUtc = "YYYY-MM-DDTHH:mm:ss[Z]";
    function toString() {
      return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
    }
    function toISOString(keepOffset) {
      if (!this.isValid())
        return null;
      var utc = keepOffset !== !0, m = utc ? this.clone().utc() : this;
      return m.year() < 0 || m.year() > 9999 ? formatMoment(
        m,
        utc ? "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]" : "YYYYYY-MM-DD[T]HH:mm:ss.SSSZ"
      ) : isFunction(Date.prototype.toISOString) ? utc ? this.toDate().toISOString() : new Date(this.valueOf() + this.utcOffset() * 60 * 1e3).toISOString().replace("Z", formatMoment(m, "Z")) : formatMoment(
        m,
        utc ? "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]" : "YYYY-MM-DD[T]HH:mm:ss.SSSZ"
      );
    }
    function inspect() {
      if (!this.isValid())
        return "moment.invalid(/* " + this._i + " */)";
      var func = "moment", zone = "", prefix, year, datetime, suffix;
      return this.isLocal() || (func = this.utcOffset() === 0 ? "moment.utc" : "moment.parseZone", zone = "Z"), prefix = "[" + func + '("]', year = 0 <= this.year() && this.year() <= 9999 ? "YYYY" : "YYYYYY", datetime = "-MM-DD[T]HH:mm:ss.SSS", suffix = zone + '[")]', this.format(prefix + year + datetime + suffix);
    }
    function format(inputString) {
      inputString || (inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat);
      var output = formatMoment(this, inputString);
      return this.localeData().postformat(output);
    }
    function from(time, withoutSuffix) {
      return this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid()) ? createDuration({ to: this, from: time }).locale(this.locale()).humanize(!withoutSuffix) : this.localeData().invalidDate();
    }
    function fromNow(withoutSuffix) {
      return this.from(createLocal(), withoutSuffix);
    }
    function to(time, withoutSuffix) {
      return this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid()) ? createDuration({ from: this, to: time }).locale(this.locale()).humanize(!withoutSuffix) : this.localeData().invalidDate();
    }
    function toNow(withoutSuffix) {
      return this.to(createLocal(), withoutSuffix);
    }
    function locale(key) {
      var newLocaleData;
      return key === void 0 ? this._locale._abbr : (newLocaleData = getLocale(key), newLocaleData != null && (this._locale = newLocaleData), this);
    }
    var lang = deprecate(
      "moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",
      function(key) {
        return key === void 0 ? this.localeData() : this.locale(key);
      }
    );
    function localeData() {
      return this._locale;
    }
    var MS_PER_SECOND = 1e3, MS_PER_MINUTE = 60 * MS_PER_SECOND, MS_PER_HOUR = 60 * MS_PER_MINUTE, MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;
    function mod$1(dividend, divisor) {
      return (dividend % divisor + divisor) % divisor;
    }
    function localStartOfDate(y, m, d) {
      return y < 100 && y >= 0 ? new Date(y + 400, m, d) - MS_PER_400_YEARS : new Date(y, m, d).valueOf();
    }
    function utcStartOfDate(y, m, d) {
      return y < 100 && y >= 0 ? Date.UTC(y + 400, m, d) - MS_PER_400_YEARS : Date.UTC(y, m, d);
    }
    function startOf(units) {
      var time, startOfDate;
      if (units = normalizeUnits(units), units === void 0 || units === "millisecond" || !this.isValid())
        return this;
      switch (startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate, units) {
        case "year":
          time = startOfDate(this.year(), 0, 1);
          break;
        case "quarter":
          time = startOfDate(
            this.year(),
            this.month() - this.month() % 3,
            1
          );
          break;
        case "month":
          time = startOfDate(this.year(), this.month(), 1);
          break;
        case "week":
          time = startOfDate(
            this.year(),
            this.month(),
            this.date() - this.weekday()
          );
          break;
        case "isoWeek":
          time = startOfDate(
            this.year(),
            this.month(),
            this.date() - (this.isoWeekday() - 1)
          );
          break;
        case "day":
        case "date":
          time = startOfDate(this.year(), this.month(), this.date());
          break;
        case "hour":
          time = this._d.valueOf(), time -= mod$1(
            time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
            MS_PER_HOUR
          );
          break;
        case "minute":
          time = this._d.valueOf(), time -= mod$1(time, MS_PER_MINUTE);
          break;
        case "second":
          time = this._d.valueOf(), time -= mod$1(time, MS_PER_SECOND);
          break;
      }
      return this._d.setTime(time), hooks.updateOffset(this, !0), this;
    }
    function endOf(units) {
      var time, startOfDate;
      if (units = normalizeUnits(units), units === void 0 || units === "millisecond" || !this.isValid())
        return this;
      switch (startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate, units) {
        case "year":
          time = startOfDate(this.year() + 1, 0, 1) - 1;
          break;
        case "quarter":
          time = startOfDate(
            this.year(),
            this.month() - this.month() % 3 + 3,
            1
          ) - 1;
          break;
        case "month":
          time = startOfDate(this.year(), this.month() + 1, 1) - 1;
          break;
        case "week":
          time = startOfDate(
            this.year(),
            this.month(),
            this.date() - this.weekday() + 7
          ) - 1;
          break;
        case "isoWeek":
          time = startOfDate(
            this.year(),
            this.month(),
            this.date() - (this.isoWeekday() - 1) + 7
          ) - 1;
          break;
        case "day":
        case "date":
          time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
          break;
        case "hour":
          time = this._d.valueOf(), time += MS_PER_HOUR - mod$1(
            time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
            MS_PER_HOUR
          ) - 1;
          break;
        case "minute":
          time = this._d.valueOf(), time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
          break;
        case "second":
          time = this._d.valueOf(), time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
          break;
      }
      return this._d.setTime(time), hooks.updateOffset(this, !0), this;
    }
    function valueOf() {
      return this._d.valueOf() - (this._offset || 0) * 6e4;
    }
    function unix() {
      return Math.floor(this.valueOf() / 1e3);
    }
    function toDate() {
      return new Date(this.valueOf());
    }
    function toArray() {
      var m = this;
      return [
        m.year(),
        m.month(),
        m.date(),
        m.hour(),
        m.minute(),
        m.second(),
        m.millisecond()
      ];
    }
    function toObject() {
      var m = this;
      return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
      };
    }
    function toJSON() {
      return this.isValid() ? this.toISOString() : null;
    }
    function isValid$2() {
      return isValid(this);
    }
    function parsingFlags() {
      return extend({}, getParsingFlags(this));
    }
    function invalidAt() {
      return getParsingFlags(this).overflow;
    }
    function creationData() {
      return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
      };
    }
    addFormatToken("N", 0, 0, "eraAbbr"), addFormatToken("NN", 0, 0, "eraAbbr"), addFormatToken("NNN", 0, 0, "eraAbbr"), addFormatToken("NNNN", 0, 0, "eraName"), addFormatToken("NNNNN", 0, 0, "eraNarrow"), addFormatToken("y", ["y", 1], "yo", "eraYear"), addFormatToken("y", ["yy", 2], 0, "eraYear"), addFormatToken("y", ["yyy", 3], 0, "eraYear"), addFormatToken("y", ["yyyy", 4], 0, "eraYear"), addRegexToken("N", matchEraAbbr), addRegexToken("NN", matchEraAbbr), addRegexToken("NNN", matchEraAbbr), addRegexToken("NNNN", matchEraName), addRegexToken("NNNNN", matchEraNarrow), addParseToken(
      ["N", "NN", "NNN", "NNNN", "NNNNN"],
      function(input, array, config, token2) {
        var era = config._locale.erasParse(input, token2, config._strict);
        era ? getParsingFlags(config).era = era : getParsingFlags(config).invalidEra = input;
      }
    ), addRegexToken("y", matchUnsigned), addRegexToken("yy", matchUnsigned), addRegexToken("yyy", matchUnsigned), addRegexToken("yyyy", matchUnsigned), addRegexToken("yo", matchEraYearOrdinal), addParseToken(["y", "yy", "yyy", "yyyy"], YEAR), addParseToken(["yo"], function(input, array, config, token2) {
      var match;
      config._locale._eraYearOrdinalRegex && (match = input.match(config._locale._eraYearOrdinalRegex)), config._locale.eraYearOrdinalParse ? array[YEAR] = config._locale.eraYearOrdinalParse(input, match) : array[YEAR] = parseInt(input, 10);
    });
    function localeEras(m, format2) {
      var i, l, date, eras = this._eras || getLocale("en")._eras;
      for (i = 0, l = eras.length; i < l; ++i) {
        switch (typeof eras[i].since) {
          case "string":
            date = hooks(eras[i].since).startOf("day"), eras[i].since = date.valueOf();
            break;
        }
        switch (typeof eras[i].until) {
          case "undefined":
            eras[i].until = 1 / 0;
            break;
          case "string":
            date = hooks(eras[i].until).startOf("day").valueOf(), eras[i].until = date.valueOf();
            break;
        }
      }
      return eras;
    }
    function localeErasParse(eraName, format2, strict) {
      var i, l, eras = this.eras(), name, abbr, narrow;
      for (eraName = eraName.toUpperCase(), i = 0, l = eras.length; i < l; ++i)
        if (name = eras[i].name.toUpperCase(), abbr = eras[i].abbr.toUpperCase(), narrow = eras[i].narrow.toUpperCase(), strict)
          switch (format2) {
            case "N":
            case "NN":
            case "NNN":
              if (abbr === eraName)
                return eras[i];
              break;
            case "NNNN":
              if (name === eraName)
                return eras[i];
              break;
            case "NNNNN":
              if (narrow === eraName)
                return eras[i];
              break;
          }
        else if ([name, abbr, narrow].indexOf(eraName) >= 0)
          return eras[i];
    }
    function localeErasConvertYear(era, year) {
      var dir = era.since <= era.until ? 1 : -1;
      return year === void 0 ? hooks(era.since).year() : hooks(era.since).year() + (year - era.offset) * dir;
    }
    function getEraName() {
      var i, l, val, eras = this.localeData().eras();
      for (i = 0, l = eras.length; i < l; ++i)
        if (val = this.clone().startOf("day").valueOf(), eras[i].since <= val && val <= eras[i].until || eras[i].until <= val && val <= eras[i].since)
          return eras[i].name;
      return "";
    }
    function getEraNarrow() {
      var i, l, val, eras = this.localeData().eras();
      for (i = 0, l = eras.length; i < l; ++i)
        if (val = this.clone().startOf("day").valueOf(), eras[i].since <= val && val <= eras[i].until || eras[i].until <= val && val <= eras[i].since)
          return eras[i].narrow;
      return "";
    }
    function getEraAbbr() {
      var i, l, val, eras = this.localeData().eras();
      for (i = 0, l = eras.length; i < l; ++i)
        if (val = this.clone().startOf("day").valueOf(), eras[i].since <= val && val <= eras[i].until || eras[i].until <= val && val <= eras[i].since)
          return eras[i].abbr;
      return "";
    }
    function getEraYear() {
      var i, l, dir, val, eras = this.localeData().eras();
      for (i = 0, l = eras.length; i < l; ++i)
        if (dir = eras[i].since <= eras[i].until ? 1 : -1, val = this.clone().startOf("day").valueOf(), eras[i].since <= val && val <= eras[i].until || eras[i].until <= val && val <= eras[i].since)
          return (this.year() - hooks(eras[i].since).year()) * dir + eras[i].offset;
      return this.year();
    }
    function erasNameRegex(isStrict) {
      return hasOwnProp(this, "_erasNameRegex") || computeErasParse.call(this), isStrict ? this._erasNameRegex : this._erasRegex;
    }
    function erasAbbrRegex(isStrict) {
      return hasOwnProp(this, "_erasAbbrRegex") || computeErasParse.call(this), isStrict ? this._erasAbbrRegex : this._erasRegex;
    }
    function erasNarrowRegex(isStrict) {
      return hasOwnProp(this, "_erasNarrowRegex") || computeErasParse.call(this), isStrict ? this._erasNarrowRegex : this._erasRegex;
    }
    function matchEraAbbr(isStrict, locale2) {
      return locale2.erasAbbrRegex(isStrict);
    }
    function matchEraName(isStrict, locale2) {
      return locale2.erasNameRegex(isStrict);
    }
    function matchEraNarrow(isStrict, locale2) {
      return locale2.erasNarrowRegex(isStrict);
    }
    function matchEraYearOrdinal(isStrict, locale2) {
      return locale2._eraYearOrdinalRegex || matchUnsigned;
    }
    function computeErasParse() {
      var abbrPieces = [], namePieces = [], narrowPieces = [], mixedPieces = [], i, l, erasName, erasAbbr, erasNarrow, eras = this.eras();
      for (i = 0, l = eras.length; i < l; ++i)
        erasName = regexEscape(eras[i].name), erasAbbr = regexEscape(eras[i].abbr), erasNarrow = regexEscape(eras[i].narrow), namePieces.push(erasName), abbrPieces.push(erasAbbr), narrowPieces.push(erasNarrow), mixedPieces.push(erasName), mixedPieces.push(erasAbbr), mixedPieces.push(erasNarrow);
      this._erasRegex = new RegExp("^(" + mixedPieces.join("|") + ")", "i"), this._erasNameRegex = new RegExp("^(" + namePieces.join("|") + ")", "i"), this._erasAbbrRegex = new RegExp("^(" + abbrPieces.join("|") + ")", "i"), this._erasNarrowRegex = new RegExp(
        "^(" + narrowPieces.join("|") + ")",
        "i"
      );
    }
    addFormatToken(0, ["gg", 2], 0, function() {
      return this.weekYear() % 100;
    }), addFormatToken(0, ["GG", 2], 0, function() {
      return this.isoWeekYear() % 100;
    });
    function addWeekYearFormatToken(token2, getter) {
      addFormatToken(0, [token2, token2.length], 0, getter);
    }
    addWeekYearFormatToken("gggg", "weekYear"), addWeekYearFormatToken("ggggg", "weekYear"), addWeekYearFormatToken("GGGG", "isoWeekYear"), addWeekYearFormatToken("GGGGG", "isoWeekYear"), addRegexToken("G", matchSigned), addRegexToken("g", matchSigned), addRegexToken("GG", match1to2, match2), addRegexToken("gg", match1to2, match2), addRegexToken("GGGG", match1to4, match4), addRegexToken("gggg", match1to4, match4), addRegexToken("GGGGG", match1to6, match6), addRegexToken("ggggg", match1to6, match6), addWeekParseToken(
      ["gggg", "ggggg", "GGGG", "GGGGG"],
      function(input, week, config, token2) {
        week[token2.substr(0, 2)] = toInt(input);
      }
    ), addWeekParseToken(["gg", "GG"], function(input, week, config, token2) {
      week[token2] = hooks.parseTwoDigitYear(input);
    });
    function getSetWeekYear(input) {
      return getSetWeekYearHelper.call(
        this,
        input,
        this.week(),
        this.weekday() + this.localeData()._week.dow,
        this.localeData()._week.dow,
        this.localeData()._week.doy
      );
    }
    function getSetISOWeekYear(input) {
      return getSetWeekYearHelper.call(
        this,
        input,
        this.isoWeek(),
        this.isoWeekday(),
        1,
        4
      );
    }
    function getISOWeeksInYear() {
      return weeksInYear(this.year(), 1, 4);
    }
    function getISOWeeksInISOWeekYear() {
      return weeksInYear(this.isoWeekYear(), 1, 4);
    }
    function getWeeksInYear() {
      var weekInfo = this.localeData()._week;
      return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }
    function getWeeksInWeekYear() {
      var weekInfo = this.localeData()._week;
      return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
    }
    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
      var weeksTarget;
      return input == null ? weekOfYear(this, dow, doy).year : (weeksTarget = weeksInYear(input, dow, doy), week > weeksTarget && (week = weeksTarget), setWeekAll.call(this, input, week, weekday, dow, doy));
    }
    function setWeekAll(weekYear, week, weekday, dow, doy) {
      var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy), date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);
      return this.year(date.getUTCFullYear()), this.month(date.getUTCMonth()), this.date(date.getUTCDate()), this;
    }
    addFormatToken("Q", 0, "Qo", "quarter"), addRegexToken("Q", match1), addParseToken("Q", function(input, array) {
      array[MONTH] = (toInt(input) - 1) * 3;
    });
    function getSetQuarter(input) {
      return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }
    addFormatToken("D", ["DD", 2], "Do", "date"), addRegexToken("D", match1to2, match1to2NoLeadingZero), addRegexToken("DD", match1to2, match2), addRegexToken("Do", function(isStrict, locale2) {
      return isStrict ? locale2._dayOfMonthOrdinalParse || locale2._ordinalParse : locale2._dayOfMonthOrdinalParseLenient;
    }), addParseToken(["D", "DD"], DATE), addParseToken("Do", function(input, array) {
      array[DATE] = toInt(input.match(match1to2)[0]);
    });
    var getSetDayOfMonth = makeGetSet("Date", !0);
    addFormatToken("DDD", ["DDDD", 3], "DDDo", "dayOfYear"), addRegexToken("DDD", match1to3), addRegexToken("DDDD", match3), addParseToken(["DDD", "DDDD"], function(input, array, config) {
      config._dayOfYear = toInt(input);
    });
    function getSetDayOfYear(input) {
      var dayOfYear = Math.round(
        (this.clone().startOf("day") - this.clone().startOf("year")) / 864e5
      ) + 1;
      return input == null ? dayOfYear : this.add(input - dayOfYear, "d");
    }
    addFormatToken("m", ["mm", 2], 0, "minute"), addRegexToken("m", match1to2, match1to2HasZero), addRegexToken("mm", match1to2, match2), addParseToken(["m", "mm"], MINUTE);
    var getSetMinute = makeGetSet("Minutes", !1);
    addFormatToken("s", ["ss", 2], 0, "second"), addRegexToken("s", match1to2, match1to2HasZero), addRegexToken("ss", match1to2, match2), addParseToken(["s", "ss"], SECOND);
    var getSetSecond = makeGetSet("Seconds", !1);
    addFormatToken("S", 0, 0, function() {
      return ~~(this.millisecond() / 100);
    }), addFormatToken(0, ["SS", 2], 0, function() {
      return ~~(this.millisecond() / 10);
    }), addFormatToken(0, ["SSS", 3], 0, "millisecond"), addFormatToken(0, ["SSSS", 4], 0, function() {
      return this.millisecond() * 10;
    }), addFormatToken(0, ["SSSSS", 5], 0, function() {
      return this.millisecond() * 100;
    }), addFormatToken(0, ["SSSSSS", 6], 0, function() {
      return this.millisecond() * 1e3;
    }), addFormatToken(0, ["SSSSSSS", 7], 0, function() {
      return this.millisecond() * 1e4;
    }), addFormatToken(0, ["SSSSSSSS", 8], 0, function() {
      return this.millisecond() * 1e5;
    }), addFormatToken(0, ["SSSSSSSSS", 9], 0, function() {
      return this.millisecond() * 1e6;
    }), addRegexToken("S", match1to3, match1), addRegexToken("SS", match1to3, match2), addRegexToken("SSS", match1to3, match3);
    var token, getSetMillisecond;
    for (token = "SSSS"; token.length <= 9; token += "S")
      addRegexToken(token, matchUnsigned);
    function parseMs(input, array) {
      array[MILLISECOND] = toInt(("0." + input) * 1e3);
    }
    for (token = "S"; token.length <= 9; token += "S")
      addParseToken(token, parseMs);
    getSetMillisecond = makeGetSet("Milliseconds", !1), addFormatToken("z", 0, 0, "zoneAbbr"), addFormatToken("zz", 0, 0, "zoneName");
    function getZoneAbbr() {
      return this._isUTC ? "UTC" : "";
    }
    function getZoneName() {
      return this._isUTC ? "Coordinated Universal Time" : "";
    }
    var proto = Moment.prototype;
    proto.add = add, proto.calendar = calendar$1, proto.clone = clone, proto.diff = diff, proto.endOf = endOf, proto.format = format, proto.from = from, proto.fromNow = fromNow, proto.to = to, proto.toNow = toNow, proto.get = stringGet, proto.invalidAt = invalidAt, proto.isAfter = isAfter, proto.isBefore = isBefore, proto.isBetween = isBetween, proto.isSame = isSame, proto.isSameOrAfter = isSameOrAfter, proto.isSameOrBefore = isSameOrBefore, proto.isValid = isValid$2, proto.lang = lang, proto.locale = locale, proto.localeData = localeData, proto.max = prototypeMax, proto.min = prototypeMin, proto.parsingFlags = parsingFlags, proto.set = stringSet, proto.startOf = startOf, proto.subtract = subtract, proto.toArray = toArray, proto.toObject = toObject, proto.toDate = toDate, proto.toISOString = toISOString, proto.inspect = inspect, typeof Symbol < "u" && Symbol.for != null && (proto[Symbol.for("nodejs.util.inspect.custom")] = function() {
      return "Moment<" + this.format() + ">";
    }), proto.toJSON = toJSON, proto.toString = toString, proto.unix = unix, proto.valueOf = valueOf, proto.creationData = creationData, proto.eraName = getEraName, proto.eraNarrow = getEraNarrow, proto.eraAbbr = getEraAbbr, proto.eraYear = getEraYear, proto.year = getSetYear, proto.isLeapYear = getIsLeapYear, proto.weekYear = getSetWeekYear, proto.isoWeekYear = getSetISOWeekYear, proto.quarter = proto.quarters = getSetQuarter, proto.month = getSetMonth, proto.daysInMonth = getDaysInMonth, proto.week = proto.weeks = getSetWeek, proto.isoWeek = proto.isoWeeks = getSetISOWeek, proto.weeksInYear = getWeeksInYear, proto.weeksInWeekYear = getWeeksInWeekYear, proto.isoWeeksInYear = getISOWeeksInYear, proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear, proto.date = getSetDayOfMonth, proto.day = proto.days = getSetDayOfWeek, proto.weekday = getSetLocaleDayOfWeek, proto.isoWeekday = getSetISODayOfWeek, proto.dayOfYear = getSetDayOfYear, proto.hour = proto.hours = getSetHour, proto.minute = proto.minutes = getSetMinute, proto.second = proto.seconds = getSetSecond, proto.millisecond = proto.milliseconds = getSetMillisecond, proto.utcOffset = getSetOffset, proto.utc = setOffsetToUTC, proto.local = setOffsetToLocal, proto.parseZone = setOffsetToParsedOffset, proto.hasAlignedHourOffset = hasAlignedHourOffset, proto.isDST = isDaylightSavingTime, proto.isLocal = isLocal, proto.isUtcOffset = isUtcOffset, proto.isUtc = isUtc, proto.isUTC = isUtc, proto.zoneAbbr = getZoneAbbr, proto.zoneName = getZoneName, proto.dates = deprecate(
      "dates accessor is deprecated. Use date instead.",
      getSetDayOfMonth
    ), proto.months = deprecate(
      "months accessor is deprecated. Use month instead",
      getSetMonth
    ), proto.years = deprecate(
      "years accessor is deprecated. Use year instead",
      getSetYear
    ), proto.zone = deprecate(
      "moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/",
      getSetZone
    ), proto.isDSTShifted = deprecate(
      "isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information",
      isDaylightSavingTimeShifted
    );
    function createUnix(input) {
      return createLocal(input * 1e3);
    }
    function createInZone() {
      return createLocal.apply(null, arguments).parseZone();
    }
    function preParsePostFormat(string) {
      return string;
    }
    var proto$1 = Locale.prototype;
    proto$1.calendar = calendar, proto$1.longDateFormat = longDateFormat, proto$1.invalidDate = invalidDate, proto$1.ordinal = ordinal, proto$1.preparse = preParsePostFormat, proto$1.postformat = preParsePostFormat, proto$1.relativeTime = relativeTime, proto$1.pastFuture = pastFuture, proto$1.set = set2, proto$1.eras = localeEras, proto$1.erasParse = localeErasParse, proto$1.erasConvertYear = localeErasConvertYear, proto$1.erasAbbrRegex = erasAbbrRegex, proto$1.erasNameRegex = erasNameRegex, proto$1.erasNarrowRegex = erasNarrowRegex, proto$1.months = localeMonths, proto$1.monthsShort = localeMonthsShort, proto$1.monthsParse = localeMonthsParse, proto$1.monthsRegex = monthsRegex, proto$1.monthsShortRegex = monthsShortRegex, proto$1.week = localeWeek, proto$1.firstDayOfYear = localeFirstDayOfYear, proto$1.firstDayOfWeek = localeFirstDayOfWeek, proto$1.weekdays = localeWeekdays, proto$1.weekdaysMin = localeWeekdaysMin, proto$1.weekdaysShort = localeWeekdaysShort, proto$1.weekdaysParse = localeWeekdaysParse, proto$1.weekdaysRegex = weekdaysRegex, proto$1.weekdaysShortRegex = weekdaysShortRegex, proto$1.weekdaysMinRegex = weekdaysMinRegex, proto$1.isPM = localeIsPM, proto$1.meridiem = localeMeridiem;
    function get$1(format2, index, field, setter) {
      var locale2 = getLocale(), utc = createUTC().set(setter, index);
      return locale2[field](utc, format2);
    }
    function listMonthsImpl(format2, index, field) {
      if (isNumber(format2) && (index = format2, format2 = void 0), format2 = format2 || "", index != null)
        return get$1(format2, index, field, "month");
      var i, out = [];
      for (i = 0; i < 12; i++)
        out[i] = get$1(format2, i, field, "month");
      return out;
    }
    function listWeekdaysImpl(localeSorted, format2, index, field) {
      typeof localeSorted == "boolean" ? (isNumber(format2) && (index = format2, format2 = void 0), format2 = format2 || "") : (format2 = localeSorted, index = format2, localeSorted = !1, isNumber(format2) && (index = format2, format2 = void 0), format2 = format2 || "");
      var locale2 = getLocale(), shift = localeSorted ? locale2._week.dow : 0, i, out = [];
      if (index != null)
        return get$1(format2, (index + shift) % 7, field, "day");
      for (i = 0; i < 7; i++)
        out[i] = get$1(format2, (i + shift) % 7, field, "day");
      return out;
    }
    function listMonths(format2, index) {
      return listMonthsImpl(format2, index, "months");
    }
    function listMonthsShort(format2, index) {
      return listMonthsImpl(format2, index, "monthsShort");
    }
    function listWeekdays(localeSorted, format2, index) {
      return listWeekdaysImpl(localeSorted, format2, index, "weekdays");
    }
    function listWeekdaysShort(localeSorted, format2, index) {
      return listWeekdaysImpl(localeSorted, format2, index, "weekdaysShort");
    }
    function listWeekdaysMin(localeSorted, format2, index) {
      return listWeekdaysImpl(localeSorted, format2, index, "weekdaysMin");
    }
    getSetGlobalLocale("en", {
      eras: [
        {
          since: "0001-01-01",
          until: 1 / 0,
          offset: 1,
          name: "Anno Domini",
          narrow: "AD",
          abbr: "AD"
        },
        {
          since: "0000-12-31",
          until: -1 / 0,
          offset: 1,
          name: "Before Christ",
          narrow: "BC",
          abbr: "BC"
        }
      ],
      dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
      ordinal: function(number) {
        var b = number % 10, output = toInt(number % 100 / 10) === 1 ? "th" : b === 1 ? "st" : b === 2 ? "nd" : b === 3 ? "rd" : "th";
        return number + output;
      }
    }), hooks.lang = deprecate(
      "moment.lang is deprecated. Use moment.locale instead.",
      getSetGlobalLocale
    ), hooks.langData = deprecate(
      "moment.langData is deprecated. Use moment.localeData instead.",
      getLocale
    );
    var mathAbs = Math.abs;
    function abs() {
      var data = this._data;
      return this._milliseconds = mathAbs(this._milliseconds), this._days = mathAbs(this._days), this._months = mathAbs(this._months), data.milliseconds = mathAbs(data.milliseconds), data.seconds = mathAbs(data.seconds), data.minutes = mathAbs(data.minutes), data.hours = mathAbs(data.hours), data.months = mathAbs(data.months), data.years = mathAbs(data.years), this;
    }
    function addSubtract$1(duration, input, value, direction) {
      var other = createDuration(input, value);
      return duration._milliseconds += direction * other._milliseconds, duration._days += direction * other._days, duration._months += direction * other._months, duration._bubble();
    }
    function add$1(input, value) {
      return addSubtract$1(this, input, value, 1);
    }
    function subtract$1(input, value) {
      return addSubtract$1(this, input, value, -1);
    }
    function absCeil(number) {
      return number < 0 ? Math.floor(number) : Math.ceil(number);
    }
    function bubble() {
      var milliseconds2 = this._milliseconds, days2 = this._days, months2 = this._months, data = this._data, seconds2, minutes2, hours2, years2, monthsFromDays;
      return milliseconds2 >= 0 && days2 >= 0 && months2 >= 0 || milliseconds2 <= 0 && days2 <= 0 && months2 <= 0 || (milliseconds2 += absCeil(monthsToDays(months2) + days2) * 864e5, days2 = 0, months2 = 0), data.milliseconds = milliseconds2 % 1e3, seconds2 = absFloor(milliseconds2 / 1e3), data.seconds = seconds2 % 60, minutes2 = absFloor(seconds2 / 60), data.minutes = minutes2 % 60, hours2 = absFloor(minutes2 / 60), data.hours = hours2 % 24, days2 += absFloor(hours2 / 24), monthsFromDays = absFloor(daysToMonths(days2)), months2 += monthsFromDays, days2 -= absCeil(monthsToDays(monthsFromDays)), years2 = absFloor(months2 / 12), months2 %= 12, data.days = days2, data.months = months2, data.years = years2, this;
    }
    function daysToMonths(days2) {
      return days2 * 4800 / 146097;
    }
    function monthsToDays(months2) {
      return months2 * 146097 / 4800;
    }
    function as(units) {
      if (!this.isValid())
        return NaN;
      var days2, months2, milliseconds2 = this._milliseconds;
      if (units = normalizeUnits(units), units === "month" || units === "quarter" || units === "year")
        switch (days2 = this._days + milliseconds2 / 864e5, months2 = this._months + daysToMonths(days2), units) {
          case "month":
            return months2;
          case "quarter":
            return months2 / 3;
          case "year":
            return months2 / 12;
        }
      else
        switch (days2 = this._days + Math.round(monthsToDays(this._months)), units) {
          case "week":
            return days2 / 7 + milliseconds2 / 6048e5;
          case "day":
            return days2 + milliseconds2 / 864e5;
          case "hour":
            return days2 * 24 + milliseconds2 / 36e5;
          case "minute":
            return days2 * 1440 + milliseconds2 / 6e4;
          case "second":
            return days2 * 86400 + milliseconds2 / 1e3;
          case "millisecond":
            return Math.floor(days2 * 864e5) + milliseconds2;
          default:
            throw new Error("Unknown unit " + units);
        }
    }
    function makeAs(alias) {
      return function() {
        return this.as(alias);
      };
    }
    var asMilliseconds = makeAs("ms"), asSeconds = makeAs("s"), asMinutes = makeAs("m"), asHours = makeAs("h"), asDays = makeAs("d"), asWeeks = makeAs("w"), asMonths = makeAs("M"), asQuarters = makeAs("Q"), asYears = makeAs("y"), valueOf$1 = asMilliseconds;
    function clone$1() {
      return createDuration(this);
    }
    function get$2(units) {
      return units = normalizeUnits(units), this.isValid() ? this[units + "s"]() : NaN;
    }
    function makeGetter(name) {
      return function() {
        return this.isValid() ? this._data[name] : NaN;
      };
    }
    var milliseconds = makeGetter("milliseconds"), seconds = makeGetter("seconds"), minutes = makeGetter("minutes"), hours = makeGetter("hours"), days = makeGetter("days"), months = makeGetter("months"), years = makeGetter("years");
    function weeks() {
      return absFloor(this.days() / 7);
    }
    var round = Math.round, thresholds = {
      ss: 44,
      // a few seconds to seconds
      s: 45,
      // seconds to minute
      m: 45,
      // minutes to hour
      h: 22,
      // hours to day
      d: 26,
      // days to month/week
      w: null,
      // weeks to month
      M: 11
      // months to year
    };
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale2) {
      return locale2.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }
    function relativeTime$1(posNegDuration, withoutSuffix, thresholds2, locale2) {
      var duration = createDuration(posNegDuration).abs(), seconds2 = round(duration.as("s")), minutes2 = round(duration.as("m")), hours2 = round(duration.as("h")), days2 = round(duration.as("d")), months2 = round(duration.as("M")), weeks2 = round(duration.as("w")), years2 = round(duration.as("y")), a = seconds2 <= thresholds2.ss && ["s", seconds2] || seconds2 < thresholds2.s && ["ss", seconds2] || minutes2 <= 1 && ["m"] || minutes2 < thresholds2.m && ["mm", minutes2] || hours2 <= 1 && ["h"] || hours2 < thresholds2.h && ["hh", hours2] || days2 <= 1 && ["d"] || days2 < thresholds2.d && ["dd", days2];
      return thresholds2.w != null && (a = a || weeks2 <= 1 && ["w"] || weeks2 < thresholds2.w && ["ww", weeks2]), a = a || months2 <= 1 && ["M"] || months2 < thresholds2.M && ["MM", months2] || years2 <= 1 && ["y"] || ["yy", years2], a[2] = withoutSuffix, a[3] = +posNegDuration > 0, a[4] = locale2, substituteTimeAgo.apply(null, a);
    }
    function getSetRelativeTimeRounding(roundingFunction) {
      return roundingFunction === void 0 ? round : typeof roundingFunction == "function" ? (round = roundingFunction, !0) : !1;
    }
    function getSetRelativeTimeThreshold(threshold, limit) {
      return thresholds[threshold] === void 0 ? !1 : limit === void 0 ? thresholds[threshold] : (thresholds[threshold] = limit, threshold === "s" && (thresholds.ss = limit - 1), !0);
    }
    function humanize(argWithSuffix, argThresholds) {
      if (!this.isValid())
        return this.localeData().invalidDate();
      var withSuffix = !1, th = thresholds, locale2, output;
      return typeof argWithSuffix == "object" && (argThresholds = argWithSuffix, argWithSuffix = !1), typeof argWithSuffix == "boolean" && (withSuffix = argWithSuffix), typeof argThresholds == "object" && (th = Object.assign({}, thresholds, argThresholds), argThresholds.s != null && argThresholds.ss == null && (th.ss = argThresholds.s - 1)), locale2 = this.localeData(), output = relativeTime$1(this, !withSuffix, th, locale2), withSuffix && (output = locale2.pastFuture(+this, output)), locale2.postformat(output);
    }
    var abs$1 = Math.abs;
    function sign(x) {
      return (x > 0) - (x < 0) || +x;
    }
    function toISOString$1() {
      if (!this.isValid())
        return this.localeData().invalidDate();
      var seconds2 = abs$1(this._milliseconds) / 1e3, days2 = abs$1(this._days), months2 = abs$1(this._months), minutes2, hours2, years2, s, total = this.asSeconds(), totalSign, ymSign, daysSign, hmsSign;
      return total ? (minutes2 = absFloor(seconds2 / 60), hours2 = absFloor(minutes2 / 60), seconds2 %= 60, minutes2 %= 60, years2 = absFloor(months2 / 12), months2 %= 12, s = seconds2 ? seconds2.toFixed(3).replace(/\.?0+$/, "") : "", totalSign = total < 0 ? "-" : "", ymSign = sign(this._months) !== sign(total) ? "-" : "", daysSign = sign(this._days) !== sign(total) ? "-" : "", hmsSign = sign(this._milliseconds) !== sign(total) ? "-" : "", totalSign + "P" + (years2 ? ymSign + years2 + "Y" : "") + (months2 ? ymSign + months2 + "M" : "") + (days2 ? daysSign + days2 + "D" : "") + (hours2 || minutes2 || seconds2 ? "T" : "") + (hours2 ? hmsSign + hours2 + "H" : "") + (minutes2 ? hmsSign + minutes2 + "M" : "") + (seconds2 ? hmsSign + s + "S" : "")) : "P0D";
    }
    var proto$2 = Duration.prototype;
    proto$2.isValid = isValid$1, proto$2.abs = abs, proto$2.add = add$1, proto$2.subtract = subtract$1, proto$2.as = as, proto$2.asMilliseconds = asMilliseconds, proto$2.asSeconds = asSeconds, proto$2.asMinutes = asMinutes, proto$2.asHours = asHours, proto$2.asDays = asDays, proto$2.asWeeks = asWeeks, proto$2.asMonths = asMonths, proto$2.asQuarters = asQuarters, proto$2.asYears = asYears, proto$2.valueOf = valueOf$1, proto$2._bubble = bubble, proto$2.clone = clone$1, proto$2.get = get$2, proto$2.milliseconds = milliseconds, proto$2.seconds = seconds, proto$2.minutes = minutes, proto$2.hours = hours, proto$2.days = days, proto$2.weeks = weeks, proto$2.months = months, proto$2.years = years, proto$2.humanize = humanize, proto$2.toISOString = toISOString$1, proto$2.toString = toISOString$1, proto$2.toJSON = toISOString$1, proto$2.locale = locale, proto$2.localeData = localeData, proto$2.toIsoString = deprecate(
      "toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",
      toISOString$1
    ), proto$2.lang = lang, addFormatToken("X", 0, 0, "unix"), addFormatToken("x", 0, 0, "valueOf"), addRegexToken("x", matchSigned), addRegexToken("X", matchTimestamp), addParseToken("X", function(input, array, config) {
      config._d = new Date(parseFloat(input) * 1e3);
    }), addParseToken("x", function(input, array, config) {
      config._d = new Date(toInt(input));
    });
    //! moment.js
    return hooks.version = "2.30.1", setHookCallback(createLocal), hooks.fn = proto, hooks.min = min, hooks.max = max, hooks.now = now, hooks.utc = createUTC, hooks.unix = createUnix, hooks.months = listMonths, hooks.isDate = isDate, hooks.locale = getSetGlobalLocale, hooks.invalid = createInvalid, hooks.duration = createDuration, hooks.isMoment = isMoment, hooks.weekdays = listWeekdays, hooks.parseZone = createInZone, hooks.localeData = getLocale, hooks.isDuration = isDuration, hooks.monthsShort = listMonthsShort, hooks.weekdaysMin = listWeekdaysMin, hooks.defineLocale = defineLocale, hooks.updateLocale = updateLocale, hooks.locales = listLocales, hooks.weekdaysShort = listWeekdaysShort, hooks.normalizeUnits = normalizeUnits, hooks.relativeTimeRounding = getSetRelativeTimeRounding, hooks.relativeTimeThreshold = getSetRelativeTimeThreshold, hooks.calendarFormat = getCalendarFormat, hooks.prototype = proto, hooks.HTML5_FMT = {
      DATETIME_LOCAL: "YYYY-MM-DDTHH:mm",
      // <input type="datetime-local" />
      DATETIME_LOCAL_SECONDS: "YYYY-MM-DDTHH:mm:ss",
      // <input type="datetime-local" step="1" />
      DATETIME_LOCAL_MS: "YYYY-MM-DDTHH:mm:ss.SSS",
      // <input type="datetime-local" step="0.001" />
      DATE: "YYYY-MM-DD",
      // <input type="date" />
      TIME: "HH:mm",
      // <input type="time" />
      TIME_SECONDS: "HH:mm:ss",
      // <input type="time" step="1" />
      TIME_MS: "HH:mm:ss.SSS",
      // <input type="time" step="0.001" />
      WEEK: "GGGG-[W]WW",
      // <input type="week" />
      MONTH: "YYYY-MM"
      // <input type="month" />
    }, hooks;
  });
})(moment$1);
var momentExports = moment$1.exports, moment = /* @__PURE__ */ getDefaultExportFromCjs(momentExports);
function extractValidationRulesFromContentfulField(field, widgetId) {
  const validations = field.validations ?? [], rules = [];
  "required" in field && field.required === !0 && rules.push({ flag: "presence", constraint: "required" }), field.type === "Integer" && rules.push({ flag: "integer" });
  for (const validation of validations)
    if (validation.unique)
      widgetId && widgetId !== "slugEditor" && console.warn(
        "Unique validation only supported on slug fields by default. Consider adding custom validation for other unique fields or changing field to 'slug'"
      );
    else if (validation.regexp?.pattern)
      rules.push({
        flag: "regex",
        constraint: {
          invert: !1,
          pattern: new RegExp(validation.regexp.pattern)
        }
      });
    else if (validation.range)
      validation.range?.min !== void 0 && rules.push({ flag: "min", constraint: validation.range.min }), validation.range?.max !== void 0 && rules.push({ flag: "max", constraint: validation.range.max });
    else if (validation.size?.min !== void 0)
      rules.push({ flag: "min", constraint: validation.size.min });
    else if (validation.size?.max !== void 0)
      rules.push({ flag: "max", constraint: validation.size.max });
    else if (validation.dateRange?.min !== void 0) {
      const min = moment(validation.dateRange.min);
      rules.push({
        flag: "custom",
        constraint: (value) => moment(value).isAfter(min) ? !0 : `Value should be no earlier than ${min.toLocaleString()}`
      });
    } else if (validation.dateRange?.max !== void 0) {
      const max = moment(validation.dateRange.max);
      rules.push({
        flag: "custom",
        constraint: (value) => moment(value).isBefore(max) ? !0 : `Value should be no later than ${max.toLocaleString()}`
      });
    } else if (Array.isArray(validation.in)) {
      const values = validation.in;
      rules.push({
        flag: "custom",
        // @ts-expect-error We want full contol over the validation function string
        constraint: `(value) => validateIn(${JSON.stringify(values)}, value)`
      });
    }
  return rules;
}
function contentfulFieldItemToSanityOfType(field, data) {
  const availableTypeIds = new Set((data.contentTypes ?? []).map((type) => type.sys.id)), validationRules = extractValidationRulesFromContentfulField(field), onlyAllowValues = field.validations?.find((validation) => !!validation.in)?.in, linkContentTypeValidation = field.validations?.find(
    (validation) => !!validation.linkContentType
  ), linkMimetypeGroupValidation = field.validations?.find(
    (validation) => !!validation.linkMimetypeGroup
  );
  if (field.type === "Symbol")
    return stringFieldSchemaFactory("string").validation(validationRules).options({ list: onlyAllowValues?.map((v) => String(v)) }).anonymous();
  if (field.type === "Link") {
    if (field.linkType === "Asset")
      return linkMimetypeGroupValidation?.linkMimetypeGroup?.includes("image") && linkMimetypeGroupValidation?.linkMimetypeGroup.length === 1 ? imageFieldSchemaFactory("image").validation(validationRules).anonymous() : fileFieldSchemaFactory("file").validation(validationRules).anonymous();
    const factory = referenceFieldSchemaFactory("reference").validation(validationRules);
    return linkContentTypeValidation?.linkContentType?.length ? factory.to(
      linkContentTypeValidation.linkContentType.filter((type) => availableTypeIds.has(type)).map((type) => ({
        type: contentfulTypeNameToSanityTypeName(type).name
      }))
    ) : data.contentTypes && factory.to(
      data.contentTypes.map((type) => ({
        type: contentfulTypeNameToSanityTypeName(type.sys.id).name
      }))
    ), factory.anonymous();
  }
  return null;
}
const allStyles = [
  { title: "Normal text", value: "normal" },
  { title: "Heading 1", value: "h1" },
  { title: "Heading 2", value: "h2" },
  { title: "Heading 3", value: "h3" },
  { title: "Heading 4", value: "h4" },
  { title: "Heading 5", value: "h5" },
  { title: "Heading 6", value: "h6" },
  { title: "Quote", value: "blockquote" },
  { title: "Separator", value: "hr" }
], allLists = [
  { title: "Bullet", value: "bullet" },
  { title: "Numbered", value: "number" }
], allDecoratorMarks = [
  { title: "Strong", value: "strong" },
  { title: "Emphasis", value: "em" },
  { title: "Code", value: "code" },
  { title: "Underline", value: "underline" },
  { title: "Strike", value: "strike-through" }
], isStyleSupportedFns = {
  h1: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("heading-1")),
  h2: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("heading-2")),
  h3: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("heading-3")),
  h4: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("heading-4")),
  h5: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("heading-5")),
  h6: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("heading-6")),
  blockquote: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("blockquote"))
}, isListSupportedFns = {
  bullet: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("unordered-list")),
  number: (enabledNodeTypes) => !!(enabledNodeTypes && enabledNodeTypes.includes("ordered-list"))
}, isMarkSupportedFns = {
  strong: (enabledMarks) => !!(enabledMarks && enabledMarks.includes("bold")),
  em: (enabledMarks) => !!(enabledMarks && enabledMarks.includes("italic")),
  underline: (enabledMarks) => !!(enabledMarks && enabledMarks.includes("underline")),
  code: (enabledMarks) => !!(enabledMarks && enabledMarks.includes("code"))
};
function extractContentfulRichTextFieldParameters(field, data) {
  const availableTypeIds = new Set((data.contentTypes ?? []).map((type) => type.sys.id)), enabledNodeTypesValidation = field.validations?.find(
    (validation) => !!validation.enabledNodeTypes
  ), enabledMarksValidation = field.validations?.find(
    (validation) => !!validation.enabledMarks
  ), nodesValidation = field.validations?.find((validation) => !!validation.nodes), canUseHyperLinks = enabledNodeTypesValidation?.enabledNodeTypes?.includes("hyperlink"), canUseAssetLinks = enabledNodeTypesValidation?.enabledNodeTypes?.includes("asset-hyperlink"), canUseEntryLinks = enabledNodeTypesValidation?.enabledNodeTypes?.includes("entry-hyperlink"), canEmbedAssets = enabledNodeTypesValidation?.enabledNodeTypes?.includes("embedded-asset-block"), canEmbedEntries = enabledNodeTypesValidation?.enabledNodeTypes?.includes("embedded-entry-block"), canEmbedEntriesInline = enabledNodeTypesValidation?.enabledNodeTypes?.includes("embedded-entry-inline"), canUseBreaks = enabledNodeTypesValidation?.enabledNodeTypes?.includes("hr"), supportedStyles = allStyles.filter(
    (style) => !!isStyleSupportedFns[style.value]?.(enabledNodeTypesValidation?.enabledNodeTypes)
  ), supportedLists = allLists.filter(
    (list) => !!isListSupportedFns[list.value]?.(enabledNodeTypesValidation?.enabledNodeTypes)
  ), supportedMarks = allDecoratorMarks.filter(
    (mark) => !!isMarkSupportedFns[mark.value]?.(enabledMarksValidation?.enabledMarks)
  );
  let supportedEmbeddedInlineTypes;
  canEmbedEntriesInline && (nodesValidation?.nodes?.["embedded-entry-inline"] ? supportedEmbeddedInlineTypes = nodesValidation.nodes["embedded-entry-inline"]?.reduce(
    (acc, value) => value.linkContentType ? [
      ...acc,
      ...value.linkContentType.filter((type) => availableTypeIds.has(type)).map((type) => ({ type }))
    ] : acc,
    []
  ) : supportedEmbeddedInlineTypes = [...availableTypeIds].map((type) => ({ type })));
  let supportedEmbeddedBlockTypes;
  canEmbedEntries && (nodesValidation?.nodes?.["embedded-entry-block"] ? supportedEmbeddedBlockTypes = nodesValidation.nodes["embedded-entry-block"]?.reduce(
    (acc, value) => value.linkContentType ? [
      ...acc,
      ...value.linkContentType.filter((type) => availableTypeIds.has(type)).map((type) => ({ type }))
    ] : acc,
    []
  ) : supportedEmbeddedBlockTypes = [...availableTypeIds].map((type) => ({ type })));
  let supportedEntryLinkTypes;
  return canUseEntryLinks && (nodesValidation?.nodes?.["entry-hyperlink"] ? supportedEntryLinkTypes = nodesValidation.nodes["entry-hyperlink"]?.reduce(
    (acc, value) => value.linkContentType ? [
      ...acc,
      ...value.linkContentType.filter((type) => availableTypeIds.has(type)).map((type) => ({ type }))
    ] : acc,
    []
  ) : supportedEntryLinkTypes = [...availableTypeIds].map((type) => ({ type }))), {
    canUseHyperLinks,
    canUseAssetLinks,
    canUseEntryLinks,
    canEmbedAssets,
    canEmbedEntries,
    canEmbedEntriesInline,
    canUseBreaks,
    supportedEmbeddedInlineTypes,
    supportedEmbeddedBlockTypes,
    styles: supportedStyles,
    lists: supportedLists,
    marks: {
      decorators: supportedMarks,
      annotations: compact__default.default([
        canUseHyperLinks && {
          type: "object",
          name: "link",
          title: "url",
          fields: [
            {
              type: "string",
              name: "href",
              title: "URL",
              validation: [{ flag: "presence", constraint: "required" }]
            },
            {
              type: "string",
              name: "target",
              title: "Target",
              options: {
                list: [
                  { value: "_blank", title: "Blank" },
                  { value: "_parent", title: "Parent" }
                ]
              }
            }
          ]
        },
        canUseEntryLinks && supportedEntryLinkTypes?.length && {
          type: "reference",
          name: "reference",
          title: "Reference",
          to: supportedEntryLinkTypes.map((linkType) => ({
            type: contentfulTypeNameToSanityTypeName(linkType.type).name
          }))
        },
        ...canUseAssetLinks ? [{ type: "image" }, { type: "file" }] : []
      ])
    }
  };
}
const BuiltInContentfulEditors = {
  Integer: "numberEditor",
  Number: "numberEditor",
  Symbol: "singleLine",
  Location: "locationEditor",
  Boolean: "boolean",
  Date: "datePicker",
  Object: "objectEditor"
};
function contentfulFieldToSanityField(contentType, field, data, flags) {
  const control = findEditorControlForField(field.id, contentType.sys.id, data);
  if (control) {
    const availableTypeIds = new Set((data.contentTypes ?? []).map((type) => type.sys.id)), widgetId = control.widgetId || BuiltInContentfulEditors[field.type], defaultValue = field.defaultValue, helpText = control.settings?.helpText;
    let onlyAllowValues = field.validations?.find((validation) => !!validation.in)?.in;
    const validationRules = extractValidationRulesFromContentfulField(field, widgetId);
    if (field.type === "Symbol") {
      if (widgetId === "urlEditor")
        return urlFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation([
          ...validationRules,
          {
            flag: "uri",
            constraint: {
              options: {
                allowCredentials: !0,
                allowRelative: !0,
                relativeOnly: !1,
                scheme: [/^http/, /^https/]
              }
            }
          }
        ]).build();
      if (widgetId === "slugEditor") {
        const sourceField = control.settings?.trackingFieldId || contentType.displayField, factory2 = slugFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue), options = {
          source: sourceField
        };
        let slugValidation = validationRules.filter((rule) => rule.flag !== "unique");
        const size = field.validations?.find((validation) => !!validation.size)?.size;
        return size?.max && (options.maxLength = size.max, slugValidation = slugValidation.filter((rule) => rule.flag !== "max")), factory2.validation(slugValidation), factory2.options(options), factory2.build();
      }
      const factory = stringFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules);
      return factory.options({
        list: onlyAllowValues?.length ? onlyAllowValues.map((v) => String(v)) : void 0,
        layout: widgetId === "radio" || widgetId === "dropdown" ? widgetId : void 0
      }), factory.build();
    }
    if (field.type === "Boolean") {
      const factory = booleanFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules);
      return (control.settings?.trueLabel || control.settings?.falseLabel) && console.warn(`Custom True and False labels are not supported by default (${field.id})`), factory.build();
    }
    if (field.type === "Date") {
      const ampm = control.settings?.ampm ?? 24, format = control.settings?.format ?? "timeZ";
      return format === "dateonly" ? dateFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules).build() : datetimeFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules).options({
        timeFormat: `${ampm === 12 ? "h:mm a" : "H:mm"}${format === "timeZ" ? "Z" : ""}`
      }).build();
    }
    if (field.type === "Location")
      return geopointFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).validation(validationRules).build();
    if (field.type === "Number" || field.type === "Integer") {
      if (widgetId === "rating" && !onlyAllowValues?.length) {
        const maxValue = Number(control.settings?.stars ?? 5), onlyValues = [];
        for (let i = 1; i <= maxValue; i++)
          onlyValues.push(i);
        onlyAllowValues = onlyValues;
      }
      const factory = numberFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules);
      return factory.options({
        list: onlyAllowValues?.length ? onlyAllowValues.map((v) => Number.parseFloat(String(v))) : void 0,
        layout: widgetId === "radio" || widgetId === "dropdown" ? widgetId : void 0
      }), factory.build();
    }
    if (field.type === "Text")
      return widgetId === "singleLine" ? stringFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules).build() : widgetId === "multipleLine" || widgetId === "markdown" && flags.keepMarkdown ? textFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules).build() : arrayFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules).of([
        blockFieldSchemaFactory("block").anonymous(),
        imageFieldSchemaFactory("image").anonymous()
      ]).build();
    if (field.type === "RichText") {
      const richTextOptions = extractContentfulRichTextFieldParameters(field, data), blockFactory = blockFieldSchemaFactory("block").styles(richTextOptions.styles).lists(richTextOptions.lists).marks(richTextOptions.marks);
      richTextOptions.canEmbedEntriesInline && richTextOptions.supportedEmbeddedInlineTypes?.length && blockFactory.of([
        {
          type: "reference",
          title: "Reference",
          // @ts-expect-error - the types for LinkedType are wrong in this
          // project. It should have a `to` property
          to: richTextOptions.supportedEmbeddedInlineTypes.map((linkType) => ({
            type: contentfulTypeNameToSanityTypeName(linkType.type).name
          }))
        }
      ]);
      const factory = arrayFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).initialValue(defaultValue).validation(validationRules);
      return factory.of([
        blockFactory.anonymous(),
        ...richTextOptions.canEmbedEntries && richTextOptions.supportedEmbeddedBlockTypes?.length ? [
          {
            type: "reference",
            title: "Reference",
            // @ts-expect-error - the types for LinkedType are wrong in this
            // project. It should have a `to` property
            to: richTextOptions.supportedEmbeddedBlockTypes.map((linkType) => ({
              type: contentfulTypeNameToSanityTypeName(linkType.type).name
            }))
          }
        ] : [],
        ...richTextOptions.canEmbedAssets ? [{ type: "image" }, { type: "file" }] : [],
        ...richTextOptions.canUseBreaks ? [{ type: "break" }] : []
      ]), factory.build();
    }
    if (field.type === "Link") {
      const linkContentTypeValidation = field.validations?.find(
        (validation) => !!validation.linkContentType
      ), linkMimetypeGroupValidation = field.validations?.find(
        (validation) => !!validation.linkMimetypeGroup
      );
      if (field.linkType === "Asset")
        return linkMimetypeGroupValidation?.linkMimetypeGroup?.includes("image") && linkMimetypeGroupValidation?.linkMimetypeGroup.length === 1 ? imageFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).validation(validationRules).build() : fileFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).validation(validationRules).build();
      const factory = referenceFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).validation(validationRules);
      return linkContentTypeValidation?.linkContentType?.length ? factory.to(
        linkContentTypeValidation.linkContentType.filter((type) => availableTypeIds.has(type)).map((type) => ({
          type: contentfulTypeNameToSanityTypeName(type).name
        }))
      ) : data.contentTypes && factory.to(
        data.contentTypes.map((type) => ({
          type: contentfulTypeNameToSanityTypeName(type.sys.id).name
        }))
      ), factory.build();
    }
    if (field.type === "Array") {
      const factory = arrayFieldSchemaFactory(field.id).title(field.name).hidden(field.disabled).description(helpText).validation(validationRules);
      if (widgetId === "entryCardsEditor" && factory.options({ layout: "grid" }), widgetId === "tagEditor" && factory.options({ layout: "tags" }), field.items) {
        const ofType = contentfulFieldItemToSanityOfType(field.items, data);
        if (ofType) {
          factory.of([ofType]);
          const itemListValues = ofType.options?.list;
          widgetId === "checkbox" && itemListValues?.length && factory.options({
            list: itemListValues.map((value) => ({
              value: typeof value == "string" ? String(value) : value.value,
              title: typeof value == "string" ? String(value) : value.title
            }))
          });
        }
      }
      return factory.build();
    }
    field.type === "Object" && console.warn(
      "Found unstructured JSON field, suggest you add a schema for it later",
      `${contentType.name}.${field.name}`
    );
  }
  return null;
}
function contentfulTypeToSanitySchema(contentType, data, flags) {
  const { isCollision, name } = contentfulTypeNameToSanityTypeName(contentType.sys.id);
  isCollision && console.warn(
    `The Contentful content type "${contentType.sys.id}" is a reserved name in Sanity. Renaming to "contentful_${contentType.sys.id}"`
  );
  const schemaType = {
    type: "document",
    name,
    title: contentType.name,
    description: contentType.description,
    fields: []
  };
  if (contentType.displayField) {
    const control = findEditorControlForField(contentType.displayField, contentType.sys.id, data);
    schemaType.preview = {
      select: {
        title: control?.widgetId === "slugEditor" ? `${contentType.displayField}.current` : contentType.displayField
      }
    };
  }
  return schemaType.fields = compact__default.default(
    contentType.fields.filter(({ omitted }) => !omitted).map((field) => contentfulFieldToSanityField(contentType, field, data, flags))
  ), schemaType.type == "document" && (schemaType.fields.push({
    type: "boolean",
    description: "If this document was archived on Contentful at the time of export, the document will be in a read-only state.",
    name: "contentfulArchived",
    readOnly: !0
  }), schemaType.readOnly = ({ document }) => document?.contentfulArchived === !0), schemaType;
}
const serializeRuleSpecToCode = (ruleSpec) => {
  switch (ruleSpec.flag) {
    case "uri":
      return `uri(${javascriptStringify.stringify(ruleSpec.constraint.options)})`;
    case "presence":
      return ruleSpec.constraint === "optional" ? "" : "required()";
    case "unique":
      return "unique()";
    case "min":
      return `min(${ruleSpec.constraint})`;
    case "max":
      return `max(${ruleSpec.constraint})`;
    case "integer":
      return "integer()";
    case "length":
      return `length(${ruleSpec.constraint})`;
    case "email":
      return "email()";
    case "stringCasing":
      return ruleSpec.constraint === "lowercase" ? "lowercase()" : "uppercase()";
    case "regex":
      return `regex(${ruleSpec.constraint.pattern.toString()}, ${javascriptStringify.stringify(
        omit__default.default(ruleSpec.constraint, ["pattern"])
      )})`;
    case "custom":
      return `custom(${ruleSpec.constraint.toString()})`;
    default:
      throw new Error("Unknown rule spec: " + ruleSpec.flag);
  }
};
async function contentfulToStudioSchema(data, opts) {
  const schemas = compact__default.default(
    data.contentTypes.map((type) => data && contentfulTypeToSanitySchema(type, data, opts))
  );
  if (data.editorInterfaces?.some(
    (editor) => editor.controls?.some((ctrl) => ctrl.widgetId === "richTextEditor")
  )) {
    const alreadyHasBreakSchema = schemas.some(({ name }) => name === "break");
    alreadyHasBreakSchema && console.warn(
      'Found user-defined content model called "break". Be aware this could result in broken portable text'
    ), alreadyHasBreakSchema || schemas.push({
      name: "break",
      title: "Break",
      type: "object",
      fields: [
        // @ts-expect-error - @TODO fix up the schema definitions
        stringFieldSchemaFactory("style").options({
          list: [
            { title: "Line break", value: "lineBreak" },
            { title: "Read more", value: "readMore" }
          ]
        }).build()
      ]
    });
  }
  if (data.tags?.length) {
    const alreadyHasTagSchema = schemas.some(({ name }) => name === "tag");
    alreadyHasTagSchema && console.warn(
      'Found user-defined content model called "tag". Please review manually as this could conflict with the tags data import from contentful'
    ), alreadyHasTagSchema || schemas.push({
      name: "tag",
      title: "Tag",
      type: "document",
      fields: [
        // @ts-expect-error - @TODO fix up the schema definitions
        stringFieldSchemaFactory("name").title("Name").validation([{ flag: "presence", constraint: "required" }]).build()
      ]
    });
  }
  const useMultiLocale = opts.intlMode === "multiple", defaultLocale = data.locales?.find((locale) => !!locale.default);
  if (!defaultLocale)
    throw new ContentfulNoDefaultLocaleError();
  const allSchemaTypes = schemas.map((schema2) => {
    const identifier = `${Case__default.default.camel(schema2.name)}Type`, stringifiedDefinition = javascriptStringify.stringify(schema2, (value, space, next, key) => key === "validation" ? Array.isArray(value) && value.length > 0 ? `Rule => Rule.${value.map((r) => serializeRuleSpecToCode(r)).join(".")}` : void 0 : opts.typescript && key === "fields" ? Array.isArray(value) && value.length > 0 ? `[${value.map((v, k) => `defineField(${next(v, k)})`).join(",")}]` : void 0 : next(key === "initialValue" && !useMultiLocale ? value[defaultLocale.code] : value, key)), definition = `
    export const ${schema2.name}Type = ${opts.typescript ? `defineType(${stringifiedDefinition})` : stringifiedDefinition};`;
    return { identifier, definition };
  }), typesConcatList = allSchemaTypes.map((t) => `  ${t.identifier},`).join(`
`), result = `// generated by contentful-to-sanity
${opts.typescript ? 'import {defineField, defineType, type SchemaTypeDefinition} from "sanity";' : ""}

${opts.typescript ? "const validateIn = (values: (string | number)[], value: any) => values.includes(value) ? true : `Value must be one of ${values.join(', ')}`" : "const validateIn = (values, value) => values.includes(value) ? true : `Value must be one of ${values.join(', ')}`"}

${allSchemaTypes.map((t) => t.definition).join(`

`)}


export const types = [
  ${typesConcatList}
] ${opts.typescript ? "satisfies SchemaTypeDefinition[];" : ""}
  `;
  return await formatWithPrettier(opts.filepath, result);
}
const formatWithPrettier = async (filepath, content) => {
  const config = await prettier__default.default.resolveConfig(filepath);
  return prettier__default.default.format(content, {
    ...config,
    filepath
  });
};
async function schemaAction({
  exportDir: _exportDir,
  schemaFile,
  exportFile,
  intl: intlMode,
  keepMarkdown
}) {
  const exportDir = absolutify(_exportDir);
  invariant__default.default(isAbsolutePath__default.default(exportDir), "exportDir must be an absolute path");
  const exportFilePath = path__default.default.join(exportDir, exportFile);
  invariant__default.default(
    isAbsolutePath__default.default(exportFilePath),
    `exportFilePath must be an absolute path: ${exportFilePath}`
  );
  const schemaFilePath = path__default.default.join(exportDir, schemaFile);
  invariant__default.default(
    isAbsolutePath__default.default(schemaFilePath),
    `schemaFilePath must be an absolute path: ${schemaFilePath}`
  );
  const typescript = schemaFile.endsWith(".ts"), data = JSON.parse(await promises.readFile(exportFilePath, "utf8")), schemaTypes = await contentfulToStudioSchema(data, {
    typescript,
    intlMode,
    keepMarkdown,
    filepath: schemaFilePath
  });
  await promises.writeFile(schemaFilePath, schemaTypes);
}
async function batchAction({
  datasetFile,
  environmentId,
  exportDir,
  exportFile,
  intl,
  intlIdStructure,
  keepMarkdown,
  optimizeSvgs,
  convertImages,
  locale,
  managementToken,
  accessToken,
  saveFile,
  schemaFile,
  spaceId,
  weakRefs
}) {
  await exportAction({
    environmentId,
    exportDir,
    exportFile,
    managementToken,
    accessToken,
    saveFile,
    spaceId
  }), await Promise.allSettled([
    schemaAction({
      exportDir,
      exportFile,
      intl,
      keepMarkdown,
      schemaFile
    }),
    datasetAction({
      datasetFile,
      exportDir,
      exportFile,
      intl,
      intlIdStructure,
      keepMarkdown,
      optimizeSvgs,
      convertImages,
      locale,
      weakRefs
    })
  ]);
}
function filenameReservedRegex() {
  return /[<>:"/\\|?*\u0000-\u001F]/g;
}
function windowsReservedNameRegex() {
  return /^(con|prn|aux|nul|com\d|lpt\d)$/i;
}
function isValidFilename(string) {
  return !(!string || string.length > 255 || filenameReservedRegex().test(string) || windowsReservedNameRegex().test(string) || string === "." || string === "..");
}
const datasetActionArgs = zod.z.object({
  exportDir: zod.z.string().refine(isRelativePath__default.default),
  exportFile: zod.z.string().refine(isValidFilename),
  datasetFile: zod.z.string().endsWith(".ndjson").refine(isValidFilename),
  intl: zod.z.enum(["single", "multiple"]).default("single"),
  weakRefs: zod.z.boolean(),
  keepMarkdown: zod.z.boolean(),
  optimizeSvgs: zod.z.boolean(),
  convertImages: zod.z.boolean(),
  intlIdStructure: zod.z.enum(["subpath", "delimiter"]).default("delimiter"),
  locale: zod.z.string().optional()
}), exportActionArgs = zod.z.object({
  exportDir: zod.z.string().refine(isRelativePath__default.default),
  spaceId: zod.z.string(),
  managementToken: zod.z.string(),
  accessToken: zod.z.string(),
  environmentId: zod.z.string(),
  saveFile: zod.z.boolean(),
  exportFile: zod.z.string().endsWith(".json").refine(isValidFilename)
}), schemaActionArgs = zod.z.object({
  exportDir: zod.z.string().refine(isRelativePath__default.default),
  exportFile: zod.z.string().endsWith(".json").refine(isValidFilename),
  //schemaFile: z.string().endsWith('.js').refine(isValidFilename),
  schemaFile: zod.z.string().refine(isValidFilename),
  intl: zod.z.enum(["single", "multiple"]).default("single"),
  keepMarkdown: zod.z.boolean()
}), batchActionArgs = exportActionArgs.merge(schemaActionArgs).merge(datasetActionArgs);
function formatError(err) {
  return zodValidationError.isValidationErrorLike(err) ? err : err instanceof zod.z.ZodError ? zodValidationError.fromZodError(err) : err instanceof Error ? err : new Error("Unknown error", { cause: err });
}
exports.batchAction = batchAction;
exports.batchActionArgs = batchActionArgs;
exports.contentfulToDataset = contentfulToDataset;
exports.contentfulToStudioSchema = contentfulToStudioSchema;
exports.datasetAction = datasetAction;
exports.datasetActionArgs = datasetActionArgs;
exports.exportAction = exportAction;
exports.exportActionArgs = exportActionArgs;
exports.formatError = formatError;
exports.schemaAction = schemaAction;
exports.schemaActionArgs = schemaActionArgs;
//# sourceMappingURL=index.cjs.map
