import * as fs from "fs"
import * as path from "path"

export const cleanFolder = async (directory: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        try {
            const archivos = fs.readdirSync(directory);
            archivos.forEach((archivo: string) => {
                const archivoRuta = path.join(directory, archivo);
                if (archivoRuta && fs.statSync(archivoRuta).isDirectory()) {
                    cleanFolder(archivoRuta);
                    fs.rmdirSync(archivoRuta);
                } else {
                    fs.unlinkSync(archivoRuta);
                }
            });
            resolve();
        } catch (error) {
            console.error('Error al vaciar la carpeta:', error);
            reject(error);
        }
    });
};