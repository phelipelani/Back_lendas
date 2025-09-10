// Arquivo: src/controllers/partidaController.js
import * as PartidaModel from "../models/partidaModel.js";

// Controller para atualizar os resultados de uma partida
export async function updateResultadosPartida(req, res) {
  const { partida_id } = req.params;
  const data = req.body; // Recebe todos os dados da partida

  // --- LOG DE DEPURAÇÃO ---
  console.log(
    `[BACKEND] Recebido pedido para finalizar a partida ID: ${partida_id}`
  );
  console.log("[BACKEND] Dados recebidos:", JSON.stringify(data, null, 2));
  // --- FIM DO LOG ---

  if (!data || !data.time1 || !data.time2) {
    return res
      .status(400)
      .json({
        message:
          "Dados de resultados, incluindo os dois times, são obrigatórios.",
      });
  }
  try {
    await PartidaModel.updateResultados(partida_id, data);
    res.status(200).json({ message: "Resultados da partida atualizados." });
  } catch (error) {
    // Este log irá mostrar-nos o erro exato do banco de dados
    console.error("[BACKEND] ERRO AO SALVAR RESULTADOS:", error);
    res
      .status(500)
      .json({
        message: "Erro ao salvar resultados da partida",
        error: error.message,
      });
  }
}
