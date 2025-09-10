import * as StatsModel from '../models/statsModel.js';

export async function getEstatisticas(req, res) {
    // O filtro de liga virá como um query parameter (ex: /api/estatisticas?liga_id=1)
    const { liga_id } = req.query;

    try {
        const stats = await StatsModel.getLigaStats(liga_id || null);
        res.status(200).json(stats);
    } catch (error) {
        console.error("[BACKEND] Erro ao buscar estatísticas:", error);
        res.status(500).json({ message: 'Erro ao buscar estatísticas.', error: error.message });
    }
}
