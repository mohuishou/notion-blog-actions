const { readFileSync, copyFileSync, writeFileSync } = require("fs");
const { glob } = require("glob");
const { dirname, join, extname, basename } = require("path");
const md5File = require("md5-file");
const { parse } = require("twemoji");

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
    console.log(`迁移文件图片: ${filepath}`);
    let md = readFileSync(filepath).toString();
    // 获取所有的图片
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
    console.log(`迁移: ${imgPath} --> ${newPath}`);
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
