const path = require("path");

const dotenv = require("dotenv");
dotenv.config();

const API = "https://www.rijksmuseum.nl/api/en/collection/";
const author = "[[w:Rijksmuseum|Rijksmuseum]]";
const csvFile = path.join(__dirname, "..", "data.csv");
const { API_KEY, USERNAME, PASSWORD } = process.env;
const errFile = path.join(__dirname, "err.txt");
const params = `?format=json&key=${API_KEY}&culture=en`;
const statusFile = path.join(__dirname, "status.txt");
const WIKI_API = "https://commons.wikimedia.org/w/api.php";

module.exports = {
  API,
  author,
  csvFile,
  errFile,
  params,
  PASSWORD,
  statusFile,
  USERNAME,
  WIKI_API
}
