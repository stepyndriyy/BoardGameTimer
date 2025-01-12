export class UIController {
    constructor() {
        this.setupKeyboardControls();
        this.setupBasicControls();
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            const keyHandlers = {
                's': () => this.onToggleTimer?.(),
                'n': () => this.onNextPlayer?.(),
                'g': () => this.onStartGame?.(),
            };
            
            const handler = keyHandlers[event.key.toLowerCase()];
            if (handler) handler();
        });
    }

    setupBasicControls() {
        document.getElementById('startStop').onclick = () => this.onToggleTimer?.();
        document.getElementById('nextPlayer').onclick = () => this.onNextPlayer?.();
        document.getElementById('adventure').onclick = () => this.onAddAdventure?.();
        document.getElementById('startGame').onclick = () => this.onStartGame?.();
    }

    setControlHandlers(handlers) {
        const {
            onToggleTimer,
            onNextPlayer,
            onAddAdventure,
            onStartGame,
        } = handlers;

        this.onToggleTimer = onToggleTimer;
        this.onNextPlayer = onNextPlayer;
        this.onAddAdventure = onAddAdventure;
        this.onStartGame = onStartGame;
    }

    updateStartStopButton(isActive) {
        document.getElementById('startStop').textContent = isActive ? 'Stop' : 'Start';
    }

    updatePlayerCard(player, index, isCurrentPlayer) {
        const playerCard = document.getElementById(`player${index}`);
        if (!playerCard) return;

        playerCard.className = `player-card ${isCurrentPlayer ? 'active-player' : ''}`;
        
        if (player.timeLeft <= this.WARNING_THRESHOLD && player.timeLeft > 0) {
            playerCard.classList.add('warning');
        } else if (player.timeLeft === 0 && player.bankTime <= this.BANK_WARNING_THRESHOLD) {
            playerCard.classList.add('critical');
        }
    }

    updateGameDuration(duration) {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        document.getElementById('gameDuration').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateGlobalStats(totalTurns, totalAdventures) {
        document.getElementById('totalTurns').textContent = totalTurns;
        document.getElementById('totalAdventures').textContent = totalAdventures;
    }

    getSettingsValues() {
        return {
            turnTime: parseInt(document.getElementById('turnTime').value),
            bankTime: parseInt(document.getElementById('bankTime').value),
            adventureTime: parseInt(document.getElementById('adventureTime').value),
            penaltyTime: parseInt(document.getElementById('penaltyTime').value),
            carryOverTime: document.getElementById('carryOverTime').checked
        };
    }

    showError(message) {
        // Implement error display logic
        console.error(message);
    }

    showSuccess(message) {
        // Implement success message display logic
        console.log(message);
    }

    updateVisualization(figData) {
        Plotly.newPlot('visualization-container', figData.data, figData.layout);
    }
}
