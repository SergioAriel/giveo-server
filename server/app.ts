import routes from "./routes/index"
import { NextFunction, Request, Response } from 'express';
import * as bodyParser from 'body-parser';
const express = require('express')
// const cors = require('cors');
const app = express();

app.use(express.json())
app.use(bodyParser.urlencoded({
    extended: true
}));
// app.use(cors({
//     origin: ['https://giveo.vercel.app'],
//     methods: ['GET', 'POST', 'DELETE', "PUT"],
//     credentials: true,
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(express.urlencoded({ extended: true }))
app.use(function (req: Request, res: Response, next: NextFunction) {
    // Request methods you wish to allow
    const allowedOrigins = ["https://giveo.vercel.app", 'http://localhost:3000'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
         res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // // Set to true if you need the website to include cookies in the requests sent
    // // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(routes)


export default app
