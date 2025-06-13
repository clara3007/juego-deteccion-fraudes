// Configuración del juego
const gameConfig = {
    boardSize: 12, // 4x3 grid
    gameTime: 60,
    baseFraudAppearTime: 2000, // 2 segundos
    fraudDisplayTime: 1500, // 1.5 segundos
    pointsPerFraud: 10,
    levelMultiplier: 1.2,
    // Configuración progresiva por nivel
    minFraudSpeed: 500,     // Velocidad mínima (más rápido)
    maxFraudSpeed: 1200,    // Velocidad inicial más rápida
    baseFraudPercentage: 0.60,  // 60% fraudes en nivel 1
    maxFraudPercentage: 0.90,   // 90% fraudes en niveles altos
    fraudDisplayTimeMin: 800,   // Tiempo mínimo que se muestra
    fraudDisplayTimeMax: 1500,  // Tiempo máximo que se muestra
    inactivityTimeout: 5000,    // 5 segundos sin actividad = game over
    minPointsPerLevel: 5        // Mínimo 5 puntos por nivel
};

// Situaciones de fraude para el juego
const fraudScenarios = [
    {
        image: 'images/phishing.png',
        text: 'Phishing',
        description: 'Email falso suplantando identidad',
        isFraud: true
    },
    {
        image: 'images/scam.svg',
        text: 'Estafa',
        description: 'Engaño financiero',
        isFraud: true
    },
    {
        image: 'images/device_theft.png',
        text: 'Robo de Dispositivo',
        description: 'Hurto de móvil/tablet',
        isFraud: true
    },
    {
        image: 'images/coercion.png',
        text: 'Coacción',
        description: 'Presión o amenaza',
        isFraud: true
    },
    {
        image: 'images/malware.png',
        text: 'Malware',
        description: 'Software malicioso',
        isFraud: true
    },
    {
        image: 'images/cookie_monster.png',
        text: 'Cookies Maliciosas',
        description: 'Rastreo no autorizado',
        isFraud: true
    }
];

// Elementos legítimos/seguros (NO son fraudes)
const legitimateItems = [
    {
        image: 'images/clown.png',
        text: 'Payaso',
        description: 'Personaje amigable',
        isFraud: false
    },
    {
        image: 'images/bear.png',
        text: 'Oso',
        description: 'Animal tierno',
        isFraud: false
    },
    {
        image: 'images/stitch.png',
        text: 'Stitch',
        description: 'Personaje Disney',
        isFraud: false
    },
    {
        image: 'images/clown.png',
        text: 'Payaso',
        description: 'Personaje divertido',
        isFraud: false
    },
    {
        image: 'images/bear.png',
        text: 'Oso',
        description: 'Peluche tierno',
        isFraud: false
    },
    {
        image: 'images/stitch.png',
        text: 'Stitch',
        description: 'Personaje azul',
        isFraud: false
    },
    {
        image: 'images/clown.png',
        text: 'Payaso',
        description: 'Personaje divertido extra',
        isFraud: false
    }
];

// Combinar ambos arrays para selección aleatoria
const allScenarios = [...fraudScenarios, ...legitimateItems];

// Estado del juego
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    level: 1,
    timeLeft: gameConfig.gameTime,
    fraudsActive: [],
    gameTimer: null,
    fraudTimer: null,
    currentFraudSpeed: gameConfig.baseFraudAppearTime,
    inactivityTimer: null,
    lastActivity: Date.now(),
    levelStartScore: 0,
    gameOverReason: ''
};

