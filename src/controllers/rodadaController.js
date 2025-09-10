import * as RodadaModel from '../models/rodadaModel.js';
import * as JogadorModel from '../models/jogadorModel.js';
import * as PartidaModel from '../models/partidaModel.js';
import * as LigaModel from '../models/ligaModel.js';
import { validationResult } from 'express-validator'; // <-- A IMPORTAÇÃO QUE FALTAVA

export async function createRodada(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { liga_id } = req.params;
    const { data } = req.body;
    
    try {
        const liga = await LigaModel.findById(liga_id);
        if (!liga) {
            return res.status(404).json({ message: 'Liga não encontrada.' });
        }

        const dataRodada = new Date(data);
        const dataInicioLiga = new Date(liga.data_inicio);
        const dataFimLiga = new Date(liga.data_fim);

        if (dataRodada < dataInicioLiga || dataRodada > dataFimLiga) {
            return res.status(400).json({ message: `A data da rodada deve estar entre ${liga.data_inicio} e ${liga.data_fim}.` });
        }

        const rodadaExistente = await RodadaModel.findByLigaIdAndData(liga_id, data);
        if (rodadaExistente) {
            return res.status(409).json({ message: 'Já existe uma rodada agendada para esta data nesta liga.' });
        }

        const novaRodada = await RodadaModel.create(liga_id, data);
        res.status(201).json(novaRodada);
    } catch (error) {
        console.error('[BACKEND] Erro ao criar rodada:', error);
        res.status(500).json({ message: 'Erro ao criar rodada.', error: error.message });
    }
}

export async function syncJogadoresDaRodada(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rodada_id } = req.params;
    const { nomes } = req.body;

    try {
        let jogadoresNovos = 0;
        let jogadoresExistentes = 0;
        const jogadoresProcessados = [];

        for (const nome of nomes) {
            let jogador = await JogadorModel.findByName(nome);
            
            if (!jogador) {
                jogador = await JogadorModel.add(nome, 'player');
                jogadoresNovos++;
            } else {
                jogadoresExistentes++;
            }
            jogadoresProcessados.push(jogador);
        }

        const jogadoresIds = jogadoresProcessados.map(j => j.id);
        await RodadaModel.replaceJogadores(rodada_id, jogadoresIds);

        res.status(200).json({
            jogadores: jogadoresProcessados,
            novos: jogadoresNovos,
            existentes: jogadoresExistentes
        });

    } catch (error) {
        console.error('[BACKEND] ERRO FATAL AO SINCRONIZAR:', error);
        res.status(500).json({ message: 'Erro ao sincronizar jogadores na rodada.', error: error.message });
    }
}

// ... (as outras funções do controller, como getRodadasByLiga, etc., continuam aqui)
export async function getRodadasByLiga(req, res) {
    const { liga_id } = req.params;
    try {
        const rodadas = await RodadaModel.findByLigaId(liga_id);
        res.status(200).json(rodadas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar rodadas da liga.', error: error.message });
    }
}

export async function getJogadoresDaRodada(req, res) {
    const { rodada_id } = req.params;
    try {
        const jogadores = await RodadaModel.findJogadoresByRodadaId(rodada_id);
        res.status(200).json(jogadores);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar jogadores da rodada.', error: error.message });
    }
}

export async function createPartidaNaRodada(req, res) {
    const { rodada_id } = req.params;
    try {
        const novaPartida = await PartidaModel.create(rodada_id);
        res.status(201).json(novaPartida);
    } catch (error) {
        console.error('[BACKEND] Erro ao criar partida na rodada:', error);
        res.status(500).json({ message: 'Erro ao criar partida.', error: error.message });
    }
}

export async function finalizarRodada(req, res) {
    const { rodada_id } = req.params;
    try {
        const resultado = await RodadaModel.finalizar(rodada_id);
        res.status(200).json({ message: 'Rodada finalizada com sucesso!', ...resultado });
    } catch (error) {
        console.error('[BACKEND] Erro ao finalizar rodada:', error);
        res.status(500).json({ message: 'Erro ao finalizar rodada.', error: error.message });
    }
}

export async function saveTimes(req, res) {
    const { rodada_id } = req.params;
    const { times } = req.body;
    if (!times || !Array.isArray(times)) {
        return res.status(400).json({ message: 'A lista de times é obrigatória.' });
    }
    try {
        await RodadaModel.saveTimesSorteados(rodada_id, times);
        res.status(200).json({ message: 'Times guardados com sucesso!' });
    } catch (error) {
        console.error('[BACKEND] ERRO AO GUARDAR TIMES:', error);
        res.status(500).json({ message: 'Erro ao guardar os times.', error: error.message });
    }
}

export async function getTimes(req, res) {
    const { rodada_id } = req.params;
    try {
        const jogadoresPorTime = await RodadaModel.getTimesSorteados(rodada_id);
        res.status(200).json(jogadoresPorTime);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar os times.', error: error.message });
    }
}

export async function getResultadosDaRodada(req, res) {
    const { rodada_id } = req.params;
    try {
        const resultados = await RodadaModel.getResultadosCompletos(rodada_id);
        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar resultados da rodada.', error: error.message });
    }
}
