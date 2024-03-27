import { spawn } from 'child_process';
import { Request, Response } from 'express';
import * as path from 'path';

export const runTerminal = (req: Request, res: Response) => {
    const { command, args } = req.body;
    try {
      const dir = path.join(process.cwd() + "/../app");
      const executeCommand = spawn(command, args, { cwd: dir });
  
      const respData:any = [];
  
      executeCommand.stdout.on('data', (data) => {
        respData.push(data.toString());
      });
  
      executeCommand.on('close', (code) => {
        if (code === 0) {
          res.json({
            OK: true,
            respData: respData,
            message: "complete"
          });
        } 
        else {
          res.status(500).json({
            status: "Error",
            message: "Command execution failed"
          });
        }
      });
  
      executeCommand.on('error', (err) => {
        console.error(err);
        res.status(500).json({
          OK: false,
          message: "An error occurred while executing the command",
          error: err.message // Agrega el mensaje de error al objeto de respuesta
        });
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        OK: false,
        message: "An error occurred",
        error: error.message // Agrega el mensaje de error al objeto de respuesta
      });
    }
  };
  
  