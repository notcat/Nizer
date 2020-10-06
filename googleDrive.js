const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')
var RateLimiter = require('limiter').RateLimiter

var limiter = new RateLimiter(5, 'second')
var failedFileUploads = []

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(
		client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getAccessToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		callback(oAuth2Client);
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('Authorize this app by visiting this url:', authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question('Enter the code from that page here: ', (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error('Error retrieving access token', err);
			oAuth2Client.setCredentials(token);
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log('Token stored to', TOKEN_PATH);
			});
			callback(oAuth2Client);
		});
	});
}

function failedUpload(drive, files) {
	console.log("retrying!")
	files.forEach((file, index) => {
		limiter.removeTokens(1, function driveCreate(err, remainingRequests) {
			drive.files.create({
				resource: file.fileMetadata,
				media: file.media,
				fields: 'id'
			}, (err, gfile) => {
				if (err) {
					// Handle error
					// console.error(err + " , retrying!");
					console.log("Errored on retry!!!")
					file.failedCount = failedCount + 1
					if (file.failedCount < 3) {
						console.log("added to failedFileUploads! - failedCount below 3")
						failedFileUploads.push(files[index])
						failedUpload(failedFileUploads)
					}
				} else {
					//progress++
					//console.log(progress + '/' + files.length)
					console.log("|||| RETRY SUCCESSFULLY! ||||")
				}
			})
		})
	})
	files.shift()
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 * @param files Takes in an object of files {{fileMetadata, media},}
 */
function uploadMultipleFile(auth, files) {
	const drive = google.drive({ version: 'v3', auth })
	var progress = 0
	files.forEach((file, index) => {
		limiter.removeTokens(1, function driveCreate(err, remainingRequests) {
			drive.files.create({
				resource: file.fileMetadata,
				media: file.media,
				fields: 'id'
			}, (err, gfile) => {
				if (err) {
					// Handle error
					// console.error(err + " , retrying!");
					failedFileUploads.push(files[index])
					failedUpload(drive, failedFileUploads)
				} else {
					progress++
					console.log(progress + '/' + files.length)
				}
			})
		})
	})
}

module.exports = {
	authorize: authorize,
	getAccessToken: getAccessToken,
	uploadMultipleFile: uploadMultipleFile,
}