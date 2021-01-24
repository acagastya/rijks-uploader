const { appendFile, extractIdAndUpload, readFile } = require("./helperFns.js");
const { dataFile, errFile, statusFile } = require("./utils.js");

async function main() {
  try {
    const CSVData = await readFile(dataFile, { encoding: "utf8" });
    const CSVLines = CSVData.split("\n");
    CSVLines.forEach(async line => await extractIdAndUpload(line));
  } catch (err) {
    const errStr = err.toString();
    const content = errStr + "\n";
    await appendFile(errFile, content);
  } finally {
    const content = `ALL,DONE\n`;
    await appendFile(statusFile, content);
  }
}

main();
