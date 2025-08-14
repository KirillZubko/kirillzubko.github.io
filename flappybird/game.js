class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;

        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.bestScore = localStorage.getItem('flappyBirdBest') || 0;

        // Bird properties
        this.bird = {
            x: 80,
            y: 250,
            width: 30,
            height: 25,
            velocity: 0,
            gravity: 0.2,
            jumpPower: -5,
            rotation: 0
        };

        // Pipes array
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.basePipeSpeed = 1.2;
        this.pipeSpeed = this.basePipeSpeed;

        // Ground
        this.groundY = this.canvas.height - 50;
        this.groundX = 0;

        // Clouds for background
        this.clouds = [];
        this.initClouds();

        // UI elements
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.gameUI = document.getElementById('gameUI');
        this.scoreElement = document.getElementById('score');
        this.finalScoreElement = document.getElementById('finalScore');
        this.bestScoreElement = document.getElementById('bestScore');

        this.setupEventListeners();
        this.showStartScreen();
        this.gameLoop();
    }

    initClouds() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 200 + 50,
                width: Math.random() * 60 + 40,
                height: Math.random() * 30 + 20,
                speed: Math.random() * 0.3 + 0.1
            });
        }
    }

    showStartScreen() {
        this.gameState = 'start';
        this.startScreen.classList.remove('hidden');
        this.gameUI.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.jump();
                } else if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameOver') {
                    this.restartGame();
                }
            }
        });

        // Mouse/touch controls
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.jump();
            }
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.startScreen.classList.add('hidden');
        this.gameUI.classList.remove('hidden');
        this.resetGame();
    }

    restartGame() {
        this.gameState = 'playing';
        this.gameOverScreen.classList.add('hidden');
        this.gameUI.classList.remove('hidden');
        this.resetGame();
    }

    resetGame() {
        this.bird.y = 250;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.groundX = 0;
        this.pipeSpeed = this.basePipeSpeed;
    }

    updateGameSpeed() {
        // Увеличиваем скорость каждые 5 очков
        const speedMultiplier = 1 + Math.floor(this.score / 5) * 0.1;
        this.pipeSpeed = this.basePipeSpeed * speedMultiplier;
    }

    jump() {
        this.bird.velocity = this.bird.jumpPower;
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 2, -20), 60);

        // Update ground
        this.groundX -= this.pipeSpeed;
        if (this.groundX <= -50) this.groundX = 0;

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
                cloud.y = Math.random() * 200 + 50;
            }
        });

        // Generate pipes
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 200) {
            this.generatePipe();
        }

        // Update pipes
        this.pipes.forEach((pipe, index) => {
            pipe.x -= this.pipeSpeed;

            // Remove off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(index, 1);
            }

            // Score when bird passes pipe
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.scoreElement.textContent = this.score;
                this.updateGameSpeed();
            }
        });

        // Check collisions
        this.checkCollisions();
    }

    generatePipe() {
        const minHeight = 50;
        const maxHeight = this.groundY - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }

    checkCollisions() {
        // Ground collision
        if (this.bird.y + this.bird.height >= this.groundY) {
            this.gameOver();
            return;
        }

        // Ceiling collision
        if (this.bird.y <= 0) {
            this.gameOver();
            return;
        }

        // Pipe collision
        this.pipes.forEach(pipe => {
            if (this.bird.x < pipe.x + this.pipeWidth &&
                this.bird.x + this.bird.width > pipe.x) {
                
                if (this.bird.y < pipe.topHeight ||
                    this.bird.y + this.bird.height > pipe.bottomY) {
                    this.gameOver();
                    return;
                }
            }
        });
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.gameUI.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        this.finalScoreElement.textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBirdBest', this.bestScore);
        }
        
        this.bestScoreElement.textContent = this.bestScore;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        this.drawClouds();

        // Draw pipes
        this.drawPipes();

        // Draw ground
        this.drawGround();

        // Draw bird
        this.drawBird();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.width / 4, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width / 3, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 2/3, cloud.y, cloud.width / 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawPipes() {
        this.ctx.fillStyle = '#228B22';
        this.ctx.strokeStyle = '#006400';
        this.ctx.lineWidth = 2;

        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);

            // Top pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
            this.ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);

            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.groundY - pipe.bottomY);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, this.groundY - pipe.bottomY);

            // Bottom pipe cap
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
            this.ctx.strokeRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
        });
    }

    drawGround() {
        // Ground
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        // Ground pattern
        this.ctx.fillStyle = '#CD853F';
        for (let x = this.groundX; x < this.canvas.width + 50; x += 50) {
            this.ctx.fillRect(x, this.groundY, 25, this.canvas.height - this.groundY);
        }
    }

    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);

        // Bird body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(-this.bird.width / 2, -this.bird.height / 2, this.bird.width, this.bird.height);

        // Bird wing
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillRect(-this.bird.width / 4, -this.bird.height / 4, this.bird.width / 2, this.bird.height / 2);

        // Bird eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.width / 4, -this.bird.height / 4, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.width / 4 + 1, -this.bird.height / 4, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Bird beak
        this.ctx.fillStyle = '#FF4500';
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.width / 2, 0);
        this.ctx.lineTo(this.bird.width / 2 + 8, -2);
        this.ctx.lineTo(this.bird.width / 2 + 8, 2);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new FlappyBirdGame();
});
