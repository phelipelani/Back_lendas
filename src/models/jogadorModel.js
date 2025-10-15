import pool from "../database/db.js";

export async function add(nome, role = "player") {
  try {
    const sql = "INSERT INTO jogadores (nome, role) VALUES (?, ?)";
    const [result] = await pool.query(sql, [nome, role]);
    return { id: result.insertId, nome, role };
  } catch (error) {
    console.error("Erro ao adicionar jogador:", error);
    throw error;
  }
}

export async function findAll() {
  try {
    const sql = "SELECT id, nome, role, joga_recuado, nivel FROM jogadores ORDER BY nome";
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    console.error("Erro ao buscar todos os jogadores:", error);
    throw error;
  }
}

export async function updateRole(id, role) {
  try {
    const sql = "UPDATE jogadores SET role = ? WHERE id = ?";
    const [result] = await pool.query(sql, [role, id]);
    if (result.affectedRows === 0) {
      throw new Error("Jogador não encontrado.");
    }
    return { id, role };
  } catch (error) {
    console.error("Erro ao atualizar role:", error);
    throw error;
  }
}

export async function updateCaracteristica(id, joga_recuado) {
    try {
        const sql = "UPDATE jogadores SET joga_recuado = ? WHERE id = ?";
        const [result] = await pool.query(sql, [joga_recuado, id]);
        if (result.affectedRows === 0) {
            throw new Error("Jogador não encontrado.");
        }
        return { id, joga_recuado };
    } catch (error) {
        console.error("Erro ao atualizar característica:", error);
        throw error;
    }
}

export async function updateNivel(id, nivel) {
    try {
        const sql = "UPDATE jogadores SET nivel = ? WHERE id = ?";
        const [result] = await pool.query(sql, [nivel, id]);
        if (result.affectedRows === 0) {
            throw new Error("Jogador não encontrado.");
        }
        return { id, nivel };
    } catch (error) {
        console.error("Erro ao atualizar nível:", error);
        throw error;
    }
}

export async function findByRodadaId(rodada_id) {
    try {
        const sql = `
            SELECT j.* FROM jogadores j
            JOIN rodada_jogadores rj ON j.id = rj.jogador_id
            WHERE rj.rodada_id = ?
        `;
        const [rows] = await pool.query(sql, [rodada_id]);
        return rows;
    } catch (error) {
        console.error("Erro ao buscar jogadores por rodada:", error);
        throw error;
    }
}

export async function findByName(nome) {
    try {
        // A função LOWER() do MySQL funciona da mesma forma que no SQLite
        const sql = `SELECT * FROM jogadores WHERE LOWER(nome) = LOWER(?)`;
        const [rows] = await pool.query(sql, [nome]);
        return rows[0] || null; // Retorna o primeiro resultado ou nulo
    } catch (error) {
        console.error("Erro ao buscar jogador por nome:", error);
        throw error;
    }
}