import db from '../database/db.js';

export function create(nome, data) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO campeonatos (nome, data) VALUES (?, ?)`;
        db.run(sql, [nome, data], function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, nome, data });
        });
    });
}

export function addVencedores(campeonato_id, jogadores_ids) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO campeonato_vencedores (campeonato_id, jogador_id) VALUES (?, ?)`;
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            jogadores_ids.forEach(id => {
                db.run(sql, [campeonato_id, id], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                    }
                });
            });
            db.run('COMMIT', (err) => err ? reject(err) : resolve());
        });
    });
}

export function getTitulosPorJogador() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT j.nome, j.id, COUNT(cv.campeonato_id) as titulos
            FROM jogadores j
            LEFT JOIN campeonato_vencedores cv ON j.id = cv.jogador_id
            GROUP BY j.id, j.nome
            HAVING titulos > 0
            ORDER BY titulos DESC;
        `;
        db.all(sql, [], (err, rows) => err ? reject(err) : resolve(rows));
    });
}