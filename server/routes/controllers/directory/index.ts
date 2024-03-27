import { Request, Response } from 'express';
import * as fs from 'fs';
import path from "path";

export const deleteFile = async (req: Request, _res: Response) => {
    try {
        const absolutePath: string = req.query.absolutePath as string
        const filePath = path.join(absolutePath);
        if (filePath && fs.statSync(filePath).isDirectory()) {
            fs.rmdirSync(filePath);
        } else {

            fs.unlinkSync(filePath);
        }
    } catch (error) {
        
    }
};