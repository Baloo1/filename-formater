import fs = require("fs");
import path = require("path");
import exifr = require("exifr");
const imageDir = process.argv[2];
const formatMethod = process.argv[3] || false;
let count = 0;

console.time("startRenaming");
const absolutePath = path.join(__dirname, "../", imageDir).concat("\\");

// read image directory
const readFiles = async () => {
  await Promise.all(fs.readdirSync(imageDir).map(async (file) => {
    const pathToCurrentFile = `${absolutePath}${file}`;
    const stats = fs.statSync(pathToCurrentFile);

    if (file == "node_modules" || file == ".git") return;
    if (stats.isDirectory()) {
      const namesToWrite = await readFilesInDirectory(pathToCurrentFile);
      namesToWrite.map(writeNewFileName);
      count += namesToWrite.length;
    }
  }));
  console.log(`Number of files changed ${count}`);
  console.timeEnd("startRenaming");
};

const readFilesInDirectory = async (pathToCurrentFile) => {
  return Promise.all(fs.readdirSync(pathToCurrentFile).map(async (file) => {
    const newFileName = await createNewFileName(pathToCurrentFile, file);
    const oldPath = filePath(pathToCurrentFile, file);
    return { oldPath, newFileName };
  }));
};

const fixDuplicateName = (newFileName) => {
  const lastIndex = newFileName.lastIndexOf(".");
  const name = newFileName.slice(0, lastIndex);
  const fileEnding = newFileName.slice(lastIndex + 1);

  let tempName = newFileName;
  let fileNbr = 1;
  while (fs.existsSync(tempName)) {
    tempName = `${name} (${fileNbr}).${fileEnding}`;
    fileNbr++;
  }
  return tempName;
};

const writeNewFileName = ({ oldPath, newFileName }) => {
  const name = fixDuplicateName(newFileName);
  fs.renameSync(oldPath, name);
  console.log(`File renamed from ${oldPath} to ${name} successfully!`);
};

const getDateFromEXIF = async (filePath) => {
  const exifData = await exifr.parse(filePath);
  if (!exifData) throw new Error(`Error: ${filePath} has undefined exif`);
  if (!exifData.DateTimeOriginal) {
    if (!exifData.CreateDate) {
      throw new Error(`Error: ${filePath} has undefined exif`);
    }
    return parseDateString(exifData.CreateDate);
  }
  return parseDateString(exifData.DateTimeOriginal);
};

const getDateFromLastModified = (stats) => {
  return parseDateString(stats.mtime);
};

const parseDateString = (date) => {
  const year = date.getFullYear();
  const month = leadingZero(date.getMonth() + 1);
  const day = leadingZero(date.getDate());
  const hours = leadingZero(date.getHours());
  const minutes = leadingZero(date.getMinutes());
  const seconds = leadingZero(date.getSeconds());

  return { year, month, day, hours, minutes, seconds };
};

const getDateFromFileName = (file) => {
  console.log(`${file} being reformated`);

  const year = file.slice(4, 8);
  const month = file.slice(8, 10);
  const day = file.slice(10, 12);
  const hours = file.slice(13, 15);
  const minutes = file.slice(15, 17);
  const seconds = file.slice(17, 19);

  return { year, month, day, hours, minutes, seconds };
};

const createNewFileName = async (pathToCurrentFile, file) => {
  let date;

  const pathToFile = filePath(pathToCurrentFile, file);
  if (formatMethod === "exif") {
    try {
      date = await getDateFromEXIF(pathToFile);
    } catch (error) {
      date = { year: "2000", month: "01", day: "01", hours: "00", minutes: "00", seconds: "00" };
    }
  } else if (formatMethod == "reformat") {
    date = getDateFromFileName(file);
  } else {
    const stats = fs.statSync(pathToFile);
    date = getDateFromLastModified(stats);
  }

  if (!validateDate(date)) return;

  let fileEnding = file.slice(-3);
  if (fileEnding.toUpperCase() === "PEG") {
    fileEnding = file.slice(-4);
  }

  return `${fileNameFormat(pathToCurrentFile, date)}.${fileEnding}`;
};

const validateDate = ({ year, month, day, hours, minutes, seconds }) => {
  if (
    year.length < 4 ||
    month.length < 2 ||
    day.length < 2 ||
    hours.length < 2 ||
    minutes.length < 2 ||
    seconds.length < 2
  ) {
    throw new Error("To short date");
  }
  return true;
};

const fileNameFormat = (pathToCurrentFile, { year, month, day, hours, minutes, seconds }) => {
  return `${pathToCurrentFile}\\${year}-${month}-${day} ${hours}.${minutes}.${seconds}`;
};

const filePath = (pathToCurrentFile, file) => {
  return `${pathToCurrentFile}\\${file}`;
};

// Adding a leading 0, by slicing -2 we get the last 2 digits, so 020 becomes 20 and 02 stays 02.
// also months are 0 indexed
const leadingZero = (nbr) => {
  return "0".concat(nbr).slice(-2);
};

readFiles();