// Elementos del DOM
const elements = {
    gameBoard: document.getElementById('gameBoard'),
    scoreDisplay: document.getElementById('score'),
    timeDisplay: document.getElementById('time'),
    levelDisplay: document.getElementById('level'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    gameOver: document.getElementById('gameOver'),
    finalScore: document.getElementById('finalScore'),
    finalLevel: document.getElementById('finalLevel'),
    performance: document.getElementById('performance'),
    playAgainBtn: document.getElementById('playAgainBtn')
};

// Funciones para calcular dificultad por nivel
function getFraudSpeedForLevel(level) {
    // Velocidad más rápida en niveles altos
    const speedReduction = (level - 1) * 100; // Reduce 100ms cada nivel (más suave)
    return Math.max(gameConfig.maxFraudSpeed - speedReduction, gameConfig.minFraudSpeed);
}

function getFraudPercentageForLevel(level) {
    // Porcentaje de fraudes aumenta cada nivel
    const percentageIncrease = (level - 1) * 0.05; // +5% cada nivel
    return Math.min(gameConfig.baseFraudPercentage + percentageIncrease, gameConfig.maxFraudPercentage);
}

function getFraudDisplayTimeForLevel(level) {
    // Tiempo de visualización disminuye cada nivel
    const timeReduction = (level - 1) * 100; // Reduce 100ms cada nivel
    return Math.max(gameConfig.fraudDisplayTimeMax - timeReduction, gameConfig.fraudDisplayTimeMin);
}

// Funciones para manejo de inactividad
function startInactivityTimer() {
    clearTimeout(gameState.inactivityTimer);
    gameState.inactivityTimer = setTimeout(() => {
        if (gameState.isPlaying && !gameState.isPaused) {
            gameState.gameOverReason = 'inactivity';
            endGame();
        }
    }, gameConfig.inactivityTimeout);
}

function resetInactivityTimer() {
    gameState.lastActivity = Date.now();
    if (gameState.isPlaying && !gameState.isPaused) {
        startInactivityTimer();
    }
}

function checkLevelProgress() {
    const pointsInThisLevel = gameState.score - gameState.levelStartScore;
    if (pointsInThisLevel < gameConfig.minPointsPerLevel) {
        gameState.gameOverReason = 'insufficient_points';
        endGame();
        return false;
    }
    return true;
}

// Inicializar el juego
function initializeGame() {
    createGameBoard();
    setupEventListeners();
    updateDisplay();
}

// Crear el tablero de juego
function createGameBoard() {
    elements.gameBoard.innerHTML = '';
    
    for (let i = 0; i < gameConfig.boardSize; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.id = `hole-${i}`;
        hole.addEventListener('click', () => onHoleClick(i));
        elements.gameBoard.appendChild(hole);
    }
}

// Configurar event listeners
function setupEventListeners() {
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.resetBtn.addEventListener('click', resetGame);
    elements.playAgainBtn.addEventListener('click', resetGame);
    
    // Evitar el menú contextual en el tablero
    elements.gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Iniciar el juego
function startGame() {
    if (!gameState.isPlaying) {
        gameState.isPlaying = true;
        gameState.isPaused = false;
        gameState.timeLeft = gameConfig.gameTime;
        gameState.currentFraudSpeed = getFraudSpeedForLevel(gameState.level);
        gameState.levelStartScore = gameState.score;
        gameState.gameOverReason = '';
        
        elements.startBtn.disabled = true;
        elements.pauseBtn.disabled = false;
        
        startGameTimer();
        startFraudSpawning();
        startInactivityTimer();
        
        updateDisplay();
    }
}

// Pausar/reanudar el juego
function togglePause() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        clearInterval(gameState.gameTimer);
        clearTimeout(gameState.fraudTimer);
        clearTimeout(gameState.inactivityTimer);
        elements.pauseBtn.textContent = '▶️ Reanudar';
    } else {
        startGameTimer();
        startFraudSpawning();
        startInactivityTimer();
        elements.pauseBtn.textContent = '⏸️ Pausar';
    }
}

// Reiniciar el juego
function resetGame() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.timeLeft = gameConfig.gameTime;
    gameState.fraudsActive = [];
    gameState.currentFraudSpeed = gameConfig.baseFraudAppearTime;
    gameState.levelStartScore = 0;
    gameState.gameOverReason = '';
    
    clearInterval(gameState.gameTimer);
    clearTimeout(gameState.fraudTimer);
    clearTimeout(gameState.inactivityTimer);
    
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.pauseBtn.textContent = '⏸️ Pausar';
    elements.gameOver.classList.add('hidden');
    
    clearAllFrauds();
    updateDisplay();
}

