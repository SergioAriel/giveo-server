import { Router } from 'express';

import { directory, git, terminal } from './controllers';

const router = Router();

router.get('/', (_req, res) => {
    // Maneja la solicitud GET a la ruta raíz aquí
    res.json({
      status: "OK",
      message: 'Servidor iniciado'
    });
  });
  
router.get("/git/gitLog", git.gitLog)
router.post("/git/gitClone", git.gitClone)
router.post("/git/gitInit", git.gitInit)
router.delete("/directory/deleteFile", directory.deleteFile)
router.post("/terminal", terminal.runTerminal)


export default router