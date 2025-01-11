import { gameConfig, API_CONFIG} from './config/game-config.js';

export class GameTimer {
    constructor() {
        this.config = gameConfig; 
        this.playerColors = gameConfig.playerColors;
        this.statistics = {
            gameStartTime: null,
            totalTurns: 0,
            adventureCards: 0,
            startTime: null
        };

        // this.turnHistory = Array(this.config.playerCount).fill().map(() => []);
        this.availablePlayers = [];
        this.selectedPlayers = [];

        this.setupControls();
        this.loadPlayers();
        this.setupPlayerControls();
        // this.initGame();
        this.setupSettingsControls();
        this.gameId = null;


        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 's') {
                this.toggleTimer();
            } else if (event.key.toLowerCase() === 'n') {
                this.nextPlayer();
            }
        });
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

        // Setup event listeners
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

    setupPlayerManagement() {
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
            }
        };
    }

    renderPlayerAssignments() {
        const container = document.getElementById('playerAssignments');
        container.innerHTML = Array(this.config.playerCount).fill().map((_, i) => `
            <div>
                <label>Player ${i + 1}:</label>
                <select class="player-select" data-position="${i}">
                    <option value="">Select Player</option>
                    ${this.availablePlayers.map(p => 
                        `<option value="${p.id}">${p.username}</option>`
                    ).join('')}
                </select>
            </div>
        `).join('');

        container.querySelectorAll('.player-select').forEach(select => {
            select.onchange = (e) => {
                this.selectedPlayers[parseInt(e.target.dataset.position)] = 
                    this.availablePlayers.find(p => p.id === parseInt(e.target.value));
            };
        });
    }

    async startGame() {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GAME_START}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                playerCount: this.config.playerCount
            })
        });
        const data = await response.json();
        this.gameId = data.game_id;
    }

    async recordTurn(playerData) {
        await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TURN_RECORD}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                game_id: this.gameId,
                player_number: this.currentPlayer,
                turn_number: playerData.totalTurns,
                duration: playerData.totalTimeSpent - playerData.previousTimeSpent,
                bank_time_used: this.config.bankTime - playerData.bankTime,
                penalties: playerData.penalty,
                adventure_cards: playerData.adventureCards
            })
        });
    }
    
    playWarningBeep(type = 'warning') {
        const audioMap = {
            'warning': 'warningSound',
            'bankWarning': 'bankWarningSound',
            'penalty': 'penaltySound'
        };
        const audio = document.getElementById(audioMap[type]);
        audio.currentTime = 0;
        audio.play();
    }

    initGame() {
        this.config.playerCount = this.selectedPlayers.length;
        this.players = this.selectedPlayers.map(player => ({
            id: player.id,
            username: player.username,
            timeLeft: 0,
            bankTime: this.config.bankTime,
            penalty: 0,
            penaltyTimer: this.config.penaltyTime,
            totalTurns: 0,
            totalTimeSpent: 0,
            adventureCards: 0,
            previousTimeSpent: 0,
        }));
        this.players[0].timeLeft = this.config.turnTime;
        this.currentPlayer = 0;
        this.active = false;
        this.renderPlayers();
        this.updateDisplay();
    }

    setupSettingsControls() {
        document.getElementById('applySettings').onclick = () => {
            console.log('Applying settings with players:', this.selectedPlayers)
            this.config.turnTime = parseInt(document.getElementById('turnTime').value);
            this.config.bankTime = parseInt(document.getElementById('bankTime').value);
            this.config.adventureTime = parseInt(document.getElementById('adventureTime').value);
            this.config.penaltyTime = parseInt(document.getElementById('penaltyTime').value);
            this.config.carryOverTime = document.getElementById('carryOverTime').checked;
            
            this.turnHistory = Array(this.selectedPlayers.length).fill().map(() => []);
            this.active = false;
            this.initGame();
        };
    }

    setupControls() {
        document.getElementById('startStop').onclick = () => this.toggleTimer();
        document.getElementById('nextPlayer').onclick = () => this.nextPlayer();
        document.getElementById('adventure').onclick = () => this.addAdventureTime();
    }

    renderPlayers() {
        const container = document.getElementById('players');
        container.innerHTML = this.players.map((player, index) => `
            <div class="player-card ${index === this.currentPlayer ? 'active-player' : ''}" id="player${index}">
                <h2>${player.username}</h2>
                <div class="time-display">Time: ${player.timeLeft}s</div>
                <div class="bank-time">Bank: ${player.bankTime}s</div>
                <div class="penalty">Penalties: ${player.penalty}</div>
                ${player.bankTime === 0 && player.timeLeft === 0 ? 
                    `<div class="penalty-timer">Next Penalty in: ${player.penaltyTimer}s</div>` : ''}
            </div>
        `).join('');
    }

    async nextPlayer() {
        if (this.active) {
            const currentPlayer = this.players[this.currentPlayer];
            await this.recordTurn(currentPlayer);
            
            currentPlayer.totalTurns++;

            // const newTotalTime = (currentPlayer.totalTurns * this.config.turnTime - currentPlayer.timeLeft) + (this.config.bankTime - currentPlayer.bankTime) + (currentPlayer.penalty * this.config.penaltyTime - (this.config.penaltyTime - currentPlayer.penaltyTimer));
    
            const turnTime = currentPlayer.totalTimeSpent - currentPlayer.previousTimeSpent;
            currentPlayer.previousTimeSpent = currentPlayer.totalTimeSpent;
            
            this.turnHistory[this.currentPlayer].push(turnTime);
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            if (!this.config.carryOverTime) {
                this.players[this.currentPlayer].timeLeft = this.config.turnTime;
            }
            else {
                this.players[this.currentPlayer].timeLeft += this.config.turnTime;
            }

            this.updateDisplay();
            this.updatePlayerStatistics();
            this.updateGlobalStats();
            this.sendTurnHistoryUpdate();
        }
    }

    addAdventureTime() {
        if (this.active) {
            const player = this.players[this.currentPlayer];
            player.timeLeft += this.config.adventureTime;
            player.adventureCards++;
            this.updateDisplay();
            this.updatePlayerStatistics();
            this.updateGlobalStats();
        }
    }

    updateTimer() {
        if (this.active) {
            this.updateStatistics();
            
            const player = this.players[this.currentPlayer];
            
            // Warning checks
            if (player.timeLeft === this.config.WARNING_THRESHOLD) {
                this.playWarningBeep('warning');
            } else if (player.timeLeft === 0 && player.bankTime === this.config.BANK_WARNING_THRESHOLD) {
                this.playWarningBeep('bankWarning');
            } else if (player.timeLeft === 0 && player.bankTime === 0 && player.penaltyTimer === 5) {
                this.playWarningBeep('penalty');
            }

            // Visual warnings
            const playerCard = document.querySelector(`#player${this.currentPlayer}`);
            if (player.timeLeft <= this.WARNING_THRESHOLD && player.timeLeft > 0) {
                playerCard.classList.add('warning');
            } else if (player.timeLeft === 0 && player.bankTime <= this.BANK_WARNING_THRESHOLD) {
                playerCard.classList.add('critical');
            } else {
                playerCard.classList.remove('warning', 'critical');
            }

            // Regular timer logic
            if (player.timeLeft > 0) {
                player.timeLeft--;
                player.totalTimeSpent++;
            } else if (player.bankTime > 0) {
                player.bankTime--;
                player.totalTimeSpent++;
            } else {
                player.penaltyTimer--;
                player.totalTimeSpent++;
                if (player.penaltyTimer <= 0) {
                    player.penalty++;
                    player.penaltyTimer = this.config.penaltyTime;
                }
            }
            this.updateDisplay();
        }
        if (this.active) {
            setTimeout(() => this.updateTimer(), 1000);
        }
    }

    updateDisplay() {
        this.renderPlayers();
    }    

    async toggleTimer() {
        this.active = !this.active;
        if (this.active && !this.statistics.startTime) {
            this.statistics.startTime = new Date();
            await this.startGame();
        }
        document.getElementById('startStop').textContent = this.active ? 'Stop' : 'Start';
        if (this.active) this.updateTimer();
        this.updateStatistics();
    }

    updateStatistics() {
        if (this.active) {
            const now = new Date();
            const duration = Math.floor((now - this.statistics.startTime) / 1000);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            
            document.getElementById('gameDuration').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    updatePlayerStatistics() {
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
                    <span>${this.config.bankTime - player.bankTime}s</span>
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
        // this.drawTurnTimeGraph();
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

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 's') {
                this.toggleTimer();
            } else if (event.key.toLowerCase() === 'n') {
                this.nextPlayer();
            }
        });
    }    

    updateGlobalStats() {
        const totalTurns = this.players.reduce((sum, player) => sum + player.totalTurns, 0);
        const totalAdventures = this.players.reduce((sum, player) => sum + player.adventureCards, 0);
        
        document.getElementById('totalTurns').textContent = Math.floor(totalTurns / this.players.length);
        document.getElementById('totalAdventures').textContent = totalAdventures;
    }    

    sendTurnHistoryUpdate() {
        fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_GRAPH}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                turnHistory: this.turnHistory,
                playerColors: this.playerColors,
                playerNames: this.players.map(p => p.username),
            })
        })
        .then(response => response.json())
        .then(figData => {
            Plotly.newPlot('visualization-container', figData.data, figData.layout);
        });
    }
   
}