// Timer principal del juego
function startGameTimer() {
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateDisplay();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
        
        // Subir de nivel cada 20 segundos
        if (gameState.timeLeft % 20 === 0 && gameState.timeLeft > 0) {
            levelUp();
        }
    }, 1000);
}

// Subir de nivel
function levelUp() {
    // Solo verificar progreso si no es el primer nivel
    if (gameState.level > 1) {
        if (!checkLevelProgress()) {
            return; // El juego termina por puntos insuficientes
        }
    }
    
    gameState.level++;
    
    // Actualizar puntuación de inicio del nuevo nivel
    gameState.levelStartScore = gameState.score;
    
    // Actualizar velocidad basada en el nivel
    gameState.currentFraudSpeed = getFraudSpeedForLevel(gameState.level);
    
    // Mostrar felicitaciones
    showCongratsMessage(gameState.level);
    
    // Efecto visual de subida de nivel
    showLevelUpEffect();
    updateDisplay();
    
    // Mostrar información del nivel
    console.log(`Nivel ${gameState.level}:`);
    console.log(`- Velocidad: ${gameState.currentFraudSpeed}ms`);
    console.log(`- % Fraudes: ${(getFraudPercentageForLevel(gameState.level) * 100).toFixed(0)}%`);
    console.log(`- Tiempo visible: ${getFraudDisplayTimeForLevel(gameState.level)}ms`);
}

// Efecto visual de subida de nivel
function showLevelUpEffect() {
    const levelElement = elements.levelDisplay;
    levelElement.style.transform = 'scale(1.5)';
    levelElement.style.color = '#f39c12';
    
    setTimeout(() => {
        levelElement.style.transform = 'scale(1)';
        levelElement.style.color = '#2c3e50';
    }, 500);
}

// Mostrar felicitaciones al subir de nivel
function showCongratsMessage(level) {
    const congratsMessages = [
        '🎉 ¡Felicitaciones!',
        '🏆 ¡Excelente!', 
        '🚀 ¡Increíble!',
        '⭐ ¡Fantástico!',
        '🎯 ¡Perfecto!',
        '🔥 ¡Imparable!',
        '💪 ¡Súper!',
        '🎊 ¡Genial!',
        '🌟 ¡Espectacular!',
        '👑 ¡Eres el mejor!'
    ];
    
    // Seleccionar mensaje basado en el nivel
    const messageIndex = (level - 2) % congratsMessages.length; // -2 porque empezamos en nivel 2
    const message = congratsMessages[messageIndex];
    
    // Crear el popup
    const congratsPopup = document.createElement('div');
    congratsPopup.className = 'congrats-popup';
    congratsPopup.innerHTML = `
        ${message}<br>
        <div style="font-size: 0.6em; margin-top: 10px;">
            ¡Nivel ${level} desbloqueado!
        </div>
    `;
    
    // Añadir al body
    document.body.appendChild(congratsPopup);
    
    // Remover después de la animación
    setTimeout(() => {
        if (congratsPopup.parentNode) {
            congratsPopup.remove();
        }
    }, 2500);
}

// Spawning de fraudes
function startFraudSpawning() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    spawnFraud();
    
    gameState.fraudTimer = setTimeout(() => {
        startFraudSpawning();
    }, gameState.currentFraudSpeed);
}

// Generar un elemento (fraude o legítimo)
function spawnFraud() {
    const availableHoles = [];
    
    // Encontrar hoyos vacíos
    for (let i = 0; i < gameConfig.boardSize; i++) {
        const hole = document.getElementById(`hole-${i}`);
        if (!hole.querySelector('.fraud-item')) {
            availableHoles.push(i);
        }
    }
    
    if (availableHoles.length === 0) return;
    
    // Seleccionar un hoyo aleatorio
    const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    
    // Probabilidad de fraude basada en el nivel
    const fraudPercentage = getFraudPercentageForLevel(gameState.level);
    let randomItem;
    if (Math.random() < fraudPercentage) {
        // Seleccionar fraude
        randomItem = fraudScenarios[Math.floor(Math.random() * fraudScenarios.length)];
    } else {
        // Seleccionar elemento legítimo
        randomItem = legitimateItems[Math.floor(Math.random() * legitimateItems.length)];
    }
    
    createFraudItem(randomHole, randomItem);
}

