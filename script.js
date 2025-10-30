const cells = document.querySelectorAll('[data-cell]');
const board = document.getElementById('game-board');
const gameOverMessage = document.getElementById('game-over-message');
const restartButton = document.getElementById('restart-button');
const undoButton = document.getElementById('undo-button');
const playerScoreDisplay = document.getElementById('player-score');
const computerScoreDisplay = document.getElementById('computer-score');
const swipeHint = document.getElementById('swipe-hint');

const HUMAN_PLAYER = 'x';
const COMPUTER_PLAYER = 'o';
let currentPlayer;
let gameActive = true;
let boardState = ['', '', '', '', '', '', '', '', ''];
let playerScore = 0;
let computerScore = 0;
let playerStarts = true;
let moveHistory = []; // For undo functionality
let touchStartX = 0;
let touchStartY = 0;
let minSwipeDistance = 50; // Minimum distance for swipe gesture

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Add a click listener to resume audio context
document.body.addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
});

// Haptic feedback function
const hapticFeedback = (type = 'light') => {
    if ('vibrate' in navigator) {
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 30,
            double: [10, 50, 10],
            success: [10, 50, 10, 50, 20],
            error: [20, 50, 20]
        };
        navigator.vibrate(patterns[type] || patterns.light);
    }
};

// Touch gesture handlers for swipe to undo
let isSwipeGesture = false;

const handleTouchStart = (e) => {
    // Track touch start for swipe detection
    if (gameActive && currentPlayer === HUMAN_PLAYER && moveHistory.length > 0) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isSwipeGesture = false;
    }
};

const handleTouchMove = (e) => {
    // Detect if user is swiping (moving finger)
    if (touchStartX !== 0 && touchStartY !== 0) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        
        // If moved significantly, it's a swipe gesture
        if (deltaX > 10 || deltaY > 10) {
            isSwipeGesture = true;
        }
    }
};

const handleTouchEnd = (e) => {
    if (gameActive && currentPlayer === HUMAN_PLAYER && moveHistory.length > 0 && isSwipeGesture) {
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Check for horizontal swipe (left or right)
        if (absDeltaX > minSwipeDistance && absDeltaX > absDeltaY) {
            // Swipe left or right to undo
            e.preventDefault();
            hapticFeedback('medium');
            undoLastMove();
        }
    }
    
    // Reset touch tracking
    touchStartX = 0;
    touchStartY = 0;
    isSwipeGesture = false;
};

// Undo last move function
const undoLastMove = () => {
    if (moveHistory.length === 0 || !gameActive || currentPlayer === COMPUTER_PLAYER) {
        return;
    }
    
    // Only allow undo for player's last move if it's their turn
    const lastMove = moveHistory[moveHistory.length - 1];
    if (lastMove.player === HUMAN_PLAYER && currentPlayer === HUMAN_PLAYER) {
        // Remove the last move
        boardState[lastMove.index] = '';
        cells[lastMove.index].classList.remove(HUMAN_PLAYER);
        moveHistory.pop();
        
        // If there was a computer move before that, undo it too
        if (moveHistory.length > 0 && moveHistory[moveHistory.length - 1].player === COMPUTER_PLAYER) {
            const computerMoveObj = moveHistory.pop();
            boardState[computerMoveObj.index] = '';
            cells[computerMoveObj.index].classList.remove(COMPUTER_PLAYER);
            currentPlayer = HUMAN_PLAYER; // Switch back to player
        }
        
        hapticFeedback('success');
        playSound('restart');
        updateUndoButton();
    }
};

// Add touch event listeners to the game board for swipe gestures
const gameBoard = document.getElementById('game-board');
gameBoard.addEventListener('touchstart', handleTouchStart, { passive: true });
gameBoard.addEventListener('touchmove', handleTouchMove, { passive: true });
gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });

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
        hapticFeedback('double');
    }
    gameActive = true;
    boardState = ['', '', '', '', '', '', '', '', ''];
    moveHistory = []; // Reset move history
    currentPlayer = playerStarts ? HUMAN_PLAYER : COMPUTER_PLAYER;
    gameOverMessage.innerText = '';
    cells.forEach(cell => {
        cell.classList.remove(HUMAN_PLAYER);
        cell.classList.remove(COMPUTER_PLAYER);
        cell.removeEventListener('click', handleCellClick);
        cell.addEventListener('click', handleCellClick, { once: true });
        // Add touch events for better mobile support
        cell.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent double-tap zoom
            handleCellClick(e);
        }, { passive: false });
    });
    
    updateUndoButton();

    if (!playerStarts) {
        setTimeout(() => {
            computerMove();
            updateUndoButton();
        }, 500);
    }
};

const handleCellClick = (e) => {
    const cell = e.target.closest('[data-cell]') || e.target;
    const index = Array.from(cells).indexOf(cell);

    if (boardState[index] !== '' || !gameActive || currentPlayer === COMPUTER_PLAYER) {
        return;
    }

    playSound('move');
    hapticFeedback('light');
    placeMark(index, HUMAN_PLAYER);
    moveHistory.push({ index, player: HUMAN_PLAYER });
    updateUndoButton();
    
    if (checkWin(HUMAN_PLAYER)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setTimeout(() => {
            computerMove();
            updateUndoButton();
        }, 500);
    }
};

