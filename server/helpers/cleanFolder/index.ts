import * as fs from "fs"
import * as path from "path"

export const cleanFolder = async (directory: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        try {
            const file = fs.readdirSync(directory);
            file.forEach((archivo: string) => {
                const filePath = path.join(directory, archivo);
                if (filePath && fs.statSync(filePath).isDirectory()) {
                    cleanFolder(filePath);
                    fs.rmdirSync(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            });
            resolve();
        } catch (error) {
            console.error('Error al vaciar la carpeta:', error);
            reject(error);
        }
    });
};