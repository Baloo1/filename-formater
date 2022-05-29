const fs = require("fs");
const path = require("path");
var exifr = require('exifr')
const imageDir = process.argv[2];
const formatMethod = process.argv[3] || false;
var count = 0;

console.time("startRenaming");
const absolutePath = path.join(__dirname, "../", imageDir).concat("\\");

// read image directory
const readFiles = async () => {
  await Promise.all(fs.readdirSync(imageDir).map(async (file) => {
    const pathToCurrentFile = `${absolutePath}${file}`;
    const stats = fs.statSync(pathToCurrentFile);
    if (stats.isDirectory()) {
      // read all files in dir
      await Promise.all(fs.readdirSync(pathToCurrentFile).map(async (file) => {
        // append dir to filename and read file stats
        const pathToFile = `${pathToCurrentFile}\\${file}`;

        const newFileName = await createNewFileName(
          file,
          pathToCurrentFile,
          fs.statSync(pathToFile),
        );
        console.log("newFileName:", newFileName);

        renameFile(pathToFile, newFileName);
        count++;
      }));
    }
  }));
  console.log(`Number of files changed ${count}`);
  console.timeEnd("startRenaming");
};

const getDateFromEXIF = async (file, pathToCurrentFile) => {
  console.log(`${pathToCurrentFile}\\${file}`)
  const file2 = fs.readFileSync(`${pathToCurrentFile}\\${file}`)
  let { DateTimeOriginal } = await exifr.parse(file2);
  return parseDateString(DateTimeOriginal);
}

const getDateFromLastModified = (stats) => {
  return parseDateString(stats.mtime)
}

const parseDateString = (date) => {
  const year = date.getFullYear();
  // adding a leading 0, by slicing -2 we get the last 2 digits, so 020 becomes 20 and 02 stays 02.
  // also months are 0 indexed
  const month = leadingZero(date.getMonth() + 1);
  const day = leadingZero(date.getDate());
  const hours = leadingZero(date.getHours());
  const minutes = leadingZero(date.getMinutes());
  const seconds = leadingZero(date.getSeconds());

  return [year, month, day, hours, minutes, seconds];
}

const getDateFromFileName = (file) => {
  console.log(`${file} being reformated`);

  const year = file.slice(4, 8);
  // adding a leading 0, by slicing -2 we get the last 2 digits, so 020 becomes 20 and 02 stays 02.
  // also months are 0 indexed
  const month = file.slice(8, 10);
  const day = file.slice(10, 12);
  const hours = file.slice(13, 15);
  const minutes = file.slice(15, 17);
  const seconds = file.slice(17, 19);

  return [year, month, day, hours, minutes, seconds];
}

const createNewFileName = async (file, pathToCurrentFile, stats) => {
  let year;
  let month;
  let day;
  let hours;
  let minutes;
  let seconds;

  if (formatMethod === 'exif') {
    [year, month, day, hours, minutes, seconds] = await getDateFromEXIF(file, pathToCurrentFile)
  } else if (formatMethod == 'reformat') {
    [year, month, day, hours, minutes, seconds] = getDateFromFileName(file);
  } else {
    [year, month, day, hours, minutes, seconds] = getDateFromLastModified(stats)
  }


  if (
    day.length < 2 ||
    month.length < 2 ||
    hours.length < 2 ||
    minutes.length < 2 ||
    seconds.length < 2
  ) {
    throw new Error("To short date");
  }

  var fileEnding = file.slice(-3);
  if (fileEnding.toUpperCase() === "PEG") {
    fileEnding = file.slice(-4);
  }

  let newFileName = `${pathToCurrentFile}\\${year}-${month}-${day} ${hours}.${minutes}.${seconds}.${fileEnding}`;

  let fileNbr = 1;
  while (fs.existsSync(newFileName)) {
    newFileName = `${pathToCurrentFile}\\${year}-${month}-${day} ${hours}.${minutes}.${seconds} (${fileNbr}).${fileEnding}`;
    fileNbr++;
  }
  return newFileName;
};

const leadingZero = (nbr) => {
  return "0".concat(nbr).slice(-2);
};

const renameFile = (oldPath, newPath) => {
  fs.renameSync(oldPath, newPath);
  console.log(`File renamed from ${oldPath} to ${newPath} successfully!`);
};

readFiles();
