import { Router } from 'express';
import { getEstatisticas } from '../controllers/statsController.js';

const router = Router();

// Rota pública para buscar todas as estatísticas
// Pode ser filtrada com ?liga_id=ID
router.get('/', getEstatisticas);

export default router;
