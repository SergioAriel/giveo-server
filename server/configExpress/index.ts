import * as express from 'express'
import { NextFunction, Request, Response } from 'express';
import * as bodyParser from 'body-parser';
const cors = require('cors');

export const config = (app: any) => {
    // configure the app to use bodyParser()

    app.use(express.json())
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(cors({
        origin: ['https://giveo.vercel.app/'],
        credentials: true,
    }));
    app.use(express.urlencoded({ extended: true }))
    app.use(function (_req: Request, res: Response, next: NextFunction) {
        // Request methods you wish to allow
        res.header("Access-Control-Allow-Origin", 'https://giveo.vercel.app/'); 
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        // // Set to true if you need the website to include cookies in the requests sent
        // // to the API (e.g. in case you use sessions)
        // res.setHeader('Access-Control-Allow-Credentials', true);

        // Pass to next layer of middleware
        next();
    });

}

