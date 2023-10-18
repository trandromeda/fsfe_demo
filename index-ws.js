const express = require('express');
const server = require('http').createServer();
const app = express();

app.get('/', function(req, res) {
    res.sendFile('index.html', { root: __dirname });
});

server.on('request', app);
server.listen(3000, function() { console.log('Listening on 3000'); });

process.on('SIGINT', () => {
    server.close(() => {
        shutdownDB();
    })
})

/** Websockets **/

const WebSocketServer = require('ws').Server;

const wss = new WebSocketServer({ server });

wss.on('connection', function(ws) {
    const numClients = wss.clients.size;
    console.log('Clients connected: ', numClients);

    wss.broadcast(`Current visitors ${numClients}`);

    if (ws.readyState === ws.OPEN) {
        ws.send("Hello! Welcome to my server");
    }

    db.run(`INSERT INTO visitors (count, time)
            VALUES (${numClients}, datetime('now'))
    `)

    ws.on('close', function() {
        console.log('A client has disconnected');
    })
});

wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data)
    })
}

const sqlite = require('sqlite3');
const db = new sqlite.Database(':memory:');

// ensures db is set up
db.serialize(() => {
    // run some SQL
    db.run(`
		CREATE TABLE visitors (
			count INTEGER,
			time TEXT
		)
	`)
})

// helper method to run query
function getCounts() {
    // get output of every row
    db.each("SELECT * FROM visitors", (err, row) => {
        console.log(row);
    })
}

function shutdownDB() {
    getCounts();
    console.log("Shutting down");
    db.close();
}
