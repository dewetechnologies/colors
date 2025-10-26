let deferredPrompt; // Allows to show the install prompt

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const installButton = document.getElementById('install-button');
    const timerDisplay = document.querySelector('.timer-display');
    const startButton = document.querySelector('.start-button');
    const modeButtons = document.querySelectorAll('.control-tab');
    const fullscreenButton = document.querySelector('.fullscreen-button');
    const fullscreenCloseButton = document.querySelector('.fullscreen-close-button');
    const rewardButton = document.getElementById('reward-button');

    // --- Task Elements ---
    const addTaskButton = document.querySelector('.add-task-button');
    const addTaskContainer = document.querySelector('.add-task-container');
    const taskForm = document.querySelector('.task-form');
    const taskInput = document.querySelector('.task-input');
    const cancelButton = document.querySelector('.cancel-button');
    const tasksList = document.querySelector('.tasks-list');

    // --- Timer State ---
    let timerInterval = null; // Will hold the setInterval ID
    let secondsRemaining = 25 * 60; // Default to 25 minutes
    let isPaused = true;

    const modes = {
        '25 Min': 25,
        '45 Min': 45,
        '60 Min': 60,
    };

    // --- Functions ---

    /**
     * Saves the current list of tasks to localStorage.
     */
    function saveTasks() {
        const tasks = [];
        document.querySelectorAll('.task-item').forEach(taskItem => {
            tasks.push(taskItem.querySelector('.task-text').textContent);
        });
        localStorage.setItem('mindUWCTasks', JSON.stringify(tasks));
    }

    /**
     * Saves the current active timer mode to localStorage.
     */
    function saveMode(modeName) {
        localStorage.setItem('mindUWCMode', modeName);
    }

    /**
     * Updates the timer display with the current time in MM:SS format.
     */
    function updateDisplay() {
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * Adds completed focus minutes to localStorage and updates the reward display.
     * @param {number} minutes - The number of minutes to add.
     */
    function addFocusMinutes(minutes) {
        let totalMinutes = parseInt(localStorage.getItem('mindUWCFocusMinutes') || '0', 10);
        totalMinutes += minutes;
        localStorage.setItem('mindUWCFocusMinutes', totalMinutes);
        updateRewardDisplay();
    }

    /**
     * Calculates and displays the reward based on total focus time.
     */
    function updateRewardDisplay() {
        const totalMinutes = parseInt(localStorage.getItem('mindUWCFocusMinutes') || '0', 10);
        // Calculate reward: 45 cents (R0.45) for every 45 minutes
        const reward = Math.floor(totalMinutes / 45) * 0.45;
        
        if (rewardButton) {
            rewardButton.textContent = `R ${reward.toFixed(2)}`;
        }
    }

    /**
     * The main countdown logic, called every second.
     */
    function countdown() {
        if (secondsRemaining > 0) {
            secondsRemaining--;
            updateDisplay();
        } else {
            // Timer finished
            clearInterval(timerInterval);
            isPaused = true;
            startButton.textContent = 'START';

            // Record the completed session for the reward
            const activeModeButton = document.querySelector('.control-tab.active');
            const completedMode = activeModeButton ? activeModeButton.textContent : '25 Min';
            const duration = modes[completedMode] || 25;
            addFocusMinutes(duration);

        }
    }

    /**
     * Toggles the timer between running and paused states.
     */
    function toggleTimer() {
        isPaused = !isPaused;
        if (!isPaused) {
            startButton.textContent = 'PAUSE';
            timerInterval = setInterval(countdown, 1000);
        } else {
            startButton.textContent = 'START';
            clearInterval(timerInterval);
        }
    }

    /**
     * Switches the timer mode and resets the timer.
     * @param {Event} event The click event from the mode button.
     */
    function switchMode(event) {
        // Stop current timer
        clearInterval(timerInterval);
        isPaused = true;
        startButton.textContent = 'START';

        // Update active button style
        modeButtons.forEach(button => button.classList.remove('active'));
        event.target.classList.add('active');

        // Update time
        const newMode = event.target.textContent;
        secondsRemaining = (modes[newMode] || 25) * 60;
        saveMode(newMode); // Cache the new mode
        updateDisplay();
    }

    /**
     * Shows the form to add a new task.
     */
    function showTaskForm() {
        addTaskButton.classList.add('hidden');
        addTaskContainer.classList.remove('hidden');
        taskInput.focus();
    }

    /**
     * Hides the task form and resets it.
     */
    function hideTaskForm() {
        taskForm.reset();
        addTaskContainer.classList.add('hidden');
        addTaskButton.classList.remove('hidden');
    }

    /**
     * Creates and adds a new task to the list.
     * @param {Event} event The form submission event.
     */
    function addTask(event) {
        event.preventDefault(); // Prevent page reload
        const taskName = taskInput.value.trim();

        if (!taskName) return;

        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');

        const taskText = document.createElement('span');
        taskText.classList.add('task-text');
        taskText.textContent = taskName;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('task-delete-button');
        deleteButton.innerHTML = '🗑️'; // Use a trash can emoji
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the task 'active' click from firing
            // Optional: Add a confirmation dialog
            // if (confirm('Are you sure you want to delete this task?')) {
            taskItem.remove();
            saveTasks();
            // }
        });

        taskItem.appendChild(taskText);
        taskItem.appendChild(deleteButton);

        // Add event listener to set task as active
        taskItem.addEventListener('click', (e) => {
            // Remove active class from any other task
            const allTasks = document.querySelectorAll('.task-item');
            allTasks.forEach(task => task.classList.remove('active'));
            // Add active class to the clicked task
            taskItem.classList.add('active');
        });

        tasksList.appendChild(taskItem);
        saveTasks(); // Save tasks after adding a new one

        // Set the first task as active automatically
        if (tasksList.children.length === 1) {
            taskItem.classList.add('active');
        }

        hideTaskForm();
    }

    /**
     * Allows editing a task item on double-click.
     * @param {HTMLElement} taskItem The task element to edit.
     */
    function editTask(taskItem) {
        // Prevent editing if it's already being edited
        const taskTextElement = taskItem.querySelector('.task-text');
        if (!taskTextElement || taskItem.querySelector('input')) return;

        const originalText = taskTextElement.textContent;
        taskTextElement.innerHTML = ''; // Clear the element

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = originalText;
        editInput.classList.add('task-edit-input'); // For styling

        taskTextElement.appendChild(editInput);

        // Function to save the changes
        const saveEdit = () => {
            const newText = editInput.value.trim();
            taskTextElement.textContent = newText || originalText; // Revert if empty, otherwise save
            saveTasks(); // Save tasks after editing
        };

        editInput.addEventListener('blur', saveEdit); // Save when focus is lost
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
            } else if (e.key === 'Escape') {
                editInput.removeEventListener('blur', saveEdit); // Prevent saving on blur after escaping
                taskTextElement.textContent = originalText; // Revert on Escape
            }
        });

        editInput.focus();
        editInput.select();
    }

    /**
     * Loads tasks and timer mode from localStorage on page startup.
     */
    function loadState() {
        // Load timer mode
        const savedMode = localStorage.getItem('mindUWCMode') || '25 Min';
        modeButtons.forEach(button => {
            if (button.textContent === savedMode) {
                button.classList.add('active');
                secondsRemaining = (modes[savedMode] || 25) * 60;
            } else {
                button.classList.remove('active');
            }
        });

        // Load tasks
        const savedTasks = JSON.parse(localStorage.getItem('mindUWCTasks'));
        if (savedTasks) {
            savedTasks.forEach(taskName => {
                // This re-uses the logic from the addTask function
                taskInput.value = taskName;
                addTask(new Event('submit'));
            });
        }

        // Update reward display on load
        updateRewardDisplay();
        updateDisplay();
    }

    /**
     * Toggles a class on the body to enter/exit a CSS-based fullscreen mode.
     */
    function toggleFullscreen() {
        document.body.classList.toggle('fullscreen-active');
    }

    // --- Event Listeners ---

    // Listen for clicks on the start/pause button
    startButton.addEventListener('click', toggleTimer);

    // Listen for clicks on the mode-switching buttons
    modeButtons.forEach(button => {
        button.addEventListener('click', switchMode);
    });

    // Listen for clicks on the fullscreen button
    fullscreenButton.addEventListener('click', toggleFullscreen);

    // Listen for clicks on the new close button to exit fullscreen
    fullscreenCloseButton.addEventListener('click', toggleFullscreen);

    // Add a dblclick listener to each task item when it's created
    tasksList.addEventListener('dblclick', (event) => {
        if (event.target && event.target.closest('.task-item')) {
            editTask(event.target);
        }
    });

    // Task-related event listeners
    addTaskButton.addEventListener('click', showTaskForm);
    cancelButton.addEventListener('click', hideTaskForm);
    taskForm.addEventListener('submit', addTask);
    
    // Load saved state and initialize display on page load
    loadState();

    // --- PWA Install Prompt Logic ---
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can install the PWA
        if (installButton) {
            installButton.classList.remove('hidden');
        }
    });

    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
            // Hide the install button
            installButton.classList.add('hidden');
        });
    }

    window.addEventListener('appinstalled', () => {
        // Clear the deferredPrompt so it can be garbage collected
        deferredPrompt = null;
    });

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/static/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
});