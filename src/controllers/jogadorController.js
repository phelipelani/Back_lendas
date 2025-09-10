// Arquivo: src/controllers/jogadorController.js
import * as JogadorModel from "../models/jogadorModel.js";

export async function createJogador(req, res) {
  const { nome, role } = req.body;
  if (!nome)
    return res
      .status(400)
      .json({ message: "O nome do jogador é obrigatório." });
  try {
    const novoJogador = await JogadorModel.add(nome, role);
    res
      .status(201)
      .json({
        message: "Jogador adicionado com sucesso!",
        jogador: novoJogador,
      });
  } catch (error) {
    if (error.errno === 19)
      return res.status(409).json({ message: "Este jogador já existe." });
    res
      .status(500)
      .json({
        message: "Erro no servidor ao adicionar jogador.",
        error: error.message,
      });
  }
}

export async function getAllJogadores(req, res) {
  try {
    const jogadores = await JogadorModel.findAll();
    res.status(200).json(jogadores);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro no servidor ao buscar jogadores.",
        error: error.message,
      });
  }
}

export async function changeUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;
  if (!role || (role !== "admin" && role !== "player")) {
    return res
      .status(400)
      .json({
        message: "O campo 'role' é obrigatório e deve ser 'admin' ou 'player'.",
      });
  }
  try {
    await JogadorModel.updateRole(id, role);
    res
      .status(200)
      .json({
        message: `A role do jogador ${id} foi atualizada para ${role}.`,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro no servidor ao atualizar a role.",
        error: error.message,
      });
  }
}

export async function changeCaracteristica(req, res) {
  const { id } = req.params;
  const { joga_recuado } = req.body;

  if (typeof joga_recuado !== "boolean") {
    return res
      .status(400)
      .json({
        message:
          "O campo 'joga_recuado' é obrigatório e deve ser um booleano (true/false).",
      });
  }

  try {
    await JogadorModel.updateCaracteristica(id, joga_recuado);
    res
      .status(200)
      .json({ message: `A característica do jogador ${id} foi atualizada.` });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro no servidor ao atualizar característica.",
        error: error.message,
      });
  }
}

// Controller para mudar o nível de um jogador
export async function changeNivel(req, res) {
  const { id } = req.params;
  const { nivel } = req.body;
  if (typeof nivel !== "number") {
    return res
      .status(400)
      .json({ message: "O campo 'nivel' é obrigatório e deve ser um número." });
  }
  try {
    await JogadorModel.updateNivel(id, nivel);
    res
      .status(200)
      .json({ message: `O nível do jogador ${id} foi atualizado.` });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erro no servidor ao atualizar nível.",
        error: error.message,
      });
  }
}

export async function getJogadoresByRodada(req, res) {
    const { rodada_id } = req.params;
    try {
        const jogadores = await JogadorModel.findByRodadaId(rodada_id);
        res.status(200).json(jogadores);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar jogadores da rodada.', error: error.message });
    }
}
