import { Router } from 'express';
import { 
    createRodada, 
    createPartidaNaRodada, 
    finalizarRodada, 
    getRodadasByLiga, 
    syncJogadoresDaRodada, 
    getJogadoresDaRodada,
    saveTimes,
    getTimes,
    getResultadosDaRodada
} from '../controllers/rodadaController.js';
import { isAdmin } from '../middleware/authMiddleware.js';
// Importa as novas regras de validação
import { validateCreateRodada, validateSyncJogadores } from '../validators/rodadaValidator.js';

const router = Router();

router.get('/liga/:liga_id', getRodadasByLiga);
router.get('/:rodada_id/jogadores', getJogadoresDaRodada);
router.get('/:rodada_id/times', getTimes);
router.get('/:rodada_id/resultados', getResultadosDaRodada);

// Aplica o middleware de validação na rota de criação
router.post('/liga/:liga_id', isAdmin, validateCreateRodada, createRodada);

// Aplica o middleware de validação na rota de sincronização de jogadores
router.post('/:rodada_id/sync-jogadores', isAdmin, validateSyncJogadores, syncJogadoresDaRodada);

router.post('/:rodada_id/partidas', isAdmin, createPartidaNaRodada);
router.post('/:rodada_id/finalizar', isAdmin, finalizarRodada);
router.post('/:rodada_id/times', isAdmin, saveTimes);

export default router;
