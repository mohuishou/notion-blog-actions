const core = require("@actions/core");
const migrate = require("./migrate");

try {
  // 获取文件
  let m = new migrate({
    pattern: core.getInput("input"),
    output: core.getInput("output"),
    baseImgURL: core.getInput("base_img_url"),
  });
  m.run();
} catch (error) {
  core.setFailed(error.message);
}
