const fs = require('fs')
const { authorize, getAccessToken, uploadFile } = require('./googleDrive.js');
const DIRECTORY = "C:\\Users\\fuckingretard\\Downloads"
const EXT = ["mp4", "mp3", "webm", "mov", "wav", "wmv", "3gp", "gif", "png", "apng", "jpg", "jpeg", "webp", "jfif",]



function endsWithAny(suffixes, string) {
    return suffixes.some(function (suffix) {
        return string.endsWith(suffix);
    });
}

const files = fs.readdirSync(DIRECTORY)

for (const file of files) {

    if (endsWithAny(EXT, file)) {

        var fileMetadata = {
            "name": file
        }
        var media = {   
            mimeType: 'image/jpeg',
            body: fs.createReadStream(DIRECTORY + "\\" + file)
        }

        // Upload the file to google drive using the client secret
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Drive API.
            authorize(JSON.parse(content), uploadFile(fileMetadata, media));
        })

        /*fs.rename(DIRECTORY + "\\" + file, './dest/' + file, function (err) {
            if (err) throw err;
            console.log('Move complete. ' + file);
        });*/

    }
}

// Get credential secret file

