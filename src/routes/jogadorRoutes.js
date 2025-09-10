import { Router } from "express";
// Adicione 'getJogadoresByRodada' à importação
import {
  createJogador,
  getAllJogadores,
  changeUserRole,
  changeCaracteristica,
  changeNivel,
  getJogadoresByRodada,
} from "../controllers/jogadorController.js";
import { isAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getAllJogadores);
// Adicione a nova rota para buscar jogadores de uma rodada específica
router.get("/rodada/:rodada_id", getJogadoresByRodada);

router.post("/", isAdmin, createJogador);
router.put("/:id/role", isAdmin, changeUserRole);
router.put("/:id/caracteristica", isAdmin, changeCaracteristica);
router.put("/:id/nivel", isAdmin, changeNivel);

export default router;
