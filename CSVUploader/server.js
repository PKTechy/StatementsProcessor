require('dotenv').config();
const express = require('express');                 // Web Server - Express 
const app = express();
const busboy = require('connect-busboy');           // Middleware to handle file upload functionality     
const path = require('path');                       // Used for manipulation with path
const fs = require('fs-extra');
const targetFolder = process.env.TARGET_FOLDER;     // Uploaded files destination folder
const port = process.env.PORT;                      // Port which web server is running 
const fileProcessorURL = process.env.FILE_PROCESSOR_SERVICE_HOSTNAME + '/' + process.env.FILE_PROCESSOR_SERVICE_NAME + '/';


app.use(express.json());                            // Handling JSON

// Using busboy middleware
app.use(busboy({
    highWaterMark: 5 * 1024 * 1024,              // Maximum bytes in buffer before ceasing read from file
}));

const uploadPath = path.join(__dirname, targetFolder + '/');     // Making target folder path
fs.ensureDir(uploadPath);                                       // Ensures target folder path exists

app.get('/', (req, res) => {
    res.json({
        "Message": "Welcome, This is CSV File Uploader Service."
    });
})

// HTML form to upload file
app.get('/FileUpload', (req, res) => {
    res.sendFile(__dirname + '/public/FileUpload.html');
})


app.route('/UploadFile').post((req, res, next) => {

    req.pipe(req.busboy); // connects read stream to write stream

    req.busboy.on('file', (fieldname, file, filename) => {
        console.log(`Uploading of file '${filename}' started.`);   // File uploading started

        // Create a write stream of the new file
        const fstream = fs.createWriteStream(path.join(uploadPath, filename));
        fstream.on('error', (error) => {
            console.log("Error", error.Message);
        })
        // Pipe it trough
        file.pipe(fstream); // Pipe through write stream

        // On finish of the upload
        fstream.on('close', () => {
            console.log(`Uploading of file '${filename}' finished.`);  // File uploading finished
            //res.redirect('back');
            res.status(200);
            res.json({
                success: true,
                message: `${filename} file uploaded successfully.`,
                URLToProcessFile: fileProcessorURL + `${filename}`
            });


        });
    });
})




app.listen(process.env.PORT || 3000, () => console.log('CSVUploader Server started ' + port))


