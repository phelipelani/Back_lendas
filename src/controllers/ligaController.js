import * as LigaModel from '../models/ligaModel.js';
import { validationResult } from 'express-validator'; // <-- Importe o validationResult

// Controller para criar uma nova liga
export async function createLiga(req, res) {
    // Verifica se houve erros de validação detetados pelo middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Se houver erros, retorna um status 400 com a lista de erros
      return res.status(400).json({ errors: errors.array() });
    }

    // A validação manual foi removida daqui.
    // Se o código chegou até aqui, os dados são seguros e válidos.
    const { nome, data_inicio, data_fim } = req.body;

    try {
        const novaLiga = await LigaModel.add({ nome, data_inicio, data_fim });
        res.status(201).json({ message: 'Liga criada com sucesso!', liga: novaLiga });
    } catch (error) {
        if (error.errno === 19) {
            return res.status(409).json({ message: 'Uma liga com este nome já existe.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao criar liga.', error: error.message });
    }
}

// Controller para buscar todas as ligas
export async function getAllLigas(req, res) {
    try {
        const ligas = await LigaModel.findAll();
        res.status(200).json(ligas);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar ligas.', error: error.message });
    }
}

// Controller para buscar uma liga específica pelo ID
export async function getLigaById(req, res) {
    const { id } = req.params;
    try {
        const liga = await LigaModel.findById(id);
        if (liga) {
            res.status(200).json(liga);
        } else {
            res.status(404).json({ message: 'Liga não encontrada.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar liga.', error: error.message });
    }
}
