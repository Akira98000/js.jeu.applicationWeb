class GameTimer {
    constructor(duration, onTick, onComplete) {
        this.duration = duration;
        this.remaining = duration;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.remaining--;
            this.onTick(this.formatTime(this.remaining));
            
            if (this.remaining <= 0) {
                this.stop();
                this.onComplete();
            }
        }, 1000);
    }

    stop() {
        this.isRunning = false;
        clearInterval(this.interval);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}