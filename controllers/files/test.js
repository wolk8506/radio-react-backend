const { Recipe } = require("../../models");
const createError = require("http-errors");
// !-------------------------------------------------------------------------------------------------

// ----------------------------------------------------
// Load environment variables from a .env file
require("dotenv").config();
const { Dropbox } = require("dropbox"); // Import the Dropbox SDK
const fetch = require("isomorphic-fetch"); // Import a fetch-compatible library for making HTTP requests
const fs = require("fs"); // Import Node.js's native file system module for reading and writing files

// Initialize a new Dropbox client with the access token from environment variables
const dbx = new Dropbox({
  accessToken: process.env.ACCESS_TOKEN,
  fetch,
});

// Define an asynchronous function to list all files in a given Dropbox path
async function getAllFiles(path) {
  try {
    // Request a list of files from Dropbox
    const files = await dbx.filesListFolder({ path });
    // Return the list of file entries
    return files.result.entries;
  } catch (error) {
    // Log any errors that occur
    console.error("Error:", error);
  }
}

// Define an asynchronous function to upload a file to Dropbox
async function uploadFile(file, path) {
  try {
    // Read the content of the file from the local file system
    const fileContent = fs.readFileSync(file, "utf8");
    if (fileContent) {
      // Upload the file content to Dropbox at the specified path
      const fileuploaded = await dbx.filesUpload({
        path,
        contents: fileContent,
      });
      // Return the response from the upload operation
      return fileuploaded;
    } else {
      // Return false if there was no content in the file
      return false;
    }
  } catch (error) {
    // Log any errors that occur
    console.error("Error:", error);
  }
}

// Delete a file from dropbox
async function deleteFile(path) {
  try {
    // Request to delete a file from Dropbox
    const fileDeleted = await dbx.filesDeleteV2({ path });
    // Return the result of the delete operation
    return fileDeleted;
  } catch (error) {
    //Log any errors that occur
    console.error("Error:", error);
  }
}
