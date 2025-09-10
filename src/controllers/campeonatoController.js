import * as CampeonatoModel from '../models/campeonatoModel.js';

export async function createCampeonato(req, res) {
    const { nome, data } = req.body;
    if (!nome || !data) return res.status(400).json({ message: 'Nome e data são obrigatórios.' });
    try {
        const novo = await CampeonatoModel.create(nome, data);
        res.status(201).json(novo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar campeonato.', error: error.message });
    }
}

export async function addVencedoresCampeonato(req, res) {
    const { campeonato_id } = req.params;
    const { jogadores_ids } = req.body;
    if (!jogadores_ids || !jogadores_ids.length) return res.status(400).json({ message: 'Lista de vencedores é obrigatória.' });
    try {
        await CampeonatoModel.addVencedores(campeonato_id, jogadores_ids);
        res.status(200).json({ message: 'Vencedores adicionados com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar vencedores.', error: error.message });
    }
}

export async function getTitulos(req, res) {
    try {
        const titulos = await CampeonatoModel.getTitulosPorJogador();
        res.status(200).json(titulos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar títulos.', error: error.message });
    }
}