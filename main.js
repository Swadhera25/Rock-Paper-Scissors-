// Game state
let userScore = 0;
let computerScore = 0;
let userChoice = null;
let computerChoice = null;
let isGameActive = false;
let soundEnabled = true;

// Sound effects
let bgMusic;
let winSound;
let loseSound;
let drawSound;
let clickSound;

// DOM Elements
const rockBtn = document.getElementById('rock-btn');
const paperBtn = document.getElementById('paper-btn');
const scissorsBtn = document.getElementById('scissors-btn');
const resetBtn = document.getElementById('reset-btn');
const soundToggle = document.getElementById('sound-toggle');
const userScoreElement = document.getElementById('user-score');
const computerScoreElement = document.getElementById('computer-score');

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Three.js scene
    initScene();
    
    // Add event listeners to game buttons
    rockBtn.addEventListener('click', () => makeChoice(MODELS.ROCK));
    paperBtn.addEventListener('click', () => makeChoice(MODELS.PAPER));
    scissorsBtn.addEventListener('click', () => makeChoice(MODELS.SCISSORS));
    resetBtn.addEventListener('click', resetGame);
    soundToggle.addEventListener('click', toggleSound);
    
    // Load sound effects
    loadSounds();
});

// Load and set up sound effects
function loadSounds() {
    try {
        // Create audio folder if needed
        createAudioFolder();
        
        // Background music - looped
        bgMusic = new Audio('https://assets.codepen.io/217233/digital.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
        
        // Alternative sources in case the CodePen assets don't work
        bgMusic.addEventListener('error', () => {
            console.log('Primary audio source failed, trying alternate source');
            bgMusic.src = 'https://cdn.pixabay.com/audio/2022/03/15/audio_cb15547669.mp3'; // Fallback music
        });
        
        // Game sounds
        winSound = new Audio('https://assets.codepen.io/217233/success.mp3');
        winSound.addEventListener('error', () => {
            winSound.src = 'https://cdn.pixabay.com/audio/2022/11/17/audio_946b11e011.mp3';
        });
        
        loseSound = new Audio('https://assets.codepen.io/217233/error.mp3');
        loseSound.addEventListener('error', () => {
            loseSound.src = 'https://cdn.pixabay.com/audio/2022/10/30/audio_f1e6f0e0f8.mp3';
        });
        
        drawSound = new Audio('https://assets.codepen.io/217233/beep.mp3');
        drawSound.addEventListener('error', () => {
            drawSound.src = 'https://cdn.pixabay.com/audio/2022/03/10/audio_31840ae4b5.mp3';
        });
        
        clickSound = new Audio('https://assets.codepen.io/217233/click.mp3');
        clickSound.addEventListener('error', () => {
            clickSound.src = 'https://cdn.pixabay.com/audio/2022/01/18/audio_ba45e8943e.mp3';
        });
        
        // Set volumes
        winSound.volume = 0.5;
        loseSound.volume = 0.5;
        drawSound.volume = 0.5;
        clickSound.volume = 0.5;
        
        // Preload sounds
        preloadSounds();
        
        // Start background music after user interaction
        document.addEventListener('click', function startAudio() {
            bgMusic.play().catch(error => {
                console.warn('Audio autoplay was prevented:', error);
                soundEnabled = false;
                updateSoundToggleButton();
            });
            document.removeEventListener('click', startAudio);
        }, { once: true });
        
        // Display a sound hint
        showSoundHint();
        
    } catch (error) {
        console.error('Error loading sound files:', error);
        soundEnabled = false;
        updateSoundToggleButton();
    }
}

// Function to attempt creating a sounds directory for local audio files
function createAudioFolder() {
    // This is just a placeholder - we can't create files in browser
    console.log('Would create audio folder if this were a Node.js environment');
}

// Preload sounds to reduce latency
function preloadSounds() {
    // Touch the audio files to preload them
    winSound.load();
    loseSound.load();
    drawSound.load();
    clickSound.load();
}

// Show a hint about enabling sound
function showSoundHint() {
    const resultText = document.getElementById('result-text');
    const originalText = resultText.textContent;
    
    resultText.textContent = "Click anywhere to enable sounds";
    resultText.classList.add('draw');
    
    setTimeout(() => {
        resultText.textContent = originalText;
        resultText.classList.remove('draw');
    }, 3000);
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    
    if (soundEnabled) {
        bgMusic.play().catch(error => {
            console.warn('Audio autoplay was prevented:', error);
        });
    } else {
        bgMusic.pause();
    }
    
    // Add visual feedback
    soundToggle.classList.add('selected');
    setTimeout(() => {
        soundToggle.classList.remove('selected');
    }, 300);
    
    updateSoundToggleButton();
}

// Update sound toggle button text
function updateSoundToggleButton() {
    soundToggle.textContent = `Sound: ${soundEnabled ? 'ON' : 'OFF'}`;
    soundToggle.classList.toggle('sound-on', soundEnabled);
    soundToggle.classList.toggle('sound-off', !soundEnabled);
}

// Play a sound effect if sound is enabled
function playSound(sound) {
    if (soundEnabled && sound) {
        // Stop the sound first to allow replaying
        sound.pause();
        sound.currentTime = 0;
        
        // Play with error handling
        sound.play().catch(error => {
            console.warn('Audio play was prevented:', error);
            
            // Try playing after user interaction
            document.addEventListener('click', function playAfterInteraction() {
                sound.play().catch(err => console.warn('Still unable to play audio', err));
                document.removeEventListener('click', playAfterInteraction);
            }, { once: true });
        });
    }
}

// Handle user's choice
function makeChoice(choice) {
    // If game is already active, return early
    if (isGameActive) return;
    
    // Set game as active
    isGameActive = true;
    
    // Play click sound
    playSound(clickSound);
    
    // Reset button styles
    resetButtonStyles();
    
    // Set selected button style
    highlightSelectedButton(choice);
    
    // Store user choice
    userChoice = choice;
    
    // Display user's choice in 3D
    displayModel(choice, true);
    
    // Display loading message
    updateResultText('Computer is thinking...');
    
    // Add delay for computer's choice (for suspense)
    setTimeout(() => {
        // Get computer's choice
        computerChoice = getComputerChoice();
        
        // Display computer's choice
        displayModel(computerChoice, false);
        
        // Determine winner and update scores
        const result = determineWinner(userChoice, computerChoice);
        
        // Update the UI
        updateUI(result);
        
        // Set game as inactive after a delay
        setTimeout(() => {
            isGameActive = false;
            
            // Reset camera position
            resetCamera();
        }, 3000);
    }, 1000);
}

// Highlight the selected button
function highlightSelectedButton(choice) {
    switch(choice) {
        case MODELS.ROCK:
            rockBtn.classList.add('selected');
            break;
        case MODELS.PAPER:
            paperBtn.classList.add('selected');
            break;
        case MODELS.SCISSORS:
            scissorsBtn.classList.add('selected');
            break;
    }
}

// Reset all button styles
function resetButtonStyles() {
    rockBtn.classList.remove('selected');
    paperBtn.classList.remove('selected');
    scissorsBtn.classList.remove('selected');
}

// Get computer's random choice
function getComputerChoice() {
    const choices = [MODELS.ROCK, MODELS.PAPER, MODELS.SCISSORS];
    const randomIndex = Math.floor(Math.random() * 3);
    return choices[randomIndex];
}

// Determine the winner
function determineWinner(userChoice, computerChoice) {
    // If choices are the same, it's a draw
    if (userChoice === computerChoice) {
        return 'draw';
    }
    
    // Determine winner based on Rock-Paper-Scissors rules
    if (
        (userChoice === MODELS.ROCK && computerChoice === MODELS.SCISSORS) ||
        (userChoice === MODELS.PAPER && computerChoice === MODELS.ROCK) ||
        (userChoice === MODELS.SCISSORS && computerChoice === MODELS.PAPER)
    ) {
        return 'win';
    } else {
        return 'lose';
    }
}

// Update UI based on game result
function updateUI(result) {
    let resultMessage;
    let resultClass;
    
    // Remove previous background classes
    document.body.classList.remove('win-bg', 'lose-bg', 'draw-bg');
    
    switch(result) {
        case 'win':
            userScore++;
            userScoreElement.textContent = userScore;
            resultMessage = 'You win!';
            resultClass = 'win';
            playSound(winSound);
            animateWinner(true);
            focusCameraOnWinner(true);
            document.body.classList.add('win-bg');
            createConfetti(150); // Create confetti for win
            break;
        case 'lose':
            computerScore++;
            computerScoreElement.textContent = computerScore;
            resultMessage = 'You lose!';
            resultClass = 'lose';
            playSound(loseSound);
            animateWinner(false);
            focusCameraOnWinner(false);
            document.body.classList.add('lose-bg');
            break;
        case 'draw':
            resultMessage = 'It\'s a draw!';
            resultClass = 'draw';
            playSound(drawSound);
            document.body.classList.add('draw-bg');
            break;
    }
    
    // Update result text
    updateResultText(resultMessage, resultClass);
}

// Create confetti effect
function createConfetti(count = 100) {
    // Get the confetti container
    const container = document.getElementById('confetti-container');
    
    // Clear any existing confetti
    container.innerHTML = '';
    container.classList.add('active');
    
    // Create confetti pieces
    const colors = ['blue', 'green', 'gold', 'purple'];
    
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        
        // Randomize properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100; // Random horizontal position
        const delay = Math.random() * 2; // Random delay
        const duration = 3 + Math.random() * 2; // Random duration
        
        // Apply properties
        confetti.className = `confetti ${color}`;
        confetti.style.left = `${left}vw`;
        confetti.style.animationDelay = `${delay}s`;
        confetti.style.animationDuration = `${duration}s`;
        
        // Add to container
        container.appendChild(confetti);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
        container.classList.remove('active');
    }, 6000);
}

// Reset the game and scores
function resetGame() {
    // Play click sound
    playSound(clickSound);
    
    // Reset scores
    userScore = 0;
    computerScore = 0;
    
    // Update score display
    userScoreElement.textContent = userScore;
    computerScoreElement.textContent = computerScore;
    
    // Reset buttons
    resetButtonStyles();
    
    // Reset result text
    updateResultText('Choose your move!');
    
    // Reset background color
    document.body.classList.remove('win-bg', 'lose-bg', 'draw-bg');
    
    // Reset camera
    resetCamera();
    
    // Clear any displayed models
    clearModels();
}

// Clear all models from the scene
function clearModels() {
    // Remove any existing models from the groups
    while (userModelGroup.children.length > 0) {
        userModelGroup.remove(userModelGroup.children[0]);
    }
    
    while (computerModelGroup.children.length > 0) {
        computerModelGroup.remove(computerModelGroup.children[0]);
    }
} 