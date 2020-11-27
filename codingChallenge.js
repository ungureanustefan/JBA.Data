require('dotenv').config();
const fs = require("fs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const filePath = process.argv[2];

// Read the data file and convert it into a String.
const dataFile = fs.readFileSync(filePath).toString()

// Create an array with the data separated by newlines.
let dataStringSplit = dataFile.split("\n")


// Remove the introductory part which does not contain data.
let deleted = dataStringSplit.splice(0, 5);


// Chunk the array into blocks which include xRef and yRef with the values for year 1991-2000.
function chunkArray(arr) {
    let val = 11;
    finalArr = []
    for (let i = 0; i < arr.length; i += val) {
        finalArr.push(arr.slice(i, val + i));
    }

    return finalArr;
}
let chunked = chunkArray(dataStringSplit)



let result =
    chunked.map(function (v) {
        return v.map(function (v2) {
            return v2.match(/.{1,5}/g).filter(function (element) {
                return element != "";
            }).map(function (v3) {
                return v3.replace(",", "").trim()
            })
        })
    })



const schema = new Schema({
    xRef: String,
    yRef: String,
    date: String,
    value: String,
});

const gridPrecipitation = mongoose.model("JBAChallenge", schema);

let values = async function (arr) {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false
    })

    // Iterate through the array and obtain xRef and yRef.
    for (let i = 0; i < arr.length; i++) {
        const block = arr[i]
        let data = {}
        data.xRef = block[0][2]
        data.yRef = block[0][3]

        // Counting the years.

        for (let j = 1; j < block.length; j++) {
            const year = block[j]
            if (year.length != 12) {
                console.log("A year must have data for exactly 12 months");
                console.log(`Error found at: xRef: ${data.xRef}, yRef: ${data.yRef}, Year: ${1990 + j}`)
                continue;
            }

            // Obtaining the date and correct value assinged to it
            for (let k = 0; k < year.length; k++) {
                data.date = 1 + "." + (k + 1) + "." + (1990 + j)
                data.value = year[k]
                if (data.value.length == 5) {
                    console.log(data.value)
                }


                // Save data into the database
                const myPrecipitationDatabase = new gridPrecipitation(data);

                await myPrecipitationDatabase.save({});

            }
        }



    }
}


values(result);