// Crear un elemento (fraude o legítimo)
function createFraudItem(holeIndex, itemData) {
    const hole = document.getElementById(`hole-${holeIndex}`);
    const item = document.createElement('div');
    
    // Asignar clase según si es fraude o legítimo
    item.className = itemData.isFraud ? 'fraud-item' : 'fraud-item legitimate-item';
    item.innerHTML = `
        <img class="fraud-image" src="${itemData.image}" alt="${itemData.text}" onerror="this.style.display='none'">
    `;
    
    item.addEventListener('click', () => onItemClick(holeIndex, itemData));
    
    hole.appendChild(item);
    
    // Remover el elemento después de un tiempo basado en el nivel
    const displayTime = getFraudDisplayTimeForLevel(gameState.level);
    setTimeout(() => {
        if (item.parentNode) {
            item.remove();
        }
    }, displayTime);
}

// Manejar clic en un hoyo
function onHoleClick(holeIndex) {
    const hole = document.getElementById(`hole-${holeIndex}`);
    const item = hole.querySelector('.fraud-item');
    
    if (item) {
        // Encontrar los datos del elemento
        const itemImage = item.querySelector('.fraud-image');
        const itemSrc = itemImage ? itemImage.src : '';
        const itemData = allScenarios.find(s => s.image === itemSrc);
        onItemClick(holeIndex, itemData);
    }
}

// Manejar clic en un elemento (fraude o legítimo)
function onItemClick(holeIndex, itemData) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // Resetear temporizador de inactividad
    resetInactivityTimer();
    
    const hole = document.getElementById(`hole-${holeIndex}`);
    const item = hole.querySelector('.fraud-item');
    
    if (item) {
        // Animar desaparición
        item.classList.add('clicked');
        
        let points = 0;
        let popupClass = '';
        
        if (itemData.isFraud) {
            // Es un fraude: ganar puntos
            points = gameConfig.pointsPerFraud * gameState.level;
            gameState.score += points;
            popupClass = 'points-popup-positive';
            
            // Mostrar mini felicitación por acierto
            showMiniCongrats(hole);
        } else {
            // Es legítimo: perder puntos
            points = -(gameConfig.pointsPerFraud * gameState.level);
            gameState.score = Math.max(0, gameState.score + points); // No bajar de 0
            popupClass = 'points-popup-negative';
        }
        
        // Mostrar popup de puntos
        showPointsPopup(hole, points, popupClass);
        
        // Remover el elemento después de la animación
        setTimeout(() => {
            if (item.parentNode) {
                item.remove();
            }
        }, 300);
        
        updateDisplay();
    }
}

// Mostrar popup de puntos
function showPointsPopup(hole, points, popupClass = 'points-popup-positive') {
    const popup = document.createElement('div');
    popup.className = `points-popup ${popupClass}`;
    popup.textContent = points > 0 ? `+${points}` : `${points}`;
    
    hole.appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
    }, 1000);
}

// Mostrar mini-felicitaciones al acertar fraudes
function showMiniCongrats(hole) {
    const miniCongratsMessages = [
        '¡Bien! 👍',
        '¡Genial! ⭐',
        '¡Perfecto! 🎯',
        '¡Excelente! 🔥',
        '¡Súper! 💪',
        '¡Fantástico! ✨',
        '¡Increíble! 🚀',
        '¡Bravo! 👏',
        '¡Magnífico! 🌟',
        '¡Espectacular! 🎊'
    ];
    
    // Seleccionar mensaje aleatorio
    const randomMessage = miniCongratsMessages[Math.floor(Math.random() * miniCongratsMessages.length)];
    
    // Crear el mini popup
    const miniCongrats = document.createElement('div');
    miniCongrats.className = 'mini-congrats';
    miniCongrats.textContent = randomMessage;
    
    // Añadir al hoyo
    hole.appendChild(miniCongrats);
    
    // Remover después de la animación
    setTimeout(() => {
        if (miniCongrats.parentNode) {
            miniCongrats.remove();
        }
    }, 1500);
}

