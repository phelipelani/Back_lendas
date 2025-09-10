import { Router } from 'express';
import { createCampeonato, addVencedoresCampeonato, getTitulos } from '../controllers/campeonatoController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', isAdmin, createCampeonato);
router.post('/:campeonato_id/vencedores', isAdmin, addVencedoresCampeonato);
router.get('/titulos', getTitulos); // Rota pública

export default router;