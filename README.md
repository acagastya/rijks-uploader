# Rijksmuseum uploader bot

Upload Public Domain files from Rijksmuseum.nl to Wikimedia Commons.

1. Download the CSV data of the list of all files on the website from [here](https://scan.rijkskoha.nl/adlibdumps/202001-rma-csv-collection.zip).
2. Name the csv as `data.csv`.
3. Create a `.env` file with the following three things:
```text
API_KEY=RIJKSMUSEUM-API-KEY
USERNAME=COMMONS-USERNAME
PASSWORD=COMMONS-PASSWORD
```
To get the API KEY of Rijksmuseum, create an account on their site.  [Details](https://data.rijksmuseum.nl/object-metadata/api/#access-to-apis).

`node index.js` will start the script.  Track the progress in `status.txt` file, and errors are logged in `err.txt`.