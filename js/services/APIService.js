import { API_CONFIG } from '../config/api-config.js';

export class APIService {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.endpoints = API_CONFIG.ENDPOINTS;
    }

    async fetchPlayers() {
        const response = await fetch(`${this.baseUrl}${this.endpoints.PLAYERS}`);
        return await response.json();
    }

    async createPlayer(username) {
        const response = await fetch(`${this.baseUrl}${this.endpoints.PLAYERS}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        return response.ok;
    }

    async startGame(playerCount) {
        const response = await fetch(`${this.baseUrl}${this.endpoints.GAME_START}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerCount })
        });
        return await response.json();
    }

    async recordTurn(turnData) {
        return await fetch(`${this.baseUrl}${this.endpoints.TURN_RECORD}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(turnData)
        });
    }

    async updateGraph(graphData) {
        const response = await fetch(`${this.baseUrl}${this.endpoints.UPDATE_GRAPH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(graphData)
        });
        return await response.json();
    }

    async sendTurnHistoryUpdate(turnHistory, playerColors, playerNames) {
        const graphData = {
            turnHistory,
            playerColors,
            playerNames
        };
        const figData = await this.updateGraph(graphData);
        Plotly.newPlot('visualization-container', figData.data, figData.layout);
    }
}
