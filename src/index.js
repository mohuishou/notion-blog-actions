const notion = require("./notion");
const core = require("@actions/core");

let config = {
  notion_secret: core.getInput("notion_secret"),
  database_id: core.getInput("database_id"),
  migrate_image: core.getInput("migrate_image") === "true",
  aliyun: {
    accessKeyId: core.getInput("access_key_id"),
    accessKeySecret: core.getInput("access_key_secret"),
    bucket: core.getInput("bucket"),
    area: core.getInput("area"),
    path: core.getInput("prefix"),
    customUrl: "",
    options: "",
  },
  status: {
    name: core.getInput("status_name"),
    unpublish: core.getInput("status_unpublish"),
    published: core.getInput("status_published"),
  },
  output: core.getInput("output"),
};

(async function () {
  notion.init(config);
  await notion.sync();
})();
