import db from "../database/db.js";

export function add(nome, role = "player") {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO jogadores (nome, role) VALUES (?, ?)";
    db.run(sql, [nome, role], function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, nome, role });
    });
  });
}

export function findAll() {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT id, nome, role, joga_recuado, nivel FROM jogadores ORDER BY nome";
    db.all(sql, [], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

export function updateRole(id, role) {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE jogadores SET role = ? WHERE id = ?";
    db.run(sql, [role, id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0)
        return reject(new Error("Jogador não encontrado."));
      resolve({ id, role });
    });
  });
}

export function updateCaracteristica(id, joga_recuado) {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE jogadores SET joga_recuado = ? WHERE id = ?";
    db.run(sql, [joga_recuado, id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0)
        return reject(new Error("Jogador não encontrado."));
      resolve({ id, joga_recuado });
    });
  });
}

// Model para atualizar o nível de um jogador
export function updateNivel(id, nivel) {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE jogadores SET nivel = ? WHERE id = ?";
    db.run(sql, [nivel, id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0)
        return reject(new Error("Jogador não encontrado."));
      resolve({ id, nivel });
    });
  });
}

export function findByRodadaId(rodada_id) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT j.* FROM jogadores j
            JOIN rodada_jogadores rj ON j.id = rj.jogador_id
            WHERE rj.rodada_id = ?
        `;
        db.all(sql, [rodada_id], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// export function findByName(nome) {
//     return new Promise((resolve, reject) => {
//         const sql = `SELECT * FROM jogadores WHERE nome = ?`;
//         db.get(sql, [nome], (err, row) => {
//             if (err) return reject(err);
//             resolve(row);
//         });
//     });
// }


export function findByName(nome) {
    return new Promise((resolve, reject) => {
        // Usamos a função LOWER() do SQL para tornar a busca case-insensitive
        const sql = `SELECT * FROM jogadores WHERE LOWER(nome) = LOWER(?)`;
        db.get(sql, [nome], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}


