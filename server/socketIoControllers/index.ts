import * as fs from "fs"
import { PathOrFileDescriptor, createWriteStream } from "fs";
import { execSync, spawn, spawnSync } from "child_process";
import * as path from "path";
import { Socket } from "socket.io";
import { randomUUID } from "crypto";

export const write = (socket: Socket) => {
    socket.on("write", ({ absolutePath, text }: { absolutePath: string, text: string }) => {
        const write = createWriteStream(absolutePath)

        write.write(text)
    })

}

export const read = (socket: Socket) => {

    socket.on("getRead", (absolutePath: string) => {
        if (absolutePath) {
            try {
                fs.readFile(absolutePath as PathOrFileDescriptor, (_error, data) => {
                    const splitDots = absolutePath.split(".");
                    const extension = splitDots[splitDots.length - 1]
                    console.log({
                        file: data.toString(),
                        absolutePath,
                        extension
                    })
                    socket.emit("setData", {
                        file: data.toString(),
                        absolutePath,
                        extension
                    })
                })
            } catch (error) {
                console.log(error)
            }
        }
    })
}


export const commandTerminal = (socket: Socket) => {
    socket.on("command", async (textCommand: string) => {
        try {

            const command = textCommand.split(" ")[0];
            const args = textCommand.split(" ").slice(1);
            const dir = path.join(process.cwd() + "/../app")
            const executeCommand = spawn(command, args, { cwd: dir, stdio: 'pipe' });

            executeCommand.stdout.on('data', async (data) => {
                try {
                    const respData = data.toString();
                    await socket.emit("command", respData);
                    socket.emit("pipe-shift", executeCommand.stdin.writable);
                } catch (error) {
                    console.log(error)
                }
            });

            executeCommand.stdin.on("error", (error) => {
                socket.emit("command", `Error en la tubería de entrada: ${error}`);
            });

            socket.on("input-pipe", async (inputCommand) => {
                executeCommand.stdin.write(`${inputCommand}${'\n'}`);
            });

            executeCommand.stdout.on('close', (stream: any) => {
                socket.emit("pipe-shift", stream);
            });

            executeCommand.on('error', (error) => {
                socket.emit("command", `Error al ejecutar el comando '${command}': ${error}`);
            });


        } catch (error) {
            console.error("Error general:", error);
            socket.emit("command", `Error general: ${error}`);
        }
    });
    // socket.on("keyArrow", async (inputCommand: any) => {

    // });
}


// CORREGIR LA RUTA DEL REPO Y CORRER COMANDOS DE CONFIG.NAME CONFIG.EMAIL
export const setCommits = (socket: Socket) => {
    socket.on("record", ({ timer }: any) => {
        try {
            const dir = path.join(process.cwd() + "/../app")
            const currentBranch = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: dir });
            const currentBranchName = currentBranch.stdout.toString().trim();

            if (currentBranchName !== "main") {
                // Solo ejecutar si no estás en la rama "main"
                spawnSync("git", ["checkout", "main"], { cwd: dir });

            }

            try {
                const countCommits = +execSync("git rev-list --count HEAD", { cwd: dir }).toString();
                execSync("git add .", { cwd: dir });
                const statusOutput = execSync("git status --porcelain", { cwd: dir }).toString().trim();
                // Agregar los cambios
                if (statusOutput.length || !countCommits) {
                    // Hacer commit de los cambios
                    execSync(`git commit -m 'time ${timer}'`, { cwd: dir, encoding: 'utf-8' });
                    const hashCommit = execSync(`git rev-parse HEAD`, { cwd: dir, encoding: 'utf-8' });

                    socket.emit("record", hashCommit)
                }
            } catch (error) {
                console.log(error);
            }


        } catch (error) {
            console.log(error)
        }
    })
}

async function runGitCommand(command: string, cwd: string) {
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
    }
}

export const getCommits = (socket: Socket) => {
    socket.on("play", async ({ commit, absolutePath, followFile }): Promise<any> => {
        const dir = path.join(process.cwd() + "/../app")

        await runGitCommand(`git checkout ${commit}`, dir)

        const read = (absolutePath: string) => {
            try {
                const splitDots = absolutePath.split(".");
                const extension = splitDots[splitDots.length - 1]
                fs.readFile(absolutePath, (_error, data) => {
                    socket.emit("setData", {
                        file: data?.toString(),
                        absolutePath,
                        extension
                    })
                })
            } catch (error) {
                // console.error(error)
            }
        }
        if (followFile) {
            const changedFiles = execSync('git diff-tree --no-commit-id --name-only -r HEAD', { cwd: dir }).toString().trim().split('\n');
            const absolutePathFollow = path.join(dir, `/${changedFiles[0]}`)
            console.log("164", absolutePathFollow)
            read(absolutePathFollow)
        } else {
            read(absolutePath)
        }


    })
}

export const getDirectory = async (socket: Socket) => {

    try {
        const dirPath = path.join(process.cwd() + "/../app")


        // Emitir la estructura inicial al conectar el socket
        const initialTree = await generateDirectoryTree(dirPath);
        const root = {
            path: "app",
            type: "folder",
            tree: initialTree,
            absolutePath: dirPath,
        };
        socket.emit("directory", root);

        // Establecer el watcher para futuros cambios
        const watcher = fs.watch(dirPath, { recursive: true }, async () => {

            const tree = await generateDirectoryTree(dirPath);
            const updatedRoot = {
                path: "/app",
                type: "folder",
                tree,
                absolutePath: dirPath,
            };
            socket.emit("directory", updatedRoot);

        });

        // Manejar el cierre adecuadamente para liberar recursos
        process.on("SIGINT", () => {
            watcher.close();
            process.exit();
        });
    } catch (error) {

    }


    // También puedes manejar otros eventos como 'error', 'close', etc.
};

async function generateDirectoryTree(dir: string): Promise<any> {
    let tree: any = [];
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
        const absolutePath = path.join(dir, file);
        const stat = await fs.promises.stat(absolutePath);

        if (stat.isDirectory()) {
            const recursiveTree = await generateDirectoryTree(absolutePath);
            tree.push({
                path: file,
                type: "folder",
                tree: recursiveTree,
                absolutePath,
            });
        } else {
            const uuid = randomUUID();
            const splitDots = file.split(".");
            const extension = splitDots[splitDots.length - 1]
            tree.push({
                path: file,
                type: "file",
                _id: uuid,
                absolutePath,
                extension,
            });
        }
    }

    return tree;
}