import confetti from 'canvas-confetti';

const board = document.querySelector('#sudoku-board');
const numBtns = document.querySelectorAll('.num-btn');
const eraseBtn = document.querySelector('#erase-btn');
const newGameBtn = document.querySelector('#new-game-btn');
const solveBtn = document.querySelector('#solve-btn');
const winModal = document.querySelector('#win-modal');
const closeModal = document.querySelector('#close-modal');

let selectedCell = null;
let puzzle = [];
let solution = [];

function init() {
    createBoard();
    startNewGame();
    setupEventListeners();
    animateCats();
}

function createBoard() {
    board.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', () => selectCell(cell));
        board.appendChild(cell);
    }
}

function selectCell(cell) {
    if (selectedCell) {
        selectedCell.classList.remove('selected');
    }
    selectedCell = cell;
    selectedCell.classList.add('selected');
}

function startNewGame() {
    generateSudoku();
    renderBoard();
}

function generateSudoku() {
    // 1. Generate a full valid board
    solution = new Array(81).fill(0);
    fillBoard(solution);

    // 2. Create puzzle by removing numbers
    puzzle = [...solution];
    // Difficulty adjustment: remove more for harder, fewer for easier
    const attempts = 45;
    let count = 0;
    while (count < attempts) {
        const idx = Math.floor(Math.random() * 81);
        if (puzzle[idx] !== 0) {
            puzzle[idx] = 0;
            count++;
        }
    }
}

function fillBoard(grid) {
    const emptyDetails = findEmpty(grid);
    if (emptyDetails === null) return true; // Board is full

    const index = emptyDetails;
    const row = Math.floor(index / 9);
    const col = index % 9;

    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

    for (let num of nums) {
        if (isValid(grid, num, index)) {
            grid[index] = num;
            if (fillBoard(grid)) return true;
            grid[index] = 0;
        }
    }
    return false;
}

function findEmpty(grid) {
    for (let i = 0; i < 81; i++) {
        if (grid[i] === 0) return i;
    }
    return null;
}

function isValid(grid, num, index) {
    const row = Math.floor(index / 9);
    const col = index % 9;

    // Check row
    for (let c = 0; c < 9; c++) {
        if (grid[row * 9 + c] === num) return false;
    }

    // Check col
    for (let r = 0; r < 9; r++) {
        if (grid[r * 9 + col] === num) return false;
    }

    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (grid[(startRow + r) * 9 + (startCol + c)] === num) return false;
        }
    }

    return true;
}

function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
        cell.innerText = puzzle[i] === 0 ? '' : puzzle[i];
        cell.className = 'cell'; // Reset classes
        if (puzzle[i] !== 0) {
            cell.classList.add('initial');
        } else {
            // Add slight random delay for entry animation
            cell.style.animationDelay = `${Math.random() * 0.5}s`;
            cell.classList.add('fade-in');
        }
    });
    selectedCell = null;
}

function fillNumber(num) {
    if (!selectedCell || selectedCell.classList.contains('initial')) return;

    selectedCell.innerText = num;
    selectedCell.classList.add('user-input');
    selectedCell.classList.remove('error');
    selectedCell.classList.add('pop'); // Add pop animation on input

    const index = parseInt(selectedCell.dataset.index);
    if (parseInt(num) !== solution[index]) {
        selectedCell.classList.add('error');
        // Shake animation reset
        selectedCell.style.animation = 'none';
        selectedCell.offsetHeight; /* trigger reflow */
        selectedCell.style.animation = null;
    } else {
        // Correct input fun
        confetti({
            particleCount: 15,
            spread: 30,
            origin: { y: 0.6, x: 0.5 },
            gravity: 2,
            scalar: 0.5,
            colors: ['#ff9a9e', '#fad0c4', '#fff']
        });
    }

    setTimeout(() => selectedCell.classList.remove('pop'), 200);

    checkWin();
}

function setupEventListeners() {
    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const num = btn.dataset.num;
            fillNumber(num);
        });

        // Highlight same numbers on hover
        btn.addEventListener('mouseenter', () => {
            const num = btn.dataset.num;
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                if (cell.innerText === num) {
                    cell.classList.add('highlight-same-number');
                }
            });
        });

        btn.addEventListener('mouseleave', () => {
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.classList.remove('highlight-same-number');
            });
        });
    });

    eraseBtn.addEventListener('click', () => {
        if (selectedCell && !selectedCell.classList.contains('initial')) {
            selectedCell.innerText = '';
            selectedCell.classList.remove('user-input', 'error');
        }
    });

    newGameBtn.addEventListener('click', startNewGame);

    solveBtn.addEventListener('click', () => {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, i) => {
            if (!cell.classList.contains('initial')) {
                cell.innerText = solution[i];
                cell.classList.add('user-input');
            }
        });
        checkWin();
    });

    closeModal.addEventListener('click', () => {
        winModal.classList.add('hidden');
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key >= '1' && key <= '9') {
            fillNumber(key);
        } else if (key === 'Backspace' || key === 'Delete') {
            if (selectedCell && !selectedCell.classList.contains('initial')) {
                selectedCell.innerText = '';
                selectedCell.classList.remove('user-input', 'error');
            }
        }
    });
}

function checkWin() {
    const cells = document.querySelectorAll('.cell');
    let isFull = true;
    let isCorrect = true;

    cells.forEach((cell, i) => {
        const val = parseInt(cell.innerText) || 0;
        if (val === 0) isFull = false;
        if (val !== solution[i]) isCorrect = false;
    });

    if (isFull && isCorrect) {
        // Big confetti explosion
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        setTimeout(() => {
            winModal.classList.remove('hidden');
        }, 1000);
    }
}

function animateCats() {
    // Simple JS animation helper if CSS isn't enough, but CSS handles most.
}

init();
