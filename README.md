# Image name formatter

Renames files based on their timestamp for last modified to `YYYY-MM-DD hh.mm.ss` keeping the file extension. Can also translate IMG filenames to the same format.

Run with `npm start --REPLACE_WITH_DIRECTORY_PATH` where `REPLACE_WITH_DIRECTORY_PATH` can be relative or absolute. `npm start -- ./images`. Use `npm start -- ./images exif` to format from EXIF data. For files with IMG start use  `npm start -- ./images reformat` for translating from IMG. Both looks into 1 folder depth and formats everything except folders in 0 depth and everything in 1 depth.