// Limpiar todos los fraudes
function clearAllFrauds() {
    const holes = document.querySelectorAll('.hole');
    holes.forEach(hole => {
        const fraudItem = hole.querySelector('.fraud-item');
        if (fraudItem) {
            fraudItem.remove();
        }
    });
}

// Terminar el juego
function endGame() {
    gameState.isPlaying = false;
    
    clearInterval(gameState.gameTimer);
    clearTimeout(gameState.fraudTimer);
    clearTimeout(gameState.inactivityTimer);
    
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    
    clearAllFrauds();
    showGameOverScreen();
}

// Mostrar pantalla de fin de juego
function showGameOverScreen() {
    elements.finalScore.textContent = gameState.score;
    elements.finalLevel.textContent = gameState.level;
    
    // Mensaje según la razón del game over
    let performanceMessage = '';
    
    if (gameState.gameOverReason === 'inactivity') {
        performanceMessage = '⏰ ¡Tiempo agotado! Estuviste 5 segundos sin actividad. ¡Mantente alerta como un buen detective!';
    } else if (gameState.gameOverReason === 'insufficient_points') {
        performanceMessage = '📊 ¡Puntos insuficientes! Necesitas al menos 5 puntos por nivel. ¡Practica tu puntería detectivesca!';
    } else if (gameState.score >= 500) {
        performanceMessage = '🏆 ¡Excelente! Eres un experto en detectar fraudes.';
    } else if (gameState.score >= 300) {
        performanceMessage = '👍 ¡Muy bien! Tienes buen ojo para los fraudes.';
    } else if (gameState.score >= 150) {
        performanceMessage = '👌 ¡Bien! Sigue practicando para mejorar.';
    } else {
        performanceMessage = '📚 ¡Sigue intentando! La práctica hace al maestro.';
    }
    
    elements.performance.textContent = performanceMessage;
    elements.gameOver.classList.remove('hidden');
}

// Actualizar la visualización
function updateDisplay() {
    elements.scoreDisplay.textContent = gameState.score;
    elements.timeDisplay.textContent = gameState.timeLeft;
    elements.levelDisplay.textContent = gameState.level;
}

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeGame);

// Efectos de sonido simulados (feedback visual)
function playSound(type) {
    // En lugar de sonidos, usamos efectos visuales
    const body = document.body;
    
    switch (type) {
        case 'hit':
            body.style.backgroundColor = '#2ecc71';
            setTimeout(() => {
                body.style.backgroundColor = '';
            }, 100);
            break;
        case 'miss':
            body.style.backgroundColor = '#e74c3c';
            setTimeout(() => {
                body.style.backgroundColor = '';
            }, 100);
            break;
    }
}

// Función para generar estadísticas de juego
function getGameStatistics() {
    const fraudsPerMinute = Math.round((gameState.score / gameConfig.pointsPerFraud) / ((gameConfig.gameTime - gameState.timeLeft) / 60));
    const accuracy = Math.round((gameState.score / (gameState.level * 10)) * 100);
    
    return {
        score: gameState.score,
        level: gameState.level,
        fraudsDetected: Math.floor(gameState.score / gameConfig.pointsPerFraud),
        fraudsPerMinute: fraudsPerMinute || 0,
        accuracy: Math.min(accuracy, 100) || 0
    };
}

// Añadir efectos de partículas cuando se detecta un fraude
function createParticleEffect(x, y) {
    const particles = [];
    const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db'];
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = '50%';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        
        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        particle.style.animation = `particleMove 0.6s ease-out forwards`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, 600);
    }
}

// CSS para las partículas (se añadirá dinámicamente)
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes particleMove {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--dx, 0), var(--dy, 0)) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(particleStyle); 