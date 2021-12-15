const core = require("@actions/core");

try {
  const notion = require("./notion");
  let client = new notion({
    token: core.getInput("token"),
    token_v2: core.getInput("token_v2"),
    space_id: core.getInput("space_id"),
    database_id: core.getInput("database_id"),
    output: core.getInput("output"),
  });
  client.run();
} catch (error) {
  core.setFailed(error.message);
}
