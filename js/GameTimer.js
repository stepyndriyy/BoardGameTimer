import { gameConfig } from './config/game-config.js';
import { PlayerManager } from './managers/PlayerManager.js';
import { TimerController } from './controllers/TimerController.js';
import { GameStateManager } from './managers/GameStateManager.js';
import { APIService } from './services/APIService.js';
import { UIController } from './controllers/UIController.js';

export class GameTimer {
    constructor() {
        this.playerManager = new PlayerManager();
        this.timerController = new TimerController(gameConfig);
        this.gameStateManager = new GameStateManager(gameConfig);
        this.apiService = new APIService();
        this.uiController = new UIController();

        this.initializeControllers();
        this.setupEventHandlers();
    }

    initGame() {
        this.gameStateManager.getConfig().playerCount = this.playerManager.selectedPlayers.length;
        
        this.playerManager.initializePlayers(this.gameStateManager.getConfig());
        
        this.timerController.stopTimer();
        this.timerController.currentPlayer = 0;
        
        this.playerManager.renderPlayers(this.timerController.getCurrentPlayer());
        this.uiController.updateStartStopButton(false);
        
        this.gameStateManager.initializeGame(this.playerManager.getPlayerCount());
    }    

    initializeControllers() {
        this.playerManager.setupAddNewPlayer();
        this.playerManager.loadPlayers();
        this.playerManager.setupPlayerControls();
        
        this.uiController.setControlHandlers({
            onToggleTimer: () => this.toggleTimer(),
            onNextPlayer: () => this.nextPlayer(),
            onAddAdventure: () => this.addAdventureTime(),
            onStartGame: () => this.initGame(),
        });
    }

    setupEventHandlers() {
        setInterval(() => {
            if (this.timerController.isActive()) {
                const currentPlayer = this.playerManager.players[this.timerController.getCurrentPlayer()];
                if (this.timerController.updateTimer(currentPlayer)) {
                    this.playerManager.renderPlayers(this.timerController.getCurrentPlayer());
                    this.gameStateManager.updateStatistics();
                }
            }
        }, 1000);
    }

    async toggleTimer() {
        if (!this.gameStateManager.getGameId()) return;
        
        const currentPlayerData = this.playerManager.players[this.timerController.getCurrentPlayer()];
        this.timerController.isActive() ? 
            this.timerController.stopTimer() : 
            this.timerController.startTimer(currentPlayerData);
            
        this.uiController.updateStartStopButton(this.timerController.isActive());
    }

    async nextPlayer() {
        if (!this.timerController.isActive()) return;

        const currentPlayerData = this.playerManager.players[this.timerController.getCurrentPlayer()];
        await this.gameStateManager.recordTurn(currentPlayerData, this.timerController.getCurrentPlayer());

        const { turnTime, newCurrentPlayerIndex } = this.timerController.nextPlayer(this.playerManager.players);
        
        this.gameStateManager.recordTurnHistory(this.timerController.getCurrentPlayer(), turnTime);
        this.playerManager.renderPlayers(newCurrentPlayerIndex);
        this.playerManager.updatePlayerStatistics(this.gameStateManager.getConfig());
        this.gameStateManager.updateGlobalStats(this.playerManager.players);

        await this.apiService.sendTurnHistoryUpdate(
            this.gameStateManager.getTurnHistory(),
            gameConfig.playerColors,
            this.playerManager.getPlayerNames()
        );
    }

    addAdventureTime() {
        const currentPlayer = this.playerManager.players[this.timerController.getCurrentPlayer()];
        if (this.timerController.addAdventureTime(currentPlayer)) {
            this.playerManager.renderPlayers(this.timerController.getCurrentPlayer());
            this.playerManager.updatePlayerStatistics(this.gameStateManager.getConfig());
            this.gameStateManager.updateGlobalStats(this.playerManager.players);
        }
    }

    getGameState() {
        return {
            isActive: this.timerController.isActive(),
            currentPlayer: this.timerController.getCurrentPlayer(),
            gameId: this.gameStateManager.getGameId(),
            config: this.gameStateManager.getConfig()
        };
    }
}
