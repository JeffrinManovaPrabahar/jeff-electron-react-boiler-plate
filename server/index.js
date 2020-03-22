const IP = getIp();
const PORT = process.env.PORT || 3000;
process.env.ELECTRON_START_URL = `http://localhost:${PORT - 100}`
const APP_CONFIG = require('./config');

const net = require('net')
const childProcess = require('child_process')
const http = require('http');
const express = require("express");
var cors = require('cors')
const app = express();
const server = http.createServer(app);
const expressGraphQL = require("express-graphql");

const DB_PATH = APP_CONFIG.DB_PATH;
const mongoose = require("mongoose");
mongoose
    .connect(
        DB_PATH,
        {
            useUnifiedTopology: true,
            useCreateIndex: true,
            useNewUrlParser: true
        }
    )
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

let schema = null;
if (APP_CONFIG.SCHEMA) schema = require(APP_CONFIG.SCHEMA);

app.use(cors())
app.use(
    "/graphql",
    expressGraphQL((req) => ({
        schema,
        graphiql: true
    }))
);

const client = new net.Socket()

let startedElectron = false
const tryConnection = () => {
    client.connect({ port: PORT - 100 }, () => {
        client.end()
        if (!startedElectron) {
            startedElectron = true
            console.log(`Starting Electron!`)
            const exec = childProcess.exec
            exec('yarn run electron')
        }
    })
}

client.on('error', () => {
    setTimeout(tryConnection, 1000)
})

server.listen(PORT, IP, () => {
    console.log(`Server running on ${IP == "" && "localhost" || IP}:${PORT}!`)
    tryConnection()
})

function getIp() {
    return Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family === 'IPv4' && !i.internal && i.address || []), [])), []);
}
