import { API_CONFIG } from '../config/api-config.js';

export class GameStateManager {
    constructor(config) {
        this.config = config;
        this.statistics = {
            gameStartTime: null,
            totalTurns: 0,
            adventureCards: 0,
            startTime: null
        };
        this.gameId = null;
        this.turnHistory = [];
        this.setupSettingsControls();
    }

    setupSettingsControls() {
        document.getElementById('applySettings').onclick = () => {
            this.updateGameSettings();
        };
    }

    updateGameSettings() {
        this.config.turnTime = parseInt(document.getElementById('turnTime').value);
        this.config.bankTime = parseInt(document.getElementById('bankTime').value);
        this.config.adventureTime = parseInt(document.getElementById('adventureTime').value);
        this.config.penaltyTime = parseInt(document.getElementById('penaltyTime').value);
        this.config.carryOverTime = document.getElementById('carryOverTime').checked;
        
        return this.config;
    }

    async initializeGame(playerCount) {
        console.log("Initializing game with player count:", playerCount);
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GAME_START}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playerCount: playerCount })
        });
        const data = await response.json();
        this.gameId = data.game_id;
        this.statistics.startTime = new Date();
        
        this.turnHistory = Array(playerCount).fill().map(() => []);
    }

    updateStatistics() {
        if (this.statistics.startTime) {
            const now = new Date();
            const duration = Math.floor((now - this.statistics.startTime) / 1000);
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            
            document.getElementById('gameDuration').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    updateGlobalStats(players) {
        const totalTurns = players.reduce((sum, player) => sum + player.totalTurns, 0);
        const totalAdventures = players.reduce((sum, player) => sum + player.adventureCards, 0);
        
        document.getElementById('totalTurns').textContent = Math.floor(totalTurns / players.length);
        document.getElementById('totalAdventures').textContent = totalAdventures;
    }

    recordTurnHistory(playerIndex, turnTime) {
        this.turnHistory[playerIndex].push(turnTime);
    }

    async recordTurn(playerData, currentPlayer) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TURN_RECORD}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    game_id: this.gameId,
                    username: playerData.username,
                    player_number: currentPlayer,
                    turn_number: playerData.totalTurns,
                    duration: playerData.totalTimeSpent - playerData.previousTimeSpent,
                    bank_time_used: playerData.bankTime ? (this.config.bankTime - playerData.bankTime) : 0,
                    penalties: playerData.penalty || 0,
                    adventure_cards: playerData.adventureCards || 0
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }
            return data;
        } catch (error) {
            console.error('Failed to record turn:', error);
            throw error;
        }
    }

    getTurnHistory() {
        return this.turnHistory;
    }

    getGameId() {
        return this.gameId;
    }

    getConfig() {
        return this.config;
    }
}
