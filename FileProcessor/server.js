require('dotenv').config();
const express = require('express');                 // Web Server - Express 
const app = express();
const readline = require('readline');               // Module to read data from readable stream
const fs = require('fs');
const path = require('path');                       // Used for manipulation with path
const targetFolder = process.env.TARGET_FOLDER;     // Uploaded files destination folder
const port = process.env.PORT;                      // Web Server Port
const stream = require('stream');
let csv = require('csvtojson');
const serviceConsumers = process.env.SERVICE_CONSUMERS; // List of services which will be consuming data of uploaded files
const alertMessageHandler = process.env.ALERT_MESSAGE_HANDLER; // Alert messager handler service URL
const util = require('util');

app.use(express.json());                            // Handling JSON

const uploadedFilesFolder = path.join(__dirname, targetFolder + '/');     // Uploaded files folder path


app.get('/', (req, res) => {
    res.json({
        "Message": "Welcome, This is File Processing Service."
    });
})

app.get('/ProcessFile/:filename', (req, res) => {

    var fileToCheck = uploadedFilesFolder + req.params.filename; // File to be checked for transactions over thresold 

    let inStream = fs.createReadStream(fileToCheck);        // File reading stream
    let outStream = new stream();                           // Output stream
    let rl = readline.createInterface(inStream, outStream);

    // Over threshold transactions alerts log file name creation
    const alertLogFile = uploadedFilesFolder + req.params.filename.split(".")[0] + "_alerts.log";
    console.log(alertLogFile);


    let alertWriter = fs.createWriteStream(alertLogFile); // Write stream to log alerts
    alertWriter.on('error', (err) => { console.log('Error', err.Message) });

    let alertMessageFormat = "{Alert: Found transaction over threshold: transaction_id: %s, description: %s, value: %s, date: %s} \n";
    let alertMessage;



    rl.on('line', function (line) {

        csv({
            noheader: true,
            output: "json",
            headers: ['header1', 'header2', 'header3', 'header4']
        })
            .fromString(line)
            .then((jsonArray) => {
                try {
                    if (Math.abs(parseInt(jsonArray[0].header3)) > 10000) {

                        alertMessage = util.format(alertMessageFormat, jsonArray[0].header1, jsonArray[0].header2, jsonArray[0].header3, jsonArray[0].header4);
                        alertWriter.write(alertMessage);
                        console.log(alertMessage);

                    }
                } catch (error) {
                    console.log(errror.Message);
                }


            });

    });


    rl.on('close', function (line) {

        // Checking how many consumer services want this data 
        let consumerObj = JSON.parse(serviceConsumers);
        if (consumerObj.Alerting === true) {
            console.log("Calling Alerting Service to send notification for over threshold transactions");

            const request = require('request');
            const getRequestURL = alertMessageHandler + "?alertLogFile=" + alertLogFile;
            console.log(getRequestURL);
            try {
                request.get(getRequestURL, function (error, response, body) {
                    console.log('error:', error); // Print the error if one occurred
                    console.log('statusCode:', response.statusCode); // Print the response status code if a response was received
                });
            } catch (Error) {
                console.log('GET Request error', Error.Message);
            }



            // if (consumerObj.Database === true) {
            //     console.log("Send Transaction over thresold details to Database Service");
            // }

            // Same way we can allow othere services to consume this data


            res.status(200).json({ "Message": "File " + req.params.filename + " has been processed successfully. " }).end();
        }


    });

});


app.listen(process.env.PORT || 5000, () => console.log('FileProcessor Server started ' + port));


