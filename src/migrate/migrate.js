const { readFileSync, copyFileSync, writeFileSync } = require("fs");
const { glob } = require("glob");
const { dirname, join, extname, basename } = require("path");
const md5File = require("md5-file");
const { parse } = require("twemoji");
const crypto = require("crypto");

class migrate {
  /**
   * 文件
   * @param {string} pattern
   */
  constructor({ pattern, output, baseImgURL }) {
    this.pattern = pattern;
    this.output = output;
    this.baseImgURL = baseImgURL;
  }

  run() {
    let files = glob.sync(this.pattern);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.migrate(file);
    }
  }

  migrate(filepath) {
    console.log(`file images will be migrate: ${filepath}`);
    let md = readFileSync(filepath).toString();

    // 获取所有 md 图片
    let matchs = md.matchAll(/!\[(.*?)\]\((.*)\)/gi);
    for (const m of matchs) {
      if (m[2].includes("http")) {
        console.log(`${m[2]} is http image, skiped`);
        continue;
      }
      let name = m[1];
      if (name.includes("Untitled")) name = "";
      let filename = this.copy(filepath, m[2]);
      md = md.replace(m[0], `![${name}](${join(this.baseImgURL, filename)})`);
    }

    // 获取所有 <img> 标签的图片
    matchs = md.matchAll(/<img\s*src="(.*?)".*width="(.*?)"\s+\/>/gi);
    for (const m of matchs) {
      // 目前只实现了 svg base64 的图片
      if (m[1].includes("data:image/svg+xml")) {
        let data = m[1].replace("data:image/svg+xml;utf8,", "");
        let filename =
          crypto.createHash("md5").update(m[1]).digest("hex") + ".svg";
        writeFileSync(join(this.output, filename), decodeURIComponent(data));
        md = md.replace(
          m[0],
          `<img src="${join(this.baseImgURL, filename)}" width="${m[2]}">`
        );
        console.log("迁移 img: " + filepath);
      }
    }

    md = this.migrateFrontMatterImage(filepath, md);
    md = this.format(md);
    writeFileSync(filepath, md);
  }

  /**
   *
   * @param {string} page
   */
  migrateFrontMatterImage(filepath, page) {
    let matchs = page.matchAll(/.*img:\s(.*)/gi);
    for (const m of matchs) {
      let filename = this.copy(filepath, m[1]);
      page = page.replace(m[1], join(this.baseImgURL, filename));
    }
    return page;
  }

  copy(filepath, img) {
    img = img.replace(/^'/, "").replace(/'$/, "");
    img = img.replace(/^"/, "").replace(/"$/, "");
    let imgPath = join(dirname(filepath), img);
    imgPath = decodeURIComponent(imgPath);
    let hash = md5File.sync(imgPath);
    let filename = hash + extname(imgPath);
    let newPath = join(this.output, filename);
    console.log(`migrate: ${imgPath} --> ${newPath}`);
    copyFileSync(imgPath, newPath);
    return filename;
  }

  /**
   *
   * @param {string} page
   */
  format(page) {
    page = page.replace(/<aside>/gi, "<aside>\n");
    page = page.replace(/\n<\/aside>/gi, "</aside>");
    page = parse(page);
    return page;
  }
}

module.exports = migrate;
