const fs = require('fs')
const { authorize, getAccessToken, uploadMultipleFile } = require('./googleDrive.js');
const DIRECTORY = "C:\\Users\\fuckingretard\\Downloads"
const OUTPUT = "./dest/"
const EXT = ["mp4", "mp3", "webm", "mov", "wav", "wmv", "3gp", "gif", "png", "apng", "jpg", "jpeg", "webp", "jfif",]

function endsWithAny(suffixes, string) {
    return suffixes.some(function (suffix) {
        return string.endsWith(suffix);
    });
}
const files = fs.readdirSync(DIRECTORY)
              .map(function(v) { 
                  return { name:v,
                           time:fs.statSync(DIRECTORY + "\\" + v).mtime.getTime()
                         }; 
               })
               .sort(function(a, b) { return b.time - a.time; })
               .map(function(v) { return v.name; });
               // https://stackoverflow.com/a/10559790

var fileContentArray = []

fs.readFile('credentials.json', (err, content) => {
    for (const file of files) {
        if (endsWithAny(EXT, file)) {
            fileContentArray.push({
                fileMetadata: {
                    "name": file,
                    'parents': ["1ssnnVEFZ7dEVc4vxXVw9XiTg2lc0ZYDs"]
                },
                media: {
                    body: fs.createReadStream(DIRECTORY + "\\" + file)
                },
                failedCount: 0,
            })
            fs.rename(DIRECTORY + "\\" + file, OUTPUT + file, function (err) {
                if (err) throw err;
                console.log('Move complete. ' + file);
            });

        }
    }
    console.log(fileContentArray)
    authorize(JSON.parse(content), (auth) => { uploadMultipleFile(auth, fileContentArray) });
});
