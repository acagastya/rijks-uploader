const fs = require("fs");
const { promisify } = require("util");

const fetch = require("node-fetch");
const Wikiapi = require("wikiapi");

const { API, author, errFile, params, PASSWORD, statusFile, USERNAME, WIKI_API } = require("./utils.js");

const appendFile = promisify(fs.appendFile);
const readFile = promisify(fs.readFile);

async function addLicense(wiki, title, obj, id) {
  try {
    const wiki_page_data = await wiki.page(title);
    const page_content = wiki_page_data.wikitext;
    const cats = genCats(obj);
    const new_page_content = updateContent(page_content, cats);
    await wiki.edit_page(title, new_page_content);
    const content = `${id},DONE`;
    await appendFile(statusFile, content);
  } catch (err) {
    const content = genErrReport(err, id);
    appendFile(errFile, content).catch(e => {});
  }
}

async function extract_and_upload(line = '') {
  let collectionID, source;
  const wiki = new Wikiapi(WIKI_API);
  try {
    [collectionID, source] = parseLine(line);
    const collectionData = await getCollectionInfo(collectionID);
    if(!collectionData) { throw new Error(`RIJK RESP ERR`); }
    const { artObject } = collectionData;
    if(!artObject) { throw new Error(`artObj MISSING`); }
    const { copyrightStatus, hasImage, webImage, media_url } = getLicenseDetails(artObject);
    if( copyrightStatus || !hasImage || !webImage || !media_url ) {
      throw new Error(`COPYRIGHTED or MISSING IMAGE`);
    }
    const { date, description, title } = getInfoFields(artObject, collectionID);
    const { filename, complete_filename } = await getFilename(title, media_url);
    if(!filename) { throw new Error(`EXTENSION ERR`); }
    await wiki.login(USERNAME, PASSWORD);
    const uploadObj = getUploadObj(date, description, filename, media_url, source);
    await wiki.upload(uploadObj);
    await addLicense(wiki, complete_filename, artObject, collectionID);
  } catch (err) {
    const content = genErrReport(err, collectionID);
    appendFile(errFile, content).catch(err => {});
  }
}

function genCats(obj) {
  const types = obj.objectTypes;
  const collections = obj.objectCollection;
  const makers = obj.principalMakers.map(({name}) => name);
  const places = [...new Set(obj.principalMakers.reduce((acc, cur) => [...acc, ...cur.productionPlaces], []))];
  const collections_from_places = [];
  const collections_by_makers = [];
  for(const collection of collections) {
    for (const place of places)
      collections_from_places.push(`${collection} from ${place}`);
    for (const maker of makers)
      collections_by_makers.push(`${collection} by ${maker}`);
  }
  const allCats = [
    ...types,
    ...collections,
    ...makers,
    ...collections_from_places,
    ...collections_by_makers
  ];
  const finalCats = uniq(allCats);
  return finalCats;
}

function genErrReport(errObj, id, type) { 
  let errMsg = errObj.toString() || '';
  if (id) errMsg = `${id},${errMsg}`;
  if (type) errMsg += `,${type}`;
  if(!errMsg.endsWith('\n')) errMsg += "\n";
  return errMsg;
}

function getCatStr(cats = []) {
  cats.push('Media from Rijksmuseum');
  const str = cats.reduce((acc, cur) => `${acc}[[Category:${cur}]]\n`, "");
  return str;
}

async function getCollectionInfo(id = '') {
  try {
    const URI = `${API}${id}${params}`;
    const URI_data = await fetch(URI);
    const data = await URI_data.json();
    return data;
  } catch {}
}

async function getCSVLines(csvFile) {
  try {
    const file = await readFile(csvFile, { encoding: "utf8"});
    return file.split("\n");
  } catch {}
}

function getDate(obj) {
  const { yearEarly, yearLate } = obj.dating;
  const dateStr = `{{other date|~|${yearEarly}` + (yearEarly == yearLate ? '}}' : `|${yearLate}}}`);
  return dateStr;
}

function getDesctiption(obj, id) {
  const base = `${id} of Rijksmuseum.`;
  let desc_nl = '', desc_en = '';
  if(obj.description) desc_nl =  `{{nl|${obj.description}}}`;
  if(obj.plaqueDescriptionEnglish) desc_en = `{{en|${obj.plaqueDescriptionEnglish}}}`;
  const description = `${base}\n${desc_nl}${desc_en}`;
  return description;
}

async function getFilename(title, url) {
  try {
    const media = await fetch(url);
    const type = media.headers.get('content-type').split('/')[1];
    const filename = `${title}.${type}`;
    const complete_filename = `File:${filename}`;
    return { filename, complete_filename };
  } catch {}
}

function getInfoFields(obj, id) {
  const description = getDesctiption(obj, id);
  const title = getTitle(obj, id);
  const date = getDate(obj);
  return { date, description, title };
}

function getLicenseDetails(obj) {
  const copyrightStatus  = obj.copyrightHolder;
  const { hasImage, webImage } = obj;
  const media_url = webImage?.url;
  return { copyrightStatus, hasImage, webImage, media_url };
}

function getTitle(obj, id) {
  let title = obj.longTitle || obj.title;
  if (title) title += " ";
  title += `${id} - Rijksmuseum`;
  title = title.replace(/\[/g, '').replace(/\]/g, '');
  return title;
}

function getUploadObj(date, description, filename, media_url, source) {
  return {
    media_url,
    comment: "bot upload using API",
    filename,
    text: {
      author,
      date,
      description,
      source,
    },
  }
}

function parseLine(line = '') {
  const [colID, source, ...rest] = line.split(',');
  const collectionID = stripBOM(colID);
  return [collectionID, source];
}

function stripBOM(string = '') {
  return (string.charCodeAt(0) === 0xFEFF) ? string.slice(1) : string;
}

function uniq(arr = []) {
  return [...new Set(arr)];
}

function updateContent(old_text = '', cats = []) {
  let new_content = old_text;
  const catStr = getCatStr(cats);
  new_content += `\n== {{int:license-header}} ==\n{{cc-zero|Rijksmuseum}}\n\n${catStr}`;
  return new_content;
}

module.exports = {
  appendFile,
  extract_and_upload,
  genErrReport,
  getCSVLines
}