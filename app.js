const {
  appendFile,
  extract_and_upload,
  genErrReport,
  getCSVLines
} = require("./fns.js");
const { csvFile, errFile } = require("./utils.js");

async function main() {
  try {
    const CSVLines = await getCSVLines(csvFile);
    if(!CSVLines) { throw new Error(`CSV READ ERR`); }
    CSVLines.forEach(extract_and_upload);
  } catch (err) {
    const content = genErrReport(err);
    appendFile(errFile, content)
      .catch(err => {});
  }
}

main();
