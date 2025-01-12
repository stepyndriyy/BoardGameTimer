import { API_CONFIG } from '../config/api-config.js';

export class PlayerManager {
    constructor() {
        this.availablePlayers = [];
        this.selectedPlayers = [];
        this.players = [];
    }

    async loadPlayers() {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLAYERS}`);
        this.availablePlayers = await response.json();
        this.renderPlayerSelection();
    }

    setupPlayerControls() {
        document.getElementById('addPlayerToGame').onclick = () => {
            const availablePlayers = this.availablePlayers.filter(p => 
                !this.selectedPlayers.find(sp => sp.id === p.id)
            );
            if (availablePlayers.length > 0) {
                this.selectedPlayers.push(availablePlayers[0]);
                this.renderPlayerSelection();
            }
        };
    }

    renderPlayerSelection() {
        const container = document.getElementById('selectedPlayers');
        container.innerHTML = this.selectedPlayers.map((player, index) => `
            <div class="selected-player">
                <select data-index="${index}">
                    ${this.availablePlayers.map(p => `
                        <option value="${p.id}" ${p.id === player.id ? 'selected' : ''}>
                            ${p.username}
                        </option>
                    `).join('')}
                </select>
                <span class="remove-player" data-index="${index}">✖</span>
            </div>
        `).join('');

        this.setupPlayerSelectionListeners(container);
    }

    setupPlayerSelectionListeners(container) {
        container.querySelectorAll('select').forEach(select => {
            select.onchange = (e) => {
                const index = parseInt(e.target.dataset.index);
                const playerId = parseInt(e.target.value);
                this.selectedPlayers[index] = this.availablePlayers.find(p => p.id === playerId);
            };
        });

        container.querySelectorAll('.remove-player').forEach(btn => {
            btn.onclick = (e) => {
                const index = parseInt(e.target.dataset.index);
                this.selectedPlayers.splice(index, 1);
                this.renderPlayerSelection();
            };
        });
    }

    async setupAddNewPlayer() {
        document.getElementById('addPlayer').onclick = async () => {
            const username = document.getElementById('newPlayerUsername').value;
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLAYERS}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            if (response.ok) {
                await this.loadPlayers();
                document.getElementById('newPlayerUsername').value = '';
            } else {
                console.error('Failed to add player:', response.statusText);
            }
        };
    }

    initializePlayers(config) {
        this.players = this.selectedPlayers.map(player => ({
            id: player.id,
            username: player.username,
            timeLeft: 0,
            bankTime: config.bankTime,
            penalty: 0,
            penaltyTimer: config.penaltyTime,
            totalTurns: 0,
            totalTimeSpent: 0,
            adventureCards: 0,
            previousTimeSpent: 0,
        }));
        this.players[0].timeLeft = config.turnTime;
        return this.players;
    }

    renderPlayers(currentPlayer) {
        const container = document.getElementById('players');
        container.innerHTML = this.players.map((player, index) => `
            <div class="player-card ${index === currentPlayer ? 'active-player' : ''}" id="player${index}">
                <h2>${player.username}</h2>
                <div class="time-display">Time: ${player.timeLeft}s</div>
                <div class="bank-time">Bank: ${player.bankTime}s</div>
                <div class="penalty">Penalties: ${player.penalty}</div>
                ${player.bankTime === 0 && player.timeLeft === 0 ? 
                    `<div class="penalty-timer">Next Penalty in: ${player.penaltyTimer}s</div>` : ''}
            </div>
        `).join('');
    }

    updatePlayerStatistics(config) {
        const statsContainer = document.getElementById('playerStats');
        statsContainer.innerHTML = this.players.map((player, index) => `
            <div class="player-stat-box">
                <h5>Player ${index + 1}</h5>
                <div class="stat-row">
                    <span>Total Turns:</span>
                    <span>${player.totalTurns || 0}</span>
                </div>
                <div class="stat-row">
                    <span>Total Time:</span>
                    <span>${player.totalTimeSpent}s</span>
                </div>
                <div class="stat-row">
                    <span>Average Turn Time:</span>
                    <span>${this.calculateAverageTurnTime(player)}s</span>
                </div>
                <div class="stat-row">
                    <span>Bank Time Used:</span>
                    <span>${config.bankTime - player.bankTime}s</span>
                </div>
                <div class="stat-row">
                    <span>Penalties:</span>
                    <span>${player.penalty}</span>
                </div>
                <div class="stat-row">
                    <span>Adventure Cards:</span>
                    <span>${player.adventureCards || 0}</span>
                </div>
            </div>
        `).join('');
    }

    calculateAverageTurnTime(player) {
        if (player.cachedAverage && player.lastTotalTurns === player.totalTurns) {
            return player.cachedAverage;
        }
        const average = Math.round(player.totalTimeSpent / player.totalTurns);
        player.cachedAverage = average;
        player.lastTotalTurns = player.totalTurns;
        return average;
    }

    getPlayerCount() {
        return this.selectedPlayers.length;
    }

    getPlayerNames() {
        return this.players.map(p => p.username);
    }
}
