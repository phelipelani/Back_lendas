import { Router } from 'express';
import { createLiga, getAllLigas, getLigaById } from '../controllers/ligaController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
import { validateLiga } from '../validators/ligaValidator.js'; // <-- Importe as nossas regras

const router = Router();

// A rota de criação agora tem o 'validateLiga' como um middleware.
// Ele irá executar as validações ANTES de chegar à função 'createLiga'.
router.post('/', isAdmin, validateLiga, createLiga);

router.get('/', getAllLigas);
router.get('/:id', getLigaById);

export default router;
