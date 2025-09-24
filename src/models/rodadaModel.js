import db from "../database/db.js";

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

export function findById(rodada_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM rodadas WHERE id = ? LIMIT 1`;
    db.get(sql, [rodada_id], (err, row) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar rodada por ID:', err);
        return reject(err);
      }
      console.log('[MODEL] Rodada encontrada:', row);
      resolve(row || null);
    });
  });
}

export function findJogadoresByRodadaId(rodada_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT j.*, rj.rodada_id 
      FROM jogadores j
      JOIN rodada_jogadores rj ON j.id = rj.jogador_id
      WHERE rj.rodada_id = ?
      ORDER BY j.nome
    `;
    db.all(sql, [rodada_id], (err, rows) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar jogadores da rodada:', err);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

export function create(liga_id, data) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO rodadas (liga_id, data, status) VALUES (?, ?, 'aberta')`;
    db.run(sql, [liga_id, data], function (err) {
      if (err) {
        console.error('[MODEL] Erro ao criar rodada:', err);
        return reject(err);
      }
      resolve({ id: this.lastID, liga_id, data, status: "aberta" });
    });
  });
}

export function replaceJogadores(rodada_id, jogadores_ids) {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        await new Promise((res, rej) =>
          db.run("BEGIN TRANSACTION", (err) => (err ? rej(err) : res()))
        );
        await new Promise((res, rej) =>
          db.run(
            `DELETE FROM rodada_jogadores WHERE rodada_id = ?`,
            [rodada_id],
            (err) => (err ? rej(err) : res())
          )
        );
        if (jogadores_ids && jogadores_ids.length > 0) {
          const sql = `INSERT INTO rodada_jogadores (rodada_id, jogador_id) VALUES (?, ?)`;
          for (const jogador_id of jogadores_ids) {
            await new Promise((res, rej) =>
              db.run(sql, [rodada_id, jogador_id], (err) =>
                err ? rej(err) : res()
              )
            );
          }
        }
        await new Promise((res, rej) =>
          db.run("COMMIT", (err) => (err ? rej(err) : res()))
        );
        resolve();
      } catch (error) {
        await new Promise((res, rej) =>
          db.run("ROLLBACK", (err) => (err ? rej(err) : res()))
        );
        console.error('[MODEL] Erro ao substituir jogadores:', error);
        reject(error);
      }
    });
  });
}

export function findByLigaId(liga_id) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM rodadas WHERE liga_id = ? ORDER BY data`;
    db.all(sql, [liga_id], (err, rows) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar rodadas por liga:', err);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

export function findByLigaIdAndData(liga_id, data) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM rodadas WHERE liga_id = ? AND data = ? LIMIT 1`;
    db.get(sql, [liga_id, data], (err, row) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar rodada por liga e data:', err);
        return reject(err);
      }
      resolve(row);
    });
  });
}

export function saveTimesSorteados(rodada_id, times) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO rodada_times (rodada_id, jogador_id, numero_time) VALUES (?, ?, ?)`;
    db.serialize(async () => {
      try {
        await new Promise((res, rej) =>
          db.run("BEGIN TRANSACTION", (err) => (err ? rej(err) : res()))
        );
        await new Promise((res, rej) =>
          db.run(
            `DELETE FROM rodada_times WHERE rodada_id = ?`,
            [rodada_id],
            (err) => (err ? rej(err) : res())
          )
        );

        if (times && Array.isArray(times)) {
          for (let i = 0; i < times.length; i++) {
            const time = times[i];
            const numeroTime = i + 1;
            if (time.jogadores && Array.isArray(time.jogadores)) {
              for (const jogador of time.jogadores) {
                if (jogador && jogador.id) {
                  await new Promise((res, rej) =>
                    db.run(sql, [rodada_id, jogador.id, numeroTime], (err) =>
                      err ? rej(err) : res()
                    )
                  );
                }
              }
            }
          }
        }
        
        await new Promise((res, rej) =>
          db.run("COMMIT", (err) => (err ? rej(err) : res()))
        );
        resolve();
      } catch (error) {
        await new Promise((res, rej) =>
          db.run("ROLLBACK", (err) => (err ? rej(err) : res()))
        );
        console.error('[MODEL] Erro ao salvar times sorteados:', error);
        reject(error);
      }
    });
  });
}

