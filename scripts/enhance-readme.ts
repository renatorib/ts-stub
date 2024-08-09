import { replaceTag } from "comment-hole";
import { command } from "../src/command";

replaceTag("README.md", {
  "auto:help": () => "```\n" + command.helpInformation() + "\n```",
});
