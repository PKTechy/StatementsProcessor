require('dotenv').config();
const express = require('express');                 // Web Server - Express 
const app = express();
const port = process.env.PORT;                      // Web Server Port
const readline = require('readline');
const stream = require('stream');
const fs = require('fs');
let csv = require('csvtojson');


app.use(express.json());                            // Handling JSON



app.get('/', (req, res) => {
    res.json({
        "Message": "Welcome, This is Alerting Service."
    });
})

app.get('/AlertMessageHandler', (req, res) => {

    console.log("Inside Alert Message Handler");
    const alertLogFilePath = req.query.alertLogFile
    console.log("Log File: " + alertLogFilePath);

    let inStream = fs.createReadStream(alertLogFilePath);        // File reading stream
    inStream.on('error', (error) => {
        console.log(error.Message);
    });

    let outStream = new stream();                           // Output stream
    let rl = readline.createInterface(inStream, outStream);


    rl.on('line', function (line) {

        try {
            csv({
                noheader: true,
                output: "json",
                headers: ['header1', 'header2', 'header3', 'header4']
            })
                .fromString(line)
                .then((jsonArray) => {
                    console.log(jsonArray);
                });

        } catch (error) {
            console.log("Error", error.Message);
        }

    });


    rl.on('close', function (line) {
        res.status(200).send("All alerts have been processed").end();
    });



});


app.listen(process.env.PORT || 4000, () => console.log('Alerting Server started ' + port));


