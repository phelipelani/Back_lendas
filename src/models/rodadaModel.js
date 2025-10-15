import pool from "../database/db.js";

const PONTOS = {
  GOLS: 0.6,
  ASSISTENCIAS: 0.3,
  VITORIAS: 5,
  EMPATES: 2.5,
  DERROTAS: -1,
  ADVERTENCIAS: -5,
  CLEAN_SHEET: 0.3,
  GOLS_CONTRA: -0.6,
};

export async function findById(rodada_id) {
  try {
    const sql = `SELECT * FROM rodadas WHERE id = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [rodada_id]);
    console.log('[MODEL] Rodada encontrada:', rows[0]);
    return rows[0] || null;
  } catch (error) {
    console.error('[MODEL] Erro ao buscar rodada por ID:', error);
    throw error;
  }
}

export async function findJogadoresByRodadaId(rodada_id) {
  try {
    const sql = `
      SELECT j.*, rj.rodada_id 
      FROM jogadores j
      JOIN rodada_jogadores rj ON j.id = rj.jogador_id
      WHERE rj.rodada_id = ?
      ORDER BY j.nome
    `;
    const [rows] = await pool.query(sql, [rodada_id]);
    return rows;
  } catch (error) {
    console.error('[MODEL] Erro ao buscar jogadores da rodada:', error);
    throw error;
  }
}

export async function create(liga_id, data) {
  try {
    const sql = `INSERT INTO rodadas (liga_id, data, status) VALUES (?, ?, 'aberta')`;
    const [result] = await pool.query(sql, [liga_id, data]);
    return { id: result.insertId, liga_id, data, status: "aberta" };
  } catch (error) {
    console.error('[MODEL] Erro ao criar rodada:', error);
    throw error;
  }
}

export async function replaceJogadores(rodada_id, jogadores_ids) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(`DELETE FROM rodada_jogadores WHERE rodada_id = ?`, [rodada_id]);

    if (jogadores_ids && jogadores_ids.length > 0) {
      const sql = `INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES ?`;
      const values = jogadores_ids.map(id => [rodada_id, id]);
      await connection.query(sql, [values]);
    }
    await connection.commit();
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[MODEL] Erro ao substituir jogadores:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function findByLigaId(liga_id) {
  try {
    const sql = `SELECT * FROM rodadas WHERE liga_id = ? ORDER BY data`;
    const [rows] = await pool.query(sql, [liga_id]);
    return rows;
  } catch (error) {
    console.error('[MODEL] Erro ao buscar rodadas por liga:', error);
    throw error;
  }
}

export async function findByLigaIdAndData(liga_id, data) {
  try {
    const sql = `SELECT * FROM rodadas WHERE liga_id = ? AND data = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [liga_id, data]);
    return rows[0] || null;
  } catch (error) {
    console.error('[MODEL] Erro ao buscar rodada por liga e data:', error);
    throw error;
  }
}

export async function saveTimesSorteados(rodada_id, times) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query(`DELETE FROM rodada_times WHERE rodada_id = ?`, [rodada_id]);

    if (times && Array.isArray(times)) {
      const sql = `INSERT INTO rodada_times (rodada_id, jogador_id, numero_time) VALUES ?`;
      const values = [];
      times.forEach((time, index) => {
        const numeroTime = index + 1;
        if (time.jogadores && Array.isArray(time.jogadores)) {
          time.jogadores.forEach(jogador => {
            if (jogador && jogador.id) {
              values.push([rodada_id, jogador.id, numeroTime]);
            }
          });
        }
      });
      if(values.length > 0) {
        await connection.query(sql, [values]);
      }
    }
    await connection.commit();
  } catch (error) {
    if(connection) await connection.rollback();
    console.error('[MODEL] Erro ao salvar times sorteados:', error);
    throw error;
  } finally {
    if(connection) connection.release();
  }
}

export async function getTimesSorteados(rodada_id) {
  try {
    const sql = `
      SELECT j.*, rt.numero_time 
      FROM jogadores j
      JOIN rodada_times rt ON j.id = rt.jogador_id
      WHERE rt.rodada_id = ?
      ORDER BY rt.numero_time
    `;
    const [rows] = await pool.query(sql, [rodada_id]);
    return rows;
  } catch (error) {
    console.error('[MODEL] Erro ao buscar times sorteados:', error);
    throw error;
  }
}

