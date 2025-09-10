// Arquivo: src/models/ligaModel.js
import db from '../database/db.js';

// Model para adicionar uma nova liga
export function add(liga) {
    const { nome, data_inicio, data_fim } = liga;
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO ligas (nome, data_inicio, data_fim) VALUES (?, ?, ?)';
        db.run(sql, [nome, data_inicio, data_fim], function(err) {
            if (err) {
                return reject(err);
            }
            resolve({ id: this.lastID, ...liga });
        });
    });
}

// Model para buscar todas as ligas
export function findAll() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM ligas ORDER BY data_inicio DESC';
        db.all(sql, [], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}


export function findById(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM ligas WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
}