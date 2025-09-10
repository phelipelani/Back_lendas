// Arquivo: src/routes/partidaRoutes.js
import { Router } from 'express';
import { updateResultadosPartida } from '../controllers/partidaController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Rota para atualizar os resultados de uma partida específica
router.put('/:partida_id/resultados', isAdmin, updateResultadosPartida);

// As rotas de estatísticas (GET) continuam aqui, mas agora precisam ser refatoradas
// para buscar dados de rodadas finalizadas.

export default router;