const placeMark = (index, player) => {
    boardState[index] = player;
    cells[index].classList.add(player);
    if (player === COMPUTER_PLAYER) {
        moveHistory.push({ index, player: COMPUTER_PLAYER });
    }
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

const isDraw = (board = boardState) => {
    return board.every(cell => {
        return cell !== '';
    });
};

const endGame = (draw) => {
    if (draw) {
        gameOverMessage.innerText = "It's a Draw!";
        playSound('draw');
        hapticFeedback('double');
    } else {
        if (currentPlayer === HUMAN_PLAYER) {
            gameOverMessage.innerText = "You Win!";
            playerScore++;
            playerScoreDisplay.innerText = `Player: ${playerScore}`;
            playSound('win');
            hapticFeedback('success');
        } else {
            gameOverMessage.innerText = "Computer Wins!";
            computerScore++;
            computerScoreDisplay.innerText = `Computer: ${computerScore}`;
            playSound('lose');
            hapticFeedback('error');
        }
    }
    gameActive = false;
    updateUndoButton();
};

const computerMove = () => {
    if (!gameActive) return;

    let bestScore = -Infinity;
    let move = -1;
    const availableMoves = [];
    
    // First, collect all available moves
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === '') {
            availableMoves.push(i);
        }
    }
    
    // If no moves available, return
    if (availableMoves.length === 0) return;
    
    // Evaluate each move using minimax
    for (let i of availableMoves) {
        const newBoard = [...boardState];
        newBoard[i] = COMPUTER_PLAYER;
        let score = minimax(newBoard, 0, false);
        
        if (score > bestScore) {
            bestScore = score;
            move = i;
        }
    }
    
    // Fallback: if move is still -1, use first available move (shouldn't happen with proper minimax)
    if (move === -1) {
        move = availableMoves[0];
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
    let result = checkWinner(board);
    if (result !== null) {
        return scores[result];
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                // Create a new copy of the board for this move
                const newBoard = [...board];
                newBoard[i] = COMPUTER_PLAYER;
                let score = minimax(newBoard, depth + 1, false);
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                // Create a new copy of the board for this move
                const newBoard = [...board];
                newBoard[i] = HUMAN_PLAYER;
                let score = minimax(newBoard, depth + 1, true);
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
};


const checkWinner = (board = boardState) => {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    if (isDraw(board)) {
        return 'tie';
    }

    return null;
}


restartButton.addEventListener('click', () => {
    playerStarts = !playerStarts;
    startGame(true);
});

// Undo button functionality
undoButton.addEventListener('click', () => {
    undoLastMove();
    updateUndoButton();
});

// Update undo button state
const updateUndoButton = () => {
    if (moveHistory.length > 0 && gameActive && currentPlayer === HUMAN_PLAYER) {
        undoButton.disabled = false;
    } else {
        undoButton.disabled = true;
    }
};


// PWA Install Prompt
let deferredPrompt;
const installButton = document.createElement('button');
installButton.id = 'install-button';
installButton.textContent = 'Install App';
installButton.style.cssText = `
    margin-top: 10px;
    padding: 10px 20px;
    font-size: clamp(0.9em, 3vw, 1em);
    cursor: pointer;
    background-color: #2ed573;
    border: none;
    color: #282c34;
    border-radius: 5px;
    transition: background-color 0.3s;
    display: none;
`;
installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        installButton.style.display = 'none';
    }
});
document.body.appendChild(installButton);

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Before Install Prompt event
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
});

// App Installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
    installButton.style.display = 'none';
});

// Push Notification Registration
const registerPushNotifications = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: null // Would need a VAPID key for production
            });
            console.log('Push subscription:', subscription);
        } catch (error) {
            console.log('Push registration failed:', error);
        }
    }
};

// Request notification permission only after user interaction (not automatically)
// This prevents browser dialogs from interfering with the user experience
const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                registerPushNotifications();
            }
        });
    }
};

// Only request after first user interaction (click anywhere on the page)
let notificationPermissionRequested = false;
document.addEventListener('click', () => {
    if (!notificationPermissionRequested && 'Notification' in window && Notification.permission === 'default') {
        notificationPermissionRequested = true;
        // Delay the request slightly to avoid interfering with other click handlers
        setTimeout(requestNotificationPermission, 1000);
    }
}, { once: false });

// Online/Offline event handlers
window.addEventListener('online', () => {
    console.log('App is online');
    if (gameOverMessage) {
        const originalText = gameOverMessage.innerText;
        gameOverMessage.innerText = 'Back online!';
        setTimeout(() => {
            gameOverMessage.innerText = originalText;
        }, 2000);
    }
});

window.addEventListener('offline', () => {
    console.log('App is offline');
    if (gameOverMessage) {
        const originalText = gameOverMessage.innerText;
        gameOverMessage.innerText = 'Playing offline...';
        setTimeout(() => {
            gameOverMessage.innerText = originalText;
        }, 2000);
    }
});

startGame();
