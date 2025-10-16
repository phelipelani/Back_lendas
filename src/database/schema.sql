CREATE TABLE IF NOT EXISTS jogadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'player',
    joga_recuado BOOLEAN NOT NULL DEFAULT 0,
    nivel INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ligas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data_inicio TEXT NOT NULL,
    data_fim TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rodadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    liga_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aberta',
    FOREIGN KEY (liga_id) REFERENCES ligas(id)
);

CREATE TABLE IF NOT EXISTS partidas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    rodada_id INTEGER,
    placar_time1 INTEGER DEFAULT 0,
    placar_time2 INTEGER DEFAULT 0,
    duracao_segundos INTEGER DEFAULT 0,
    time1_numero INTEGER,
    time2_numero INTEGER,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id)
);

CREATE TABLE IF NOT EXISTS resultados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partida_id INTEGER NOT NULL,
    jogador_id INTEGER NOT NULL,
    time TEXT NOT NULL,
    gols INTEGER DEFAULT 0,
    assistencias INTEGER DEFAULT 0,
    vitorias INTEGER DEFAULT 0,
    derrotas INTEGER DEFAULT 0,
    empates INTEGER DEFAULT 0,
    advertencias INTEGER DEFAULT 0,
    sem_sofrer_gols BOOLEAN NOT NULL DEFAULT 0,
    gols_contra INTEGER DEFAULT 0,
    FOREIGN KEY (partida_id) REFERENCES partidas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
);

CREATE TABLE IF NOT EXISTS rodada_jogadores (
    rodada_id INTEGER NOT NULL,
    jogador_id INTEGER NOT NULL,
    PRIMARY KEY (rodada_id, jogador_id),
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
);

CREATE TABLE IF NOT EXISTS rodada_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rodada_id INTEGER NOT NULL,
    jogador_id INTEGER NOT NULL,
    numero_time INTEGER NOT NULL,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
);

CREATE TABLE IF NOT EXISTS premios_rodada (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rodada_id INTEGER NOT NULL,
    jogador_id INTEGER NOT NULL,
    tipo_premio TEXT NOT NULL,
    pontuacao REAL NOT NULL,
    FOREIGN KEY (rodada_id) REFERENCES rodadas(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
);