const cells = document.querySelectorAll('[data-cell]');
const board = document.getElementById('game-board');
const gameOverMessage = document.getElementById('game-over-message');
const restartButton = document.getElementById('restart-button');
const playerScoreDisplay = document.getElementById('player-score');
const computerScoreDisplay = document.getElementById('computer-score');

const HUMAN_PLAYER = 'x';
const COMPUTER_PLAYER = 'o';
let currentPlayer;
let gameActive = true;
let boardState = ['', '', '', '', '', '', '', '', ''];
let playerScore = 0;
let computerScore = 0;
let playerStarts = true;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Add a click listener to resume audio context
document.body.addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
});

// Create longer, more arcade-style sound effects
const playSound = (type) => {
    if (!audioContext || audioContext.state === 'suspended') return;

    const now = audioContext.currentTime;
    const duration = type === 'win' ? 1.2 : type === 'lose' ? 1.0 : type === 'draw' ? 0.8 : 0.3;

    switch (type) {
        case 'move':
            // Bouncy arcade beep for moves
            const osc1 = audioContext.createOscillator();
            const gain1 = audioContext.createGain();
            osc1.type = 'square';
            osc1.frequency.setValueAtTime(400, now);
            osc1.frequency.exponentialRampToValueAtTime(600, now + 0.15);
            osc1.frequency.exponentialRampToValueAtTime(300, now + 0.3);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);
            osc1.connect(gain1);
            gain1.connect(audioContext.destination);
            osc1.start(now);
            osc1.stop(now + duration);
            break;

        case 'win':
            // Victory fanfare - ascending chord sequence
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0, now + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.4, now + i * 0.15 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + duration - i * 0.1);
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start(now + i * 0.15);
                osc.stop(now + duration);
            });
            break;

        case 'lose':
            // Defeat sound - descending notes
            const loseNotes = [523.25, 440, 349.23, 261.63]; // C5, A4, F4, C4
            loseNotes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0, now + i * 0.2);
                gain.gain.linearRampToValueAtTime(0.35, now + i * 0.2 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.25);
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start(now + i * 0.2);
                osc.stop(now + i * 0.2 + 0.3);
            });
            break;

        case 'draw':
            // Neutral draw sound - two tones
            [440, 523.25].forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.2);
                gain.gain.setValueAtTime(0, now + i * 0.2);
                gain.gain.linearRampToValueAtTime(0.3, now + i * 0.2 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.35);
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start(now + i * 0.2);
                osc.stop(now + i * 0.2 + 0.4);
            });
            break;

        case 'restart':
            // Quick restart beep
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(600, now);
            osc2.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gain2.gain.setValueAtTime(0.25, now);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.start(now);
            osc2.stop(now + 0.25);
            break;
    }
};

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const startGame = (isRestart = false) => {
    if (isRestart) {
        playSound('restart');
    }
    gameActive = true;
    boardState = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = playerStarts ? HUMAN_PLAYER : COMPUTER_PLAYER;
    gameOverMessage.innerText = '';
    cells.forEach(cell => {
        cell.classList.remove(HUMAN_PLAYER);
        cell.classList.remove(COMPUTER_PLAYER);
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick, { once: true });
    });

    if (!playerStarts) {
        setTimeout(computerMove, 500);
    }
};

const handleCellClick = (e) => {
    const cell = e.target;
    const index = Array.from(cells).indexOf(cell);

    if (boardState[index] !== '' || !gameActive || currentPlayer === COMPUTER_PLAYER) {
        return;
    }

    playSound('move');
    placeMark(index, HUMAN_PLAYER);
    if (checkWin(HUMAN_PLAYER)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setTimeout(computerMove, 500);
    }
};

const placeMark = (index, player) => {
    boardState[index] = player;
    cells[index].classList.add(player);
    playSound('move');
};

const swapTurns = () => {
    currentPlayer = currentPlayer === HUMAN_PLAYER ? COMPUTER_PLAYER : HUMAN_PLAYER;
};

const checkWin = (player) => {
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return boardState[index] === player;
        });
    });
};

const isDraw = () => {
    return boardState.every(cell => {
        return cell !== '';
    });
};

const endGame = (draw) => {
    if (draw) {
        gameOverMessage.innerText = "It's a Draw!";
        playSound('draw');
    } else {
        if (currentPlayer === HUMAN_PLAYER) {
            gameOverMessage.innerText = "You Win!";
            playerScore++;
            playerScoreDisplay.innerText = `Player: ${playerScore}`;
            playSound('win');
        } else {
            gameOverMessage.innerText = "Computer Wins!";
            computerScore++;
            computerScoreDisplay.innerText = `Computer: ${computerScore}`;
            playSound('lose');
        }
    }
    gameActive = false;
};

const computerMove = () => {
    if (!gameActive) return;

    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === '') {
            boardState[i] = COMPUTER_PLAYER;
            let score = minimax(boardState, 0, false);
            boardState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }

    placeMark(move, COMPUTER_PLAYER);

    if (checkWin(COMPUTER_PLAYER)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
    }
};

const scores = {
    [COMPUTER_PLAYER]: 1,
    [HUMAN_PLAYER]: -1,
    'tie': 0
};

const minimax = (board, depth, isMaximizing) => {
    let result = checkWinner();
    if (result !== null) {
        return scores[result];
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = COMPUTER_PLAYER;
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = HUMAN_PLAYER;
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
};


const checkWinner = () => {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            return boardState[a];
        }
    }

    if (isDraw()) {
        return 'tie';
    }

    return null;
}


restartButton.addEventListener('click', () => {
    playerStarts = !playerStarts;
    startGame(true);
});

startGame();
