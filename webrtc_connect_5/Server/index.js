const cors = require("cors")
const socketio = require("socket.io")
const http = require("http");
const express = require("express");
const app = express();
const server = http.createServer(app);
const endpoint = process.env.PORT || 5000;
const io = socketio(server);
app.use(cors())

let connectedUsers = 0;

io.on("connection", socket => {
    console.log(`new connection from ${socket.id}`)
    if(connectedUsers == 0) {
        socket.emit("polite-answer", true)
    } else if (connectedUsers == 1) {
        socket.emit("polite-answer", false)
    } else {
        socket.emit("forced-disconnect", "app full")
        socket.disconnect()
        connectedUsers--;
    }
    connectedUsers++;

    socket.on("disconnect", () => {
        console.log(`lost connection from ${socket.id}`)
        connectedUsers--;
        if(connectedUsers == 1){

            socket.broadcast.emit("polite-answer", true)
        }
    })

    socket.on("offer", (data) => {
        console.log(`offer from ${socket.id}`)
        socket.broadcast.emit("offer", data)
    })

    socket.on("answer", data => {
        console.log(`answer from ${socket.id}`)
        socket.broadcast.emit("answer", data)
    })

    socket.on("ice", data => {
        console.log(`ice from ${socket.id}`)
        socket.broadcast.emit("ice", data)
    })
})


app.get("/", (req, res) => {
    res.send("Hello World")
})

server.listen(endpoint, () => {
    console.log(`server is running on port ${endpoint}`);
})