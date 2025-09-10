document.addEventListener('DOMContentLoaded', () => {
    // --- Formulários ---
    document.getElementById('add-jogador-form').addEventListener('submit', handleAddJogador);
    document.getElementById('add-liga-form').addEventListener('submit', handleAddLiga);
    document.getElementById('add-partida-form').addEventListener('submit', handleAddPartida);
    
    // --- Seletores de Time ---
    document.getElementById('jogadores-timeA').addEventListener('change', (e) => renderStatsInputs('A', e.target));
    document.getElementById('jogadores-timeB').addEventListener('change', (e) => renderStatsInputs('B', e.target));

    // --- Filtro Global de Liga ---
    document.getElementById('liga-filtro').addEventListener('change', loadAllStats);

    // Carrega os dados iniciais
    loadInitialData();
});

let todosJogadores = [];
let todasLigas = [];

function getAuthHeaders() {
    const isAdmin = document.getElementById('admin-checkbox').checked;
    return isAdmin ? { 'X-User-Role': 'admin' } : {};
}

async function loadInitialData() {
    await loadJogadores();
    await loadLigas();
    loadAllStats();
}

function loadAllStats() {
    loadRanking();
    loadDuplasStats();
    loadRankingPorPontos();
    loadConfrontosStats();
}

// ==================================================
// FUNÇÕES DE JOGADOR
// ==================================================
async function loadJogadores() {
    try {
        const response = await fetch('/api/jogadores');
        todosJogadores = await response.json();
        const listaDiv = document.getElementById('lista-jogadores');
        if (todosJogadores.length === 0) {
            listaDiv.innerHTML = '<p>Nenhum jogador cadastrado.</p>';
        } else {
            const ul = document.createElement('ul');
            todosJogadores.forEach(j => {
                const li = document.createElement('li');
                li.textContent = `${j.nome} (${j.role})`;
                ul.appendChild(li);
            });
            listaDiv.innerHTML = '';
            listaDiv.appendChild(ul);
        }
        populatePlayerSelects();
    } catch (error) {
        console.error("Erro ao carregar jogadores:", error);
    }
}

async function handleAddJogador(e) {
    e.preventDefault();
    const nome = e.target.elements.nome.value.trim();
    try {
        const response = await fetch('/api/jogadores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ nome }),
        });
        const result = await response.json();
        showMessage('jogador-message-area', result.message, response.ok ? 'success' : 'error');
        if (response.ok) {
            e.target.reset();
            loadJogadores();
        }
    } catch (error) {
        showMessage('jogador-message-area', 'Erro de conexão.', 'error');
    }
}

// ==================================================
// FUNÇÕES DE LIGA
// ==================================================
async function loadLigas() {
    try {
        const response = await fetch('/api/ligas');
        todasLigas = await response.json();
        const listaDiv = document.getElementById('lista-ligas');
        if (todasLigas.length === 0) {
            listaDiv.innerHTML = '<p>Nenhuma liga cadastrada.</p>';
        } else {
            const ul = document.createElement('ul');
            todasLigas.forEach(l => {
                const li = document.createElement('li');
                li.textContent = `${l.nome} (${l.data_inicio} a ${l.data_fim})`;
                ul.appendChild(li);
            });
            listaDiv.innerHTML = '';
            listaDiv.appendChild(ul);
        }
        populateLigaSelects();
    } catch (error) {
        console.error("Erro ao carregar ligas:", error);
    }
}

async function handleAddLiga(e) {
    e.preventDefault();
    const nome = document.getElementById('liga-nome').value;
    const data_inicio = document.getElementById('liga-inicio').value;
    const data_fim = document.getElementById('liga-fim').value;
    try {
        const response = await fetch('/api/ligas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ nome, data_inicio, data_fim }),
        });
        const result = await response.json();
        showMessage('liga-message-area', result.message, response.ok ? 'success' : 'error');
        if (response.ok) {
            e.target.reset();
            loadLigas();
        }
    } catch (error) {
        showMessage('liga-message-area', 'Erro de conexão.', 'error');
    }
}

function populateLigaSelects() {
    const selects = [document.getElementById('partida-liga'), document.getElementById('liga-filtro')];
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = select.id === 'liga-filtro' ? '<option value="">Todas as Ligas</option>' : '';
        todasLigas.forEach(liga => {
            select.add(new Option(liga.nome, liga.id));
        });
        select.value = currentValue;
    });
}

// ==================================================
// FUNÇÕES DE PARTIDA
// ==================================================
function populatePlayerSelects() {
    const selects = [document.getElementById('jogadores-timeA'), document.getElementById('jogadores-timeB')];
    selects.forEach(select => {
        select.innerHTML = '';
        todosJogadores.forEach(jogador => {
            select.add(new Option(jogador.nome, jogador.id));
        });
    });
}

function renderStatsInputs(time, selectElement) {
    const statsArea = document.getElementById(`stats-time${time}`);
    statsArea.innerHTML = '';
    Array.from(selectElement.selectedOptions).forEach(option => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-stats-input';
        playerDiv.innerHTML = `
            <label>${option.text}</label>
            <input type="number" placeholder="G" min="0" value="0" data-id="${option.value}" data-stat="gols">
            <input type="number" placeholder="A" min="0" value="0" data-id="${option.value}" data-stat="assistencias">
            <input type="number" placeholder="Adv" min="0" value="0" data-id="${option.value}" data-stat="advertencias">
        `;
        statsArea.appendChild(playerDiv);
    });
}

