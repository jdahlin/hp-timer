/**
 * HP Timer - Main application logic
 * Handles timer functionality, UI updates, and user interactions
 */

// DOM Elements
const settingsScreen = $('settingsScreen');
const timerScreen = $('timerScreen');
const resultsScreen = $('resultsScreen');

const verbalRadio = $('verbal');
const kvantitativRadio = $('kvantitativ');
const startTestBtn = $('startTestBtn');
const pauseBtn = $('pauseBtn');
const nextBtn = $('nextBtn');
const restartBtn = $('restartBtn');

const totalTimeInput = $('totalTime');
const reserveTimeInput = $('reserveTime');
const sectionNotificationCheckbox = $('sectionNotification');
const itemNotificationEnabledCheckbox = $('itemNotificationEnabled');
const testTypeDisplay = $('testTypeDisplay');

const currentSectionTitle = $('currentSectionTitle');
const totalTimeLeft = $('totalTimeLeft');
const sectionTimeLeft = $('sectionTimeLeft');
const completedItems = $('completedItems');
const totalItems = $('totalItems');
const progressBar = $('progressBar');
const resultsBody = $('resultsBody');
const sectionInfo = $('sectionInfo');
const timeNotification = $('timeNotification');
const itemNotification = $('itemNotification');

// App state
let testType = '';
let sections = [];
let currentSectionIndex = 0;
let totalTimeInSeconds = 0;
let reserveTimePercentage = 0;
let reserveTimeInSeconds = 0;
let sectionTimeInSeconds = 0;
let timerInterval = null;
let isPaused = false;
let startTime = 0;
let sectionStartTime = 0;
let sectionResults = [];
let isOverrun = false;
let itemInterval = null;
let currentItem = 0;
let itemTime = 0;

/**
 * Visual notification functions
 */
function showTimeNotification() {
    if (sectionNotificationCheckbox.checked) {
        timeNotification.classList.add('show');
        sectionInfo.classList.add('flash');
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            hideTimeNotification();
        }, 3000);
    }
}

function hideTimeNotification() {
    timeNotification.classList.remove('show');
    sectionInfo.classList.remove('flash');
}

function showItemNotification() {
    if (itemNotificationEnabledCheckbox.checked) {
        itemNotification.classList.add('show');
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
        
        // Auto-hide after 1.5 seconds
        setTimeout(() => {
            itemNotification.classList.remove('show');
        }, 1500);
    }
}

/**
 * Test type selection
 */
function selectTestType(type) {
    testType = type;
    sections = type === 'verbal' ? VERBAL_SECTIONS : KVANTITATIV_SECTIONS;
    testTypeDisplay.textContent = type === 'verbal' ? 'Verbal' : 'Kvantitativ';
    startTestBtn.disabled = false;
}

/**
 * Reset and go to start screen
 */
function goToStartScreen() {
    clearInterval(timerInterval);
    clearInterval(itemInterval);
    currentSectionIndex = 0;
    isPaused = false;
    sectionResults = [];
    isOverrun = false;
    hideTimeNotification();
    resultsScreen.classList.add('hidden');
    timerScreen.classList.add('hidden');
    settingsScreen.classList.remove('hidden');
}

/**
 * Start the test
 */
function startTest() {
    totalTimeInSeconds = parseInt(totalTimeInput.value) * 60;
    reserveTimePercentage = parseInt(reserveTimeInput.value);
    reserveTimeInSeconds = Math.floor(totalTimeInSeconds * (reserveTimePercentage / 100));
    
    // Calculate time for each section
    const availableTime = totalTimeInSeconds - reserveTimeInSeconds;
    let totalSectionTime = 0;
    
    sections.forEach(section => {
        section.totalTime = section.items * section.timePerItem;
        totalSectionTime += section.totalTime;
    });
    
    // Adjust section times to fit available time
    const timeRatio = availableTime / totalSectionTime;
    sections.forEach(section => {
        section.adjustedTime = Math.floor(section.totalTime * timeRatio);
        section.remainingItems = section.items;
    });
    
    startSection(0);
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    settingsScreen.classList.add('hidden');
    timerScreen.classList.remove('hidden');
}

/**
 * Start a specific section
 */
function startSection(index) {
    if (index >= sections.length) {
        endTest();
        return;
    }
    
    currentSectionIndex = index;
    const section = sections[index];
    sectionStartTime = Date.now();
    currentSectionTitle.textContent = section.name;
    sectionTimeInSeconds = section.adjustedTime;
    totalItems.textContent = section.items;
    currentItem = 0;
    completedItems.textContent = currentItem;
    isOverrun = false;
    sectionTimeLeft.classList.remove('overrun');
    hideTimeNotification();
    
    // Setup per-item timer if enabled
    clearInterval(itemInterval);
    if (itemNotificationEnabledCheckbox.checked) {
        itemTime = section.timePerItem;
        setupItemTimer();
    }
    
    updateSectionTimeDisplay();
}

/**
 * Setup timer for individual items
 */
function setupItemTimer() {
    const section = sections[currentSectionIndex];
    if (currentItem >= section.items) return;
    
    const itemStartTime = Date.now();
    itemInterval = setInterval(() => {
        if (isPaused) return;
        const elapsed = Math.floor((Date.now() - itemStartTime) / 1000);
        const remaining = Math.max(0, itemTime - elapsed);
        
        if (remaining <= 0) {
            if (itemNotificationEnabledCheckbox.checked) showItemNotification();
            currentItem++;
            completedItems.textContent = currentItem;
            clearInterval(itemInterval);
            if (currentItem < section.items) setupItemTimer();
        }
    }, 1000);
}

/**
 * Update timer display
 */
