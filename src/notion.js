const { Client } = require("@notionhq/client");
const { writeFileSync } = require("fs");
const { NotionToMarkdown } = require("notion-to-md");
const { parse } = require("twemoji");
const { getBlockChildren } = require("notion-to-md/build/utils/notion");
const YAML = require("yaml");
const { PicGo } = require("picgo");
const crypto = require("crypto");
const { extname, join } = require("path");
const Migrater = require("./migrate");
const { format } = require("prettier");

let config = {
  notion_secret: "",
  database_id: "",
  migrate_image: true,
  aliyun: {
    accessKeyId: "",
    accessKeySecret: "",
    bucket: "",
    area: "",
    path: "",
    customUrl: "",
    options: "",
  },
  status: {
    name: "",
    unpublish: "",
    published: "",
  },
  output: "",
};

let notion = new Client({ auth: config.notion_secret });
let picgo = new PicGo();
let n2m = new NotionToMarkdown({ notionClient: notion });

function init(conf) {
  config = conf;
  notion = new Client({ auth: config.notion_secret });

  picgo.setConfig({
    picBed: { uploader: "aliyun", current: "aliyun", aliyun: config.aliyun },
  });

  // 文件重命名为 md5
  picgo.on("beforeUpload", (ctx) => {
    ctx.output.forEach((item) => {
      let ext = extname(item.fileName);
      item.fileName =
        crypto.createHash("md5").update(item.buffer).digest("hex") + ext;
    });
  });

  // passing notion client to the option
  n2m = new NotionToMarkdown({ notionClient: notion });
  n2m.setCustomTransformer("callout", callout(n2m));
}

async function sync() {
  // 获取待发布的文章
  let pages = await getPages(config.database_id);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    console.log(`[${i + 1}]: ${page.properties.title.title[0].plain_text}`);
    let file = await download(page);
    if(config.migrate_image) await migrateImages(file);
    published(page);
  }
  if (pages.length == 0)
    console.log(`no pages ${config.status.name}: ${config.status.unpublish}`);
}

async function migrateImages(file) {
  let res = await Migrater(picgo, [file]);
  if (res.success != res.total)
    throw new Error(
      `file migrate img fail, total: ${res.total}, success: ${res.success}`
    );
}

async function getPages(database_id) {
  let resp = await notion.databases.query({
    database_id: database_id,
    filter: {
      property: config.status.name,
      select: {
        equals: config.status.unpublish,
      },
    },
  });
  return resp.results;
}

async function published(page) {
  let props = page.properties;
  props[config.status.name].select = { name: config.status.published };
  await notion.pages.update({
    page_id: page.id,
    properties: props,
  });
}

/**
 * 下载一篇文章
 * @param {*} page
 */
async function download(page) {
  const mdblocks = await n2m.pageToMarkdown(page.id);
  let md = n2m.toMarkdownString(mdblocks);

  let properties = props(page);
  fm = YAML.stringify(properties, { doubleQuotedAsJSON: true });
  md = `---\n${fm}---\n\n${md}`;

  let filename = properties.title;
  if (properties.urlname) filename = properties.urlname;
  let filepath = join(config.output, filename + ".md");

  md = format(md, { parser: "markdown" });
  writeFileSync(filepath, md);
  return filepath;
}

/**
 * 生成元数据
 * @param {*} page
 * @returns {Object}
 */
function props(page) {
  let data = {};
  for (const key in page.properties) {
    data[key] = getPropVal(page.properties[key]);
  }
  return data;
}

/**
 *
 * @param {ListBlockChildrenResponseResult} block
 */
function callout(n2m) {
  return async (block) => {
    let callout_str = block.callout.text.map((a) => a.plain_text).join("");
    if (!block.has_children) {
      return callout2md(callout_str, block.callout.icon);
    }

    const callout_children_object = await getBlockChildren(
      n2m.notionClient,
      block.id,
      100
    );
    // parse children blocks to md object
    const callout_children = await n2m.blocksToMarkdown(
      callout_children_object
    );

    callout_str +=
      "\n" + callout_children.map((child) => child.parent).join("\n\n");

    return callout2md(callout_str.trim(), block.callout.icon);
  };
}

function callout2md(str, icon) {
  return `<aside>\n${icon2md(icon)}${str}\n</aside>`.trim();
}

function icon2md(icon) {
  switch (icon.type) {
    case "emoji":
      return parse(icon.emoji);
    case "external":
      return `<img src="${icon.external.url}" width="25px" />\n`;
  }
  return "";
}

function getPropVal(data) {
  let val = data[data.type];
  switch (data.type) {
    case "multi_select":
      return val.map((a) => a.name);
    case "select":
      return val.name;
    case "date":
      return val.start;
    case "rich_text":
    case "title":
      return val.map((a) => a.plain_text).join("");
    case "text":
      return data.plain_text;
    case "files":
      if (val.length < 1) return "";
      return val[0][val[0].type].url;
    default:
      return val;
  }
}

module.exports = {
  sync,
  init,
};