async function handleAddPartida(e) {
    e.preventDefault();
    const data = document.getElementById('partida-data').value;
    const resultado = e.target.elements.resultado.value;
    const liga_id = document.getElementById('partida-liga').value;
    const timeA = getTeamData('A');
    const timeB = getTeamData('B');

    if (!data || !resultado || !liga_id || timeA.length === 0 || timeB.length === 0) {
        return showMessage('partida-message-area', 'Preencha todos os campos da partida!', 'error');
    }

    try {
        const response = await fetch('/api/partidas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ data, resultado, liga_id, timeA, timeB }),
        });
        const result = await response.json();
        showMessage('partida-message-area', result.message, response.ok ? 'success' : 'error');
        if (response.ok) {
            e.target.reset();
            document.getElementById('stats-timeA').innerHTML = '';
            document.getElementById('stats-timeB').innerHTML = '';
            loadAllStats();
        }
    } catch (error) {
        showMessage('partida-message-area', 'Erro de conexão.', 'error');
    }
}

function getTeamData(time) {
    const statsArea = document.getElementById(`stats-time${time}`);
    const jogadoresMap = new Map();
    Array.from(statsArea.querySelectorAll('.player-stats-input')).forEach(playerDiv => {
        const id = playerDiv.querySelector('input').dataset.id;
        jogadoresMap.set(id, { id, gols: 0, assistencias: 0, advertencias: 0 });
    });
    statsArea.querySelectorAll('input').forEach(input => {
        const { id, stat } = input.dataset;
        jogadoresMap.get(id)[stat] = parseInt(input.value) || 0;
    });
    return Array.from(jogadoresMap.values());
}

// ==================================================
// FUNÇÕES DE ESTATÍSTICAS
// ==================================================
function getApiUrl(base, liga_id) {
    return liga_id ? `${base}?liga_id=${liga_id}` : base;
}

async function fetchAndRenderStats(containerId, apiUrl, renderFn) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p>Carregando...</p>';
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.length === 0) {
            container.innerHTML = '<p>Nenhum dado para exibir.</p>';
        } else {
            container.innerHTML = '';
            container.appendChild(renderFn(data));
        }
    } catch (error) {
        container.innerHTML = '<p class="error">Erro ao carregar dados.</p>';
    }
}

function loadRanking() {
    const liga_id = document.getElementById('liga-filtro').value;
    fetchAndRenderStats('ranking-geral-container', getApiUrl('/api/partidas/ranking', liga_id), (data) => {
        const table = document.createElement('table');
        table.className = 'stats-table';
        table.innerHTML = `<thead><tr><th>Jogador</th><th>J</th><th>V</th><th>E</th><th>D</th><th>G</th><th>A</th></tr></thead>
            <tbody>${data.map(j => `<tr><td>${j.nome}</td><td>${j.jogos}</td><td>${j.vitorias}</td><td>${j.empates}</td><td>${j.derrotas}</td><td>${j.gols}</td><td>${j.assistencias}</td></tr>`).join('')}</tbody>`;
        return table;
    });
}

function loadRankingPorPontos() {
    const liga_id = document.getElementById('liga-filtro').value;
    fetchAndRenderStats('pontos-ranking-container', getApiUrl('/api/partidas/ranking-pontos', liga_id), (data) => {
        const table = document.createElement('table');
        table.className = 'stats-table';
        table.innerHTML = `<thead><tr><th>Jogador</th><th>Pontos</th><th>V</th><th>E</th><th>D</th><th>G</th><th>A</th><th>Adv</th></tr></thead>
            <tbody>${data.map(j => `<tr><td>${j.nome}</td><td><strong>${j.total_pontos}</strong></td><td>${j.vitorias}</td><td>${j.empates}</td><td>${j.derrotas}</td><td>${j.gols}</td><td>${j.assistencias}</td><td>${j.advertencias}</td></tr>`).join('')}</tbody>`;
        return table;
    });
}

function loadDuplasStats() {
    const liga_id = document.getElementById('liga-filtro').value;
    fetchAndRenderStats('duplas-stats-container', getApiUrl('/api/partidas/duplas', liga_id), (data) => {
        const table = document.createElement('table');
        table.className = 'stats-table';
        table.innerHTML = `<thead><tr><th>Dupla</th><th>Jogos</th><th>V</th><th>E</th><th>D</th></tr></thead>
            <tbody>${data.map(d => `<tr><td>${d.jogador1} & ${d.jogador2}</td><td>${d.jogos_juntos}</td><td>${d.vitorias_juntos}</td><td>${d.empates_juntos}</td><td>${d.derrotas_juntos}</td></tr>`).join('')}</tbody>`;
        return table;
    });
}

function loadConfrontosStats() {
    const liga_id = document.getElementById('liga-filtro').value;
    fetchAndRenderStats('confrontos-container', getApiUrl('/api/partidas/confrontos', liga_id), (data) => {
        const table = document.createElement('table');
        table.className = 'stats-table';
        table.innerHTML = `<thead><tr><th>Confronto</th><th>J1 Vit.</th><th>Empates</th><th>J2 Vit.</th><th>Total</th></tr></thead>
            <tbody>${data.map(c => `<tr><td>${c.jogador1} vs ${c.jogador2}</td><td>${c.vitorias_j1}</td><td>${c.empates}</td><td>${c.vitorias_j2}</td><td>${c.total_confrontos}</td></tr>`).join('')}</tbody>`;
        return table;
    });
}

// ==================================================
// FUNÇÃO UTILITÁRIA
// ==================================================
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message-area ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message-area';
    }, 4000);
}
