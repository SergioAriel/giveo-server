import {
    execSync,
    spawn
} from 'child_process';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from "fs"
import { cleanFolder } from '../../../helpers/cleanFolder';


export const gitLog = (_req: Request, res: Response) => {
    const dir = path.join(process.cwd() + "/../app");
    const log = spawn("git", ["log", "main", "--date-order", "--format=%H"], { cwd: dir });

    let responseData = ''; // Variable para acumular los datos

    log.stdout.on('data', (data) => {
        responseData += data.toString();
    });

    log.on('close', () => {
        try {
            const configComplete = responseData.split("\n");
            res.json(configComplete);
        } catch (error) {
            console.log("error", error);
        }
    });

    log.on('error', (error) => {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' }); // Enviar una respuesta de error al cliente en caso de un error en el comando git
    });
};

async function runGitCommand(command: string, cwd: string): Promise<string> {
    try {
        const dir = path.join(process.cwd() + "/../app");
        const hasGitLock = fs.existsSync(path.join(dir, '.git/config.lock'));
        const hasGitHeadLock = fs.existsSync(path.join(dir, '.git/HEAD.lock'));
        const hasGitIndexLock = fs.existsSync(path.join(dir, '.git/index.lock'));

        if (!hasGitLock || !hasGitHeadLock || !hasGitIndexLock) {
            const stdout = execSync(command, { cwd, encoding: 'utf-8' });
            return stdout;
        } else {
            // Introducir una pequeña pausa antes de intentar nuevamente
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await runGitCommand(command, cwd);
        }
    } catch (error) {
        console.error(`Error al ejecutar comando "${command}":`, error);
        throw new Error(`Error al ejecutar comando "${command}"`);
    }
}

export const gitInit = async (req: Request, res: Response) => {
    try {
        const dir = path.join(process.cwd() + "/../app");
        const isDirEmpty = fs.readdirSync(dir).length === 0;

        if (!isDirEmpty) {
            console.log('The directory is not empty. Cleaning...');
            await cleanFolder(dir)
            console.log("Clean")
        }
        // Verificar si el directorio está vacío
        await runGitCommand('git init', dir);
        await runGitCommand(`git config user.email ${req.body.email}`, dir);
        await runGitCommand(`git remote add origin ${req.body.urlRemoteRepo}`, dir);
        await runGitCommand(`git config user.name ${req.body.gitUser}`, dir);
        await runGitCommand(`git branch -M main`, dir);

        const osPlatform = process.platform;
        const autocrlfConfig = osPlatform === 'win32' ? 'true' : 'input';
        await runGitCommand(`git config core.autocrlf ${autocrlfConfig}`, dir);
        await runGitCommand(`git commit --allow-empty -n -m 'Initial commit'`, dir);


        const configList = await runGitCommand('git config --list', dir);
        const necessaryOptions = ['remote.origin.url', 'user.email', 'user.name'];
        const configLines = configList.split('\n');
        const configComplete = necessaryOptions.every(option => {
            const foundOption = configLines.find((line: string) => line.startsWith(`${option}=`));
            return foundOption !== undefined && foundOption.split('=')[1].trim() !== '';
        });
        const hashCommit = execSync(`git rev-parse HEAD`, { cwd: dir, encoding: 'utf-8' });


        if (configComplete) {
            res.json({ OK: true, firstCommit: hashCommit });
        } else {
            res.json({ OK: false, error: 'La configuración de git no está completa' });
        }
    } catch (error) {
        console.error('Error general:', error);
        res.json({ OK: false, error: 'Error general' });
    }
};

export const gitClone = async (req: Request, res: Response) => {
    try {
        const dir = path.join(process.cwd() + "/../app");
        // Verificar si el directorio está vacío
        const isDirEmpty = fs.readdirSync(dir).length === 0;

        if (!isDirEmpty) {
            console.log('The directory is not empty. Cleaning...');
            await cleanFolder(dir)
            console.log("Clean")
        }
        console.log("Cloning")
        await runGitCommand(`git clone ${req.body.urlGit} .`, dir);
        // El proceso de clonación se completó con éxito
        res.json({ OK: true });
    } catch (error: any) {
        // Manejar el error en el proceso de clonación
        console.error("Error en el proceso de clonación:", error?.message);
        res.status(500).json({ OK: false, error: 'Error en el proceso de clonación' });
    }
};