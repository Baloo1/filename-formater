const fs = require("fs");
const path = require("path");
const imageDir = process.argv[2];
const reformatFileName = process.argv[3] || false;
var count = 0;

console.time("startRenaming");
const absolutePath = path.join(__dirname, "../", imageDir).concat("\\");

// read image directory
const readFiles = () => {
  fs.readdirSync(imageDir).map((file) => {
    const pathToCurrentFile = `${absolutePath}\\${file}`;
    const stats = fs.statSync(pathToCurrentFile);
    if (stats.isDirectory()) {
      // read all files in dir
      fs.readdirSync(pathToCurrentFile).map((file) => {
        // append dir to filename and read file stats
        const pathToFile = `${pathToCurrentFile}\\${file}`;

        const newFileName = createNewFileName(
          file,
          pathToCurrentFile,
          fs.statSync(pathToFile),
        );
        console.log("newFileName:", newFileName);

        rename(pathToFile, newFileName);
        count++;
      });
    }
  });
  console.log(`Number of files changed ${count}`);
  console.timeEnd("startRenaming");
};

const createNewFileName = (file, pathToCurrentFile, stats) => {
  let year;
  let month;
  let day;
  let hours;
  let minutes;
  let seconds;

  if (!reformatFileName) {
    const lastModified = stats.mtime;
    console.log(`${file} Data Last Modified: ${lastModified}`);

    // parse lastModified date to a new filename
    year = lastModified.getFullYear();
    // adding a leading 0, by slicing -2 we get the last 2 digits, so 020 becomes 20 and 02 stays 02.
    // also months are 0 indexed
    month = leadingZero(lastModified.getMonth() + 1);
    day = leadingZero(lastModified.getDate());
    hours = leadingZero(lastModified.getHours());
    minutes = leadingZero(lastModified.getMinutes());
    seconds = leadingZero(lastModified.getSeconds());
  } else {
    console.log(`${file} being reformated`);

    year = file.slice(4, 8);
    // adding a leading 0, by slicing -2 we get the last 2 digits, so 020 becomes 20 and 02 stays 02.
    // also months are 0 indexed
    month = file.slice(8, 10);
    day = file.slice(10, 12);
    hours = file.slice(13, 15);
    minutes = file.slice(15, 17);
    seconds = file.slice(17, 19);
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

const rename = (oldPath, newPath) => {
  fs.renameSync(oldPath, newPath);
  console.log(`File renamed from ${oldPath} to ${newPath} successfully!`);
};

readFiles();
