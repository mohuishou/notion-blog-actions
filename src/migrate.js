const Migrater = require("picgo-plugin-pic-migrater/dist/lib/Migrater.js");
const FileHandler = require("picgo-plugin-pic-migrater/dist/lib/FileHandler.js");

class NotionMigrater extends Migrater.default {
  async getPicFromURL(url) {
    return this.ctx.request({
      url,
      encoding: null,
      responseType: "arraybuffer",
    });
  }

  async handlePicFromURL(url) {
    try {
      if (url.includes("data:image/svg+xml")) {
        let data = url.replace("data:image/svg+xml;utf8,", "");
        return {
          buffer: Buffer.from(decodeURIComponent(data), "utf-8"),
          fileName: `${new Date().getTime()}.svg`,
          extname: ".svg",
          origin: url,
        };
      }
      return super.handlePicFromURL(url);
    } catch (e) {
      this.ctx.log.error(`get pic from url fail: ${e}`);
      return undefined;
    }
  }
}

class NotionFileHandler extends FileHandler.default {
  getUrlListFromFileContent(file) {
    const content = this.fileList[file] || "";
    const markdownURLList = (content.match(/\!\[.*\]\(.*\)/g) || [])
      .map((item) => {
        const res = item.match(/\!\[.*\]\((.*?)( ".*")?\)/);
        if (res) {
          return res[1];
        }
        return null;
      })
      .filter((item) => item);

    const imageTagURLList = (content.match(/<img.*?(?:>|\/>)/gi) || [])
      .map((item) => {
        const res = item.match(/src=[\'\"]?(.*?)[\'\"]/i);
        if (res) return res[1];
        return null;
      })
      .filter((item) => item);

    let urls = markdownURLList.concat(imageTagURLList);

    // front matter
    let matchs = content.matchAll(/.*img:\s(.*)/gi);
    for (const m of matchs) {
      let src = m[1];
      src = src.replace(/^'/, "").replace(/'$/, "");
      src = src.replace(/^"/, "").replace(/"$/, "");
      src = src.trim();
      if (!src) continue;
      urls.push(src);
    }

    this.urlList[file] = {};
    for (const url of urls) {
      this.urlList[file][url] = url;
    }
  }
}

async function migrate(ctx, files) {
  ctx.log.info("Migrating...");

  let total = 0;
  let success = 0;

  for (const file of files) {
    const fileHandler = new NotionFileHandler(ctx);
    // read File
    fileHandler.read(file);
    const migrater = new NotionMigrater(ctx, null, file);
    migrater.init(fileHandler.getFileUrlList(file));

    // migrate pics
    const result = await migrater.migrate();

    if (result.total === 0) continue;

    total += result.total;
    success += result.success;
    if (result.success === 0) {
      ctx.log.warn(
        `Please check your configuration, since no images migrated successfully in ${file}`
      );
      return;
    }
    let content = fileHandler.getFileContent(file);
    // replace content
    result.urls.forEach((item) => {
      content = content.replaceAll(item.original, item.new);
    });
    fileHandler.write(file, content, "", true);
  }
  return { total, success };
}

module.exports = migrate;