function updateTimer() {
    if (isPaused) return;
    
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const remainingTotalSeconds = Math.max(0, totalTimeInSeconds - elapsedSeconds);
    
    // Update total time display
    updateTimeDisplay(totalTimeLeft, remainingTotalSeconds);
    
    // Update section time
    const elapsedSectionSeconds = Math.floor((now - sectionStartTime) / 1000);
    const remainingSectionSeconds = sectionTimeInSeconds - elapsedSectionSeconds;
    
    // Handle overrun
    if (remainingSectionSeconds <= 0 && !isOverrun) {
        isOverrun = true;
        sectionTimeLeft.classList.add('overrun');
        if (sectionNotificationCheckbox.checked) showTimeNotification();
    }
    
    updateSectionTimeDisplay(Math.abs(remainingSectionSeconds));
    
    if (remainingTotalSeconds <= 0) endTest();
}

/**
 * Update time display with formatted minutes:seconds
 */
function updateTimeDisplay(element, seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    element.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Update section time display and progress bar
 */
function updateSectionTimeDisplay(remainingSeconds) {
    if (remainingSeconds === undefined) remainingSeconds = sectionTimeInSeconds;
    
    updateTimeDisplay(sectionTimeLeft, remainingSeconds);
    
    // Only update progress bar if not in overrun
    if (!isOverrun) {
        const progressPercentage = (remainingSeconds / sectionTimeInSeconds) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.classList.remove('medium', 'low', 'critical');
        
        if (progressPercentage < 25) {
            progressBar.classList.add('critical');
        } else if (progressPercentage < 50) {
            progressBar.classList.add('low');
        } else if (progressPercentage < 75) {
            progressBar.classList.add('medium');
        }
    } else {
        progressBar.style.width = '0%';
        progressBar.classList.add('critical');
    }
}

/**
 * Toggle pause/resume
 */
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Fortsätt' : 'Pausa';
    
    if (isPaused) {
        clearInterval(timerInterval);
        clearInterval(itemInterval);
    } else {
        const pauseDuration = Date.now() - (startTime + (totalTimeInSeconds - parseInt(totalTimeLeft.textContent.split(':')[0]) * 60 - parseInt(totalTimeLeft.textContent.split(':')[1])) * 1000);
        startTime += pauseDuration;
        sectionStartTime += pauseDuration;
        timerInterval = setInterval(updateTimer, 1000);
        if (itemNotificationEnabledCheckbox.checked && currentItem < sections[currentSectionIndex].items) setupItemTimer();
    }
}

/**
 * Go to next section
 */
function goToNextSection() {
    if (isPaused) togglePause();
    recordSectionResult();
    startSection(currentSectionIndex + 1);
}

/**
 * Record result for current section
 */
function recordSectionResult() {
    if (currentSectionIndex >= sections.length) return;
    
    const section = sections[currentSectionIndex];
    const elapsedSectionSeconds = Math.floor((Date.now() - sectionStartTime) / 1000);
    const usedTime = elapsedSectionSeconds;
    const timeDifference = sectionTimeInSeconds - usedTime;
    
    sectionResults.push({
        name: section.name,
        plannedTime: sectionTimeInSeconds,
        usedTime: usedTime,
        timeDifference: timeDifference
    });
}

/**
 * End test and show results
 */
function endTest() {
    clearInterval(timerInterval);
    clearInterval(itemInterval);
    
    if (currentSectionIndex < sections.length && sectionResults.length <= currentSectionIndex) {
        recordSectionResult();
    }
    
    // Display results
    resultsBody.innerHTML = '';
    sectionResults.forEach(result => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = result.name;
        
        const plannedCell = document.createElement('td');
        const plannedMinutes = Math.floor(result.plannedTime / 60);
        const plannedSeconds = result.plannedTime % 60;
        plannedCell.textContent = `${plannedMinutes}:${plannedSeconds.toString().padStart(2, '0')}`;
        
        const usedCell = document.createElement('td');
        const usedMinutes = Math.floor(result.usedTime / 60);
        const usedSeconds = result.usedTime % 60;
        usedCell.textContent = `${usedMinutes}:${usedSeconds.toString().padStart(2, '0')}`;
        
        const diffCell = document.createElement('td');
        const diffMinutes = Math.floor(Math.abs(result.timeDifference) / 60);
        const diffSeconds = Math.abs(result.timeDifference) % 60;
        const timeFormatted = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
        
        if (result.timeDifference > 0) {
            diffCell.textContent = `+${timeFormatted} (sparad)`;
            diffCell.className = 'time-saved';
        } else if (result.timeDifference < 0) {
            diffCell.textContent = `-${timeFormatted} (överanvänd)`;
            diffCell.className = 'time-overused';
        } else {
            diffCell.textContent = `${timeFormatted} (exakt)`;
        }
        
        row.appendChild(nameCell);
        row.appendChild(plannedCell);
        row.appendChild(usedCell);
        row.appendChild(diffCell);
        
        resultsBody.appendChild(row);
    });
    
    timerScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
}

// Event listeners
verbalRadio.addEventListener('change', () => {
    if (verbalRadio.checked) selectTestType('verbal');
});

kvantitativRadio.addEventListener('change', () => {
    if (kvantitativRadio.checked) selectTestType('kvantitativ');
});

startTestBtn.addEventListener('click', startTest);
pauseBtn.addEventListener('click', togglePause);
nextBtn.addEventListener('click', goToNextSection);
restartBtn.addEventListener('click', goToStartScreen);

// Spacebar to go to next section
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !timerScreen.classList.contains('hidden')) {
        e.preventDefault();
        goToNextSection();
    }
});
