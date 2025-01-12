export class TimerController {
    constructor(config) {
        this.config = config;
        this.active = false;
        this.currentPlayer = 0;
        this.setupAudioMap();
    }

    setupAudioMap() {
        this.audioMap = {
            'warning': 'warningSound',
            'bankWarning': 'bankWarningSound',
            'penalty': 'penaltySound'
        };
    }

    startTimer(player) {
        this.active = true;
        this.updateTimer(player);
    }

    stopTimer() {
        this.active = false;
    }

    updateTimer(player) {
        if (this.active) {
            this.checkWarnings(player);
            this.updatePlayerTime(player);
            return true;
        }
        return false;
    }

    checkWarnings(player) {
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
        if (player.timeLeft <= this.config.WARNING_THRESHOLD && player.timeLeft > 0) {
            playerCard.classList.add('warning');
        } else if (player.timeLeft === 0 && player.bankTime <= this.config.BANK_WARNING_THRESHOLD) {
            playerCard.classList.add('critical');
        } else {
            playerCard.classList.remove('warning', 'critical');
        }
    }

    updatePlayerTime(player) {
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
    }

    playWarningBeep(type = 'warning') {
        const audio = document.getElementById(this.audioMap[type]);
        audio.currentTime = 0;
        audio.play();
    }

    nextPlayer(players) {
        const currentPlayer = players[this.currentPlayer];
        const turnTime = currentPlayer.totalTimeSpent - currentPlayer.previousTimeSpent;
        currentPlayer.previousTimeSpent = currentPlayer.totalTimeSpent;
        
        this.currentPlayer = (this.currentPlayer + 1) % players.length;
        
        if (!this.config.carryOverTime) {
            players[this.currentPlayer].timeLeft = this.config.turnTime;
        } else {
            players[this.currentPlayer].timeLeft += this.config.turnTime;
        }

        return {
            turnTime,
            currentPlayer,
            newCurrentPlayerIndex: this.currentPlayer
        };
    }

    addAdventureTime(player) {
        if (this.active) {
            player.timeLeft += this.config.adventureTime;
            player.adventureCards++;
            return true;
        }
        return false;
    }

    isActive() {
        return this.active;
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }
}
