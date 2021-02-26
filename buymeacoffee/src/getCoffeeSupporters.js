const fs = require("fs");
const axios = require("axios");
require("dotenv").config({
  path: ".env",
});

const PATH = "../gatsby-theme-rpsych/assets/coffee-supporters/coffee-supporters.json";

const isLastPage = (response, last_page_num) =>
  response.data.current_page == last_page_num;

const getLastPageNum = (response, last_page) =>
  last_page == "all" ? response.data.last_page : last_page;

const getNewSupporters = ({
  newSupporters,
  totalResponses,
  numSupportersLoadedFromFile,
  per_page,
} = {}) => {
  // Calculate the remaning new supporters on the last page if less than <per_page>
  const numNewResponses =
    (totalResponses - numSupportersLoadedFromFile) % per_page;
  return newSupporters.slice(0, numNewResponses == 0 ? 5 : numNewResponses);
};

const calcLastPage = ({
  totalResponses,
  numSupportersLoadedFromFile,
  per_page,
} = {}) => Math.ceil((totalResponses - numSupportersLoadedFromFile) / per_page);

const consoleLogResponse = (newSupporters, response) =>
  console.log(
    "Got",
    newSupporters.length,
    "entries from page:",
    response.data.current_page
  );

const downloadAllNewResponses = ({ response, page, data, last_page, numSupportersLoadedFromFile } = {}) => {
  const per_page = response.data.per_page;
  const totalResponses = response.data.total;
  if (page == 1) {
    console.log("(API)", totalResponses, "supporters in total");
    if (totalResponses == numSupportersLoadedFromFile) return null;
    last_page = calcLastPage({
      totalResponses: totalResponses,
      numSupportersLoadedFromFile: numSupportersLoadedFromFile,
      per_page: per_page,
    });
  }
  let newSupporters = response.data.data;
  const last_page_num = getLastPageNum(response, last_page);
  if (isLastPage(response, last_page_num)) {
    newSupporters = getNewSupporters({
      newSupporters: newSupporters,
      totalResponses: totalResponses,
      numSupportersLoadedFromFile: numSupportersLoadedFromFile,
      per_page: per_page,
    });
    consoleLogResponse(newSupporters, response);
    data.push(...newSupporters);
    return data;
  } else {
    consoleLogResponse(newSupporters, response);
    data.push(...newSupporters);
  }
  return getCoffeeSupporters({
    page: response.data.current_page + 1,
    data: data,
    numSupportersLoadedFromFile: numSupportersLoadedFromFile,
    last_page: last_page_num,
  });
};

const getCoffeeSupporters = ({
  page = 1,
  data = [],
  last_page = "all",
  numSupportersLoadedFromFile = 0,
} = {}) => {
  return axios
    .get(`supporters?page=${page}`, {
      baseURL: "https://developers.buymeacoffee.com/api/v1",
      responseType: "json",
      headers: {
        Authorization: "Bearer " + process.env.TOKEN,
      },
      validateStatus: function(status) {
        return status >= 200 && status < 300;
      },
    })
    .then((response) =>
      downloadAllNewResponses(
        ({
          response: response,
          page: page,
          data: data,
          last_page: last_page,
          numSupportersLoadedFromFile: numSupportersLoadedFromFile,
        })
      )
    )
    .catch(function(error) {
      console.log("Error " + error.message);
    });
};

const saveResponsesToFile = (PATH, response) => {
  fs.writeFile(PATH, JSON.stringify(response), (err) => {
    if (err) throw err;
    console.log("Saved", response.length, "entries to file:");
    console.log(PATH);
  });
};

const mergeNewAndOldResponses = (response, loadedFromFile) =>
  response.push(...loadedFromFile);

// Load old supporters and download new
// then save to <PATH>
fs.readFile(PATH, (err, data) => {
  let last_page;
  let loadedFromFile;
  if (err) {
    if (err.code === "ENOENT") {
      console.log("The file does not exist");
      console.log("Downloading all supporters...");
      last_page = "all";
      loadedFromFile = [];
    }
  } else if (!err) {
    loadedFromFile = JSON.parse(data);
    console.log("(Local) Loaded", loadedFromFile.length, "old supporters");
  }
  getCoffeeSupporters({
    numSupportersLoadedFromFile: loadedFromFile.length,
  }).then((response) => {
    if (response == null) return console.log("No new supporters");
    mergeNewAndOldResponses(response, loadedFromFile);
    saveResponsesToFile(PATH, response);
  });
});
