const express = require("express");
const socketio = require("socket.io")
const http = require('http')
const cors = require("cors")

const app = express();
app.use(cors())
const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT || 5000


let users = {}
let activeSender = [];


io.on("connection", socket => {

    let room;

    socket.emit("localID", socket.id)

    console.log(`new connection from ${socket.id}`)
    socket.on("disconnect", () => {
        console.log(`lost connection from ${socket.id}`)
        activeSender = activeSender.filter(as => as !== socket.id)
        delete users[socket.id]
        socket.broadcast.to(room).emit("peer-left", socket.id)
        socket.broadcast.to(room).emit("name-update", users)
    })

    socket.on("hangup", () => {
        socket.broadcast.to(room).emit("hangup", socket.id)
        activeSender = activeSender.filter(elem => elem !== socket.id)
        console.log(activeSender)
    })

    socket.on("active-sender", () => {
        activeSender.push(socket.id)
        socket.broadcast.to(room).emit("call-started")
    })

    socket.on("want-to-watch", () => {
        activeSender.forEach(as => {
        socket.to(as).emit("want-to-watch", socket.id)
        })
    })

    socket.on("payload", data => {
        console.log(`${data.type} from ${socket.id} to ${data.target}`)
        socket.to(data.target).emit("payload", data)
    })

    socket.on("name-and-room", data => {
        socket.join(data.room)
        room = data.room
        users[socket.id] = {name: data.name, room: data.room};
        let arr = []
        Object.entries(users).forEach(obj => {
            if(obj[1].room == data.room){
            console.log(obj)
            arr.push(obj)
            } 
        })
        socket.broadcast.to(room).emit("name-update", arr);
        socket.emit("name-update", arr)
    })

})

app.get('/', function (req, res) {
    res.send('hello world')
  })

server.listen(port, () => console.log(`Started at port ${port}`))