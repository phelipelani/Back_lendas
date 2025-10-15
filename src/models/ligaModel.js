import pool from '../database/db.js';

export async function add(liga) {
  try {
    const { nome, data_inicio, data_fim } = liga;
    const sql = 'INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [nome, data_inicio, data_fim]);
    return { id: result.insertId, ...liga };
  } catch (error) {
    console.error("Erro ao adicionar liga:", error);
    throw error;
  }
}

export async function findAll() {
  try {
    const sql = 'SELECT * FROM ligas ORDER BY data_inicio DESC';
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    console.error("Erro ao buscar todas as ligas:", error);
    throw error;
  }
}

export async function findById(id) {
  try {
    const sql = 'SELECT * FROM ligas WHERE id = ?';
    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error("Erro ao buscar liga por ID:", error);
    throw error;
  }
}