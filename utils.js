const dotenv = require("dotenv");
dotenv.config();
const { API_KEY, USERNAME, PASSWORD } = process.env;

const path = require("path");

const dataFile = path.join(__dirname, "data.csv");
const errFile = path.join(__dirname, "err.txt");
const statusFile = path.join(__dirname, "status.txt");

const API = "https://www.rijksmuseum.nl/api/en/collection/";
const params = `?format=json&key=${API_KEY}&culture=en`;

const WIKI_API = "https://commons.wikimedia.org/w/api.php";

const author = "[[w:Rijksmuseum|Rijksmuseum]]";
const license = `{{cc-zero|Rijksmuseum}}`;
const LR = `{{LicenseReview}}`;
const cats = "[[Category:Media from Rijksmuseum]]\n[[Category:Uncategorized images of the Rijksmuseum]]";

module.exports = {
  API,
  dataFile,
  errFile,
  params,
  PASSWORD,
  USERNAME,
  WIKI_API,
  author,
  license,
  LR,
  cats,
  statusFile
};
