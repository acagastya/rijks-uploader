const fetch = require("node-fetch");
const Wikiapi = require("wikiapi");

const { promisify } = require("util");
const fs = require("fs");

const readFile = promisify(fs.readFile);
const appendFile = promisify(fs.appendFile);

const {
  author,
  cats,
  errFile,
  license,
  LR,
  params,
  statusFile,
  API,
  PASSWORD,
  USERNAME,
  WIKI_API,
} = require("./utils.js");

function getDate(dating) {
  const yearEarly = dating?.yearEarly || "";
  const yearLate = dating?.yearLate || "";
  return `{{other date|~|${yearEarly}|${yearLate}}}`;
}

function updateContent(pageContent = '', moreCats = []) {
  const moreCatsStr = moreCats.reduce((acc, cur) => acc + `[[Category:Uncategorised images of the Rijksmuseum (${cur})]]\n`, '');
  const finalCats = `${cats}\n${moreCatsStr}`;
  return (
    pageContent + `\n== {{int:license-header}} ==\n${license}\n${LR}\n\n${finalCats}`
  );
}

function getDesc(artObject, collectionID) {
  return (
    artObject?.description || `Collection ${collectionID} of the Rijksmuseum`
  );
}

function getTitle(artObject, collectionID) {
  let title = artObject?.longTitle || artObject?.title;
  if (title) title += " ";
  title += `${collectionID} - Rijksmuseum`;
  title = title.replace(/\[/g, '').replace(/\]/g, '');
  return title;
}

function getUploadObj(media_url, filename, date, description, source) {
  return {
    media_url,
    comment: "uploaded using API",
    filename,
    text: {
      author,
      date,
      description,
      source,
    },
    // ignorewarnings: 1,
  };
}

async function extractIdAndUpload(line) {
  try {
    const [colID, source, ...rest] = line.split(",");
    const collectionID = stripBOM(colID);
    const RijksAPIURL = `${API}${collectionID}${params}`;
    const rijksAPIresult = await fetch(RijksAPIURL);
    const jsonRijksAPIresult = await rijksAPIresult.json();
    const { artObject } = jsonRijksAPIresult;
    if (!artObject) {
      const content = `${collectionID},WRONG_RIJKS_API_RES\n`;
      throw new Error(content);
    }
    const copyrightStatus = artObject?.copyrightHolder;
    const { hasImage, webImage } = artObject;
    const media_url = webImage?.url;
    if (copyrightStatus || !hasImage || !webImage || !media_url) {
      const content = `${collectionID},COPYRIGHTED or MISSING IMAGE\n`;
      throw new Error(content);
    }
    const description = getDesc(artObject, collectionID);
    const title = getTitle(artObject, collectionID);
    const date = getDate(artObject?.dating);
    const media = await fetch(media_url);
    const media_blob = await media.blob();
    const fileExt = "." + media_blob?.type.split("/")[1];
    if (!fileExt) {
      const content = `${collectionID},MISSING EXT\n`;
      throw new Error(content);
    }
    const filename = title + fileExt;
    const wiki = new Wikiapi(WIKI_API);
    await wiki.login(USERNAME, PASSWORD);
    const uploadObj = getUploadObj(
      media_url,
      filename,
      date,
      description,
      source
    );
    await wiki.upload(uploadObj);
    const fileTitle = "File:" + filename;
    const pageData = await wiki.page(fileTitle);
    const pageContent = pageData?.wikitext;
    const moreCats = artObject?.objectCollection;
    const updatedContent = updateContent(pageContent, moreCats);
    await wiki.edit_page(fileTitle, updatedContent);
    const content = `${collectionID},DONE\n`;
    await appendFile(statusFile, content);
  } catch (err) {
    const errStr = err.toString();
    let content = errStr;
    if(!content.endsWith('\n')) content+="\n";
    await appendFile(errFile, content);
  }
}

function stripBOM(string = '') {
  return (string.charCodeAt(0) === 0xFEFF) ? string.slice(1) : string;
}

module.exports = {
  appendFile,
  extractIdAndUpload,
  getDate,
  getDesc,
  getTitle,
  getUploadObj,
  readFile,
  updateContent,
};
