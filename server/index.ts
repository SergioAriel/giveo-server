import app from "./app"
import * as http from 'http'
import { Server as ServerSocket } from "socket.io";

import {
    commandTerminal,
    setCommits,
    write,
    getCommits,
    read,
    getDirectory
} from "./socketIoControllers";


const httpServer = http.createServer(app)
const io = new ServerSocket(httpServer, {
    cors: {
        origin: ["https://giveo.vercel.app", 'http://localhost:3000'],
        methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      }
  });
  
// const io = new ServerSocket(httpServer)

io.on('connection', (socket: any) => {
    try {

        write(socket)
        setCommits(socket)
        commandTerminal(socket)
        getDirectory(socket)
        getCommits(socket)
        read(socket)
    } catch (error) {
        console.log(error)
    }
})

console.log("Start Server")

httpServer.listen(3001, "0.0.0.0");



(global as any).io = io;