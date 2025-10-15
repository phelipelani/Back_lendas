// Arquivo: src/database/migrate_mysql.js
import pool from './db.js';

const tabelas = [
`
CREATE TABLE IF NOT EXISTS jogadores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'player',
    joga_recuado BOOLEAN NOT NULL DEFAULT 0,
    nivel INT NOT NULL DEFAULT 1,
    UNIQUE(nome)
) ENGINE=InnoDB;
`,
`
CREATE TABLE IF NOT EXISTS ligas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL
) ENGINE=InnoDB;
`,
`
CREATE TABLE IF NOT EXISTS rodadas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    liga_id INT NOT NULL,
    data DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'aberta',
    FOREIGN KEY (liga_id) REFERENCES ligas(id)
) ENGINE=InnoDB;
`,
`
CREATE TABLE IF NOT EXISTS partidas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data DATE NOT NULL,
    rodada_id INT,
    placar_time1 INT DEFAULT 0,
    placar_time2 INT DEFAULT 0,
    duracao_segundos INT DEFAULT 0,
    time1_numero INT,
    time2_numero INT,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id)
) ENGINE=InnoDB;
`,
`
CREATE TABLE IF NOT EXISTS resultados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    partida_id INT NOT NULL,
    jogador_id INT NOT NULL,
    time VARCHAR(50) NOT NULL,
    gols INT DEFAULT 0,
    assistencias INT DEFAULT 0,
    vitorias INT DEFAULT 0,
    derrotas INT DEFAULT 0,
    empates INT DEFAULT 0,
    advertencias INT DEFAULT 0,
    sem_sofrer_gols BOOLEAN NOT NULL DEFAULT 0,
    gols_contra INT DEFAULT 0,
    FOREIGN KEY (partida_id) REFERENCES partidas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
) ENGINE=InnoDB;
`,
`
CREATE TABLE IF NOT EXISTS rodada_jogadores (
    rodada_id INT NOT NULL,
    jogador_id INT NOT NULL,
    PRIMARY KEY (rodada_id, jogador_id),
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
) ENGINE=InnoDB;
`,
`
CREATE TABLE IF NOT EXISTS rodada_times (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rodada_id INT NOT NULL,
    jogador_id INT NOT NULL,
    numero_time INT NOT NULL,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
) ENGINE=InnoDB;
`,
`
CREATE TABLE IF NOT EXISTS premios_rodada (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rodada_id INT NOT NULL,
    jogador_id INT NOT NULL,
    tipo_premio VARCHAR(50) NOT NULL,
    pontuacao REAL NOT NULL,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
) ENGINE=InnoDB;
`
];

async function criarTabelas() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Conectado ao banco para criar as tabelas...');
    for (const query of tabelas) {
      await connection.query(query);
      console.log('Tabela criada ou já existente.');
    }
    console.log('Todas as tabelas foram criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar as tabelas:', error);
  } finally {
    if (connection) connection.release();
    pool.end();
  }
}

criarTabelas();