export function getTimesSorteados(rodada_id) {
  return new Promise((resolve, reject) => {
    const sql = `
            SELECT j.*, rt.numero_time 
            FROM jogadores j
            JOIN rodada_times rt ON j.id = rt.jogador_id
            WHERE rt.rodada_id = ?
            ORDER BY rt.numero_time
        `;
    db.all(sql, [rodada_id], (err, rows) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar times sorteados:', err);
        return reject(err);
      }
      resolve(rows);
    });
  });
}

export function finalizar(rodada_id) {
  return new Promise((resolve, reject) => {
    console.log(`[MODEL] Iniciando finalização da rodada ${rodada_id}`);
    
    db.serialize(async () => {
      try {
        await new Promise((res, rej) =>
          db.run("BEGIN TRANSACTION", (err) => (err ? rej(err) : res()))
        );

        const rodadaExistente = await new Promise((res, rej) =>
          db.get("SELECT * FROM rodadas WHERE id = ? LIMIT 1", [rodada_id], (err, row) =>
            err ? rej(err) : res(row)
          )
        );

        if (!rodadaExistente) {
          await new Promise((res, rej) => db.run("ROLLBACK", (err) => (err ? rej(err) : res())));
          console.error(`[MODEL] Rodada ${rodada_id} não encontrada`);
          return reject(new Error(`Rodada ${rodada_id} não encontrada`));
        }

        console.log(`[MODEL] Rodada ${rodada_id} encontrada:`, rodadaExistente);

        if (rodadaExistente.status === 'finalizada') {
          await new Promise((res, rej) => db.run("ROLLBACK", (err) => (err ? rej(err) : res())));
          console.log(`[MODEL] Rodada ${rodada_id} já finalizada`);
          return reject(new Error('Rodada já foi finalizada anteriormente'));
        }

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
        
        const jogadoresComPontos = await new Promise((res, rej) =>
          db.all(sqlResultados, [rodada_id, rodada_id], (err, rows) =>
            err ? rej(err) : res(rows)
          )
        );

        console.log(`[MODEL] Jogadores encontrados: ${jogadoresComPontos.length}`);

        if (jogadoresComPontos.length === 0 || jogadoresComPontos.every(j => j.total_gols === 0 && j.total_assistencias === 0)) {
          await new Promise((res, rej) =>
            // ===== CORREÇÃO 1 APLICADA AQUI =====
            db.run(
              `UPDATE rodadas SET status = 'finalizada' WHERE id = ?`,
              [rodada_id],
              (err) => (err ? rej(err) : res())
            )
          );
          
          await new Promise((res, rej) => db.run("COMMIT", (err) => (err ? rej(err) : res())));
          
          console.log(`[MODEL] Rodada ${rodada_id} finalizada sem resultados de partidas`);
          return resolve({ message: 'Rodada finalizada sem resultados de partidas.', mvps: [], pesDeRato: [], total_jogadores: 0 });
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

        const sqlPremio = `INSERT INTO premios_rodada (rodada_id, jogador_id, tipo_premio, pontuacao) VALUES (?, ?, ?, ?)`;
        
        for (const mvp of mvps) {
          await new Promise((res, rej) =>
            db.run(sqlPremio, [rodada_id, mvp.jogador_id, "mvp", maxPontos], (err) => {
                if (err) console.error('[MODEL] Erro ao salvar MVP:', err);
                res();
            })
          );
        }
        
        for (const pe of pesDeRato) {
          await new Promise((res, rej) =>
            db.run(sqlPremio, [rodada_id, pe.jogador_id, "pe_de_rato", minPontos], (err) => {
                if (err) console.error('[MODEL] Erro ao salvar Pé de Rato:', err);
                res();
            })
          );
        }

        await new Promise((res, rej) =>
          // ===== CORREÇÃO 2 APLICADA AQUI =====
          db.run(
            `UPDATE rodadas SET status = 'finalizada' WHERE id = ?`,
            [rodada_id],
            (err) => (err ? rej(err) : res())
          )
        );

        await new Promise((res, rej) => db.run("COMMIT", (err) => (err ? rej(err) : res())));

        console.log(`[MODEL] Rodada ${rodada_id} finalizada com sucesso`);
        
        resolve({ 
          mvps: mvps.map(m => ({ id: m.jogador_id, nome: m.nome, pontos: m.total_pontos })),
          pesDeRato: pesDeRato.map(p => ({ id: p.jogador_id, nome: p.nome, pontos: p.total_pontos })),
          total_jogadores: jogadoresComPontuacao.length,
          max_pontos: maxPontos,
          min_pontos: minPontos
        });

      } catch (error) {
        await new Promise((res, rej) => db.run("ROLLBACK", (err) => (err ? rej(err) : res())));
        console.error('[MODEL] Erro ao finalizar rodada:', error);
        reject(error);
      }
    });
  });
}

export function getResultadosCompletos(rodada_id) {
  const PONTOS = {
    GOLS: 0.6,
    ASSISTENCIAS: 0.3,
    VITORIAS: 5,
    EMPATES: 2.5,
    DERROTAS: -1,
    ADVERTENCIAS: -5,
    CLEAN_SHEET: 0.3,
  };
  
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        j.nome, j.id, j.joga_recuado,
        COALESCE(SUM(r.gols), 0) as gols,
        COALESCE(SUM(r.assistencias), 0) as assistencias,
        COALESCE(SUM(r.vitorias), 0) as vitorias,
        COALESCE(SUM(r.empates), 0) as empates,
        COALESCE(SUM(r.derrotas), 0) as derrotas,
        COALESCE(SUM(r.advertencias), 0) as advertencias,
        COALESCE(SUM(r.gols_contra), 0) as gols_contra,
        COALESCE(SUM(r.sem_sofrer_gols), 0) as clean_sheets,
        (
          COALESCE(SUM(r.gols), 0) * ${PONTOS.GOLS} + 
          COALESCE(SUM(r.assistencias), 0) * ${PONTOS.ASSISTENCIAS} +
          COALESCE(SUM(r.vitorias), 0) * ${PONTOS.VITORIAS} + 
          COALESCE(SUM(r.empates), 0) * ${PONTOS.EMPATES} +
          COALESCE(SUM(r.derrotas), 0) * ${PONTOS.DERROTAS} + 
          COALESCE(SUM(r.advertencias), 0) * ${PONTOS.ADVERTENCIAS} +
          COALESCE(SUM(CASE WHEN j.joga_recuado = 1 THEN r.sem_sofrer_gols * ${PONTOS.CLEAN_SHEET} ELSE 0 END), 0)
        ) as total_pontos
      FROM resultados r
      RIGHT JOIN jogadores j ON r.jogador_id = j.id
      JOIN rodada_jogadores rj ON j.id = rj.jogador_id
      JOIN partidas p ON r.partida_id = p.id
      WHERE p.rodada_id = ? AND rj.rodada_id = ?
      GROUP BY j.id, j.nome, j.joga_recuado
      ORDER BY total_pontos DESC;
    `;
    
    db.all(sql, [rodada_id, rodada_id], (err, rows) => {
      if (err) {
        console.error('[MODEL] Erro ao buscar resultados completos:', err);
        return reject(err);
      }
      
      const resultados = rows.map((row) => ({
        ...row,
        total_pontos: parseFloat(row.total_pontos.toFixed(2)),
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