export async function finalizar(rodada_id) {
  console.log(`[MODEL] Iniciando finalização da rodada ${rodada_id}`);
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rodadas] = await connection.query("SELECT * FROM rodadas WHERE id = ? LIMIT 1", [rodada_id]);
    const rodadaExistente = rodadas[0];

    if (!rodadaExistente) throw new Error(`Rodada ${rodada_id} não encontrada`);
    console.log(`[MODEL] Rodada ${rodada_id} encontrada:`, rodadaExistente);
    if (rodadaExistente.status === 'finalizada') throw new Error('Rodada já foi finalizada anteriormente');

    const sqlResultados = `
      SELECT 
        r.jogador_id, j.nome, j.joga_recuado,
        COALESCE(SUM(r.gols), 0) as total_gols,
        COALESCE(SUM(r.assistencias), 0) as total_assistencias,
        COALESCE(SUM(r.vitorias), 0) as total_vitorias,
        COALESCE(SUM(r.empates), 0) as total_empates,
        COALESCE(SUM(r.derrotas), 0) as total_derrotas,
        COALESCE(SUM(r.advertencias), 0) as total_advertencias,
        COALESCE(SUM(r.gols_contra), 0) as total_gols_contra,
        COALESCE(SUM(r.sem_sofrer_gols), 0) as total_clean_sheets
      FROM resultados r
      RIGHT JOIN jogadores j ON r.jogador_id = j.id
      JOIN rodada_jogadores rj ON j.id = rj.jogador_id
      JOIN partidas p ON r.partida_id = p.id
      WHERE p.rodada_id = ? AND rj.rodada_id = ?
      GROUP BY r.jogador_id, j.nome, j.joga_recuado
    `;
    const [jogadoresComPontos] = await connection.query(sqlResultados, [rodada_id, rodada_id]);
    console.log(`[MODEL] Jogadores encontrados: ${jogadoresComPontos.length}`);

    if (jogadoresComPontos.length === 0 || jogadoresComPontos.every(j => j.total_gols === 0 && j.total_assistencias === 0)) {
      await connection.query(`UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, [rodada_id]);
      await connection.commit();
      console.log(`[MODEL] Rodada ${rodada_id} finalizada sem resultados de partidas`);
      return { message: 'Rodada finalizada sem resultados de partidas.', mvps: [], pesDeRato: [], total_jogadores: 0 };
    }

    const jogadoresComPontuacao = jogadoresComPontos.map(jogador => {
      const pontos = (
        (jogador.total_gols || 0) * PONTOS.GOLS +
        (jogador.total_assistencias || 0) * PONTOS.ASSISTENCIAS +
        (jogador.total_vitorias || 0) * PONTOS.VITORIAS +
        (jogador.total_empates || 0) * PONTOS.EMPATES +
        (jogador.total_derrotas || 0) * PONTOS.DERROTAS +
        (jogador.total_advertencias || 0) * PONTOS.ADVERTENCIAS +
        (jogador.total_gols_contra || 0) * PONTOS.GOLS_CONTRA +
        (jogador.joga_recuado === 1 ? (jogador.total_clean_sheets || 0) * PONTOS.CLEAN_SHEET : 0)
      );
      return { ...jogador, total_pontos: parseFloat(pontos.toFixed(2)) };
    });

    const pontuacoes = jogadoresComPontuacao.map(p => p.total_pontos);
    const maxPontos = Math.max(...pontuacoes);
    const minPontos = Math.min(...pontuacoes);
    const mvps = jogadoresComPontuacao.filter(p => p.total_pontos === maxPontos);
    const pesDeRato = jogadoresComPontuacao.filter(p => p.total_pontos === minPontos && p.total_pontos !== maxPontos);

    console.log(`[MODEL] MVP(s): ${mvps.length}, Pontos: ${maxPontos}`);
    console.log(`[MODEL] Pé(s) de Rato: ${pesDeRato.length}, Pontos: ${minPontos}`);

    const sqlPremio = `INSERT INTO premios_rodada (rodada_id, jogador_id, tipo_premio, pontuacao) VALUES ?`;
    const mvpsValues = mvps.map(mvp => [rodada_id, mvp.jogador_id, "mvp", maxPontos]);
    if (mvpsValues.length > 0) {
      await connection.query(sqlPremio, [mvpsValues]);
    }

    const pesDeRatoValues = pesDeRato.map(pe => [rodada_id, pe.jogador_id, "pe_de_rato", minPontos]);
    if (pesDeRatoValues.length > 0) {
      await connection.query(sqlPremio, [pesDeRatoValues]);
    }

    await connection.query(`UPDATE rodadas SET status = 'finalizada' WHERE id = ?`, [rodada_id]);
    await connection.commit();
    console.log(`[MODEL] Rodada ${rodada_id} finalizada com sucesso`);
    
    return { 
      mvps: mvps.map(m => ({ id: m.jogador_id, nome: m.nome, pontos: m.total_pontos })),
      pesDeRato: pesDeRato.map(p => ({ id: p.jogador_id, nome: p.nome, pontos: p.total_pontos })),
      total_jogadores: jogadoresComPontuacao.length,
      max_pontos: maxPontos,
      min_pontos: minPontos
    };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[MODEL] Erro ao finalizar rodada:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

<<<<<<< HEAD
export function getResultadosCompletos(rodada_id) {
  const PONTOS = {
GOLS: 4.0,          // Aumentado drasticamente
  ASSISTENCIAS: 2.5,    // Aumentado drasticamente
  VITORIAS: 5.0,        // Mantido (ou pode ser reduzido para 4.0)
  EMPATES: 2.0,         // Reduzido
  DERROTAS: -1.0,       // Mantido
  ADVERTENCIAS: -3.0,   // Penalidade um pouco menor
  CLEAN_SHEET: 1.5,     // Bônus defensivo mais relevante
  GOLS_CONTRA: -4.0,     // Penalidade severa, igual a anular um gol feito.
  };

  return new Promise((resolve, reject) => {
    // Consulta SQL reestruturada para garantir a precisão dos dados
=======
export async function getResultadosCompletos(rodada_id) {
  try {
>>>>>>> 474d8a7f07d990e1a151ef4ebd435290dad55aed
    const sql = `
      WITH JogadoresDaRodada AS (
        -- 1. Primeiro, pegamos todos os jogadores da rodada e seus times
        SELECT
          j.id,
          j.nome,
          j.joga_recuado,
          CASE rt.numero_time
            WHEN 1 THEN 'Time Amarelo'
            WHEN 2 THEN 'Time Preto'
            WHEN 3 THEN 'Time Azul'
            WHEN 4 THEN 'Time Rosa'
            ELSE 'Sem Time'
          END as time
        FROM jogadores j
        JOIN rodada_jogadores rj ON j.id = rj.jogador_id
        LEFT JOIN rodada_times rt ON j.id = rt.jogador_id AND rj.rodada_id = rt.rodada_id
        WHERE rj.rodada_id = ?
      )
      -- 2. Agora, para cada jogador, agregamos os resultados
      SELECT
        j.id,
        j.nome,
        j.joga_recuado,
        j.time,
        COALESCE(SUM(res.gols), 0) as gols,
        COALESCE(SUM(res.assistencias), 0) as assistencias,
        COALESCE(SUM(res.vitorias), 0) as vitorias,
        COALESCE(SUM(res.empates), 0) as empates,
        COALESCE(SUM(res.derrotas), 0) as derrotas,
        COALESCE(SUM(res.advertencias), 0) as advertencias,
        COALESCE(SUM(res.gols_contra), 0) as gols_contra,
        COALESCE(SUM(res.sem_sofrer_gols), 0) as clean_sheets,
        (
          COALESCE(SUM(res.gols), 0) * ${PONTOS.GOLS} +
          COALESCE(SUM(res.assistencias), 0) * ${PONTOS.ASSISTENCIAS} +
          COALESCE(SUM(res.vitorias), 0) * ${PONTOS.VITORIAS} +
          COALESCE(SUM(res.empates), 0) * ${PONTOS.EMPATES} +
          COALESCE(SUM(res.derrotas), 0) * ${PONTOS.DERROTAS} +
          COALESCE(SUM(res.advertencias), 0) * ${PONTOS.ADVERTENCIAS} +
          COALESCE(SUM(CASE WHEN j.joga_recuado = 1 THEN res.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END), 0)
        ) as total_pontos
      FROM JogadoresDaRodada j
      LEFT JOIN partidas p ON p.rodada_id = ?
      LEFT JOIN resultados res ON res.jogador_id = j.id AND res.partida_id = p.id
      GROUP BY j.id, j.nome, j.joga_recuado, j.time
      ORDER BY total_pontos DESC;
    `;
    // A consulta agora precisa do rodada_id apenas 2 vezes
    db.all(sql, [rodada_id, rodada_id], (err, rows) => {
      if (err) {
        console.error("[MODEL] Erro ao buscar resultados completos (v2):", err);
        return reject(err);
      }

      const resultados = rows.map((row) => ({
        ...row,
        total_pontos: row.total_pontos ? parseFloat(row.total_pontos.toFixed(2)) : 0,
        gols: parseInt(row.gols || 0),
        assistencias: parseInt(row.assistencias || 0),
        vitorias: parseInt(row.vitorias || 0),
        empates: parseInt(row.empates || 0),
        derrotas: parseInt(row.derrotas || 0),
        advertencias: parseInt(row.advertencias || 0),
        gols_contra: parseInt(row.gols_contra || 0),
        clean_sheets: parseInt(row.clean_sheets || 0),
      }));

      resolve(resultados);
    });
  });
}


