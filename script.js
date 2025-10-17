class CleaningSchedule {
    constructor() {
        this.names = [];
        this.jobs = [];
        this.initializeEventListeners();
        this.tryLoadFromFile();
    }

    initializeEventListeners() {
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateSchedule();
        });

        document.getElementById('fileInput').addEventListener('change', (event) => {
            this.handleFileUpload(event);
        });
    }

    async tryLoadFromFile() {
        try {
            const response = await fetch('CleaningScheduleLists.txt');
            if (response.ok) {
                const text = await response.text();
                this.parseFileContent(text);
                this.populateInputs();
            }
        } catch (error) {
            console.log('No local file found or error loading file:', error);
        }
    }

handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.txt')) {
        this.showError('Please upload only .txt files');
        return;
    }
    
    // Validate file size (e.g., 10KB max)
    if (file.size > 10 * 1024) {
        this.showError('File too large. Maximum 10KB allowed.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            this.parseFileContent(e.target.result);
            this.populateInputs();
        } catch (error) {
            this.showError('Error reading file: ' + error.message);
        }
    };
    reader.onerror = () => {
        this.showError('Error reading file');
    };
    reader.readAsText(file);
}

parseFileContent(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
        this.names = lines[0].trim().split(' ').filter(name => name);
        this.jobs = lines[1].trim().split(' ').filter(job => job);
        
        // VALIDATE FILE CONTENT TOO
        try {
            this.validateInputs(this.names, this.jobs);
        } catch (error) {
            this.showError(`Invalid file content: ${error.message}`);
            this.names = [];
            this.jobs = [];
        }
    }
}

    populateInputs() {
        document.getElementById('namesInput').value = this.names.join(' ');
        document.getElementById('jobsInput').value = this.jobs.join(' ');
    }

    generateSchedule() {
        try {
            // Get values from inputs
            const namesInput = document.getElementById('namesInput').value.trim();
            const jobsInput = document.getElementById('jobsInput').value.trim();

            if (!namesInput || !jobsInput) {
                throw new Error('Please enter both names and cleaning areas');
            }

            this.names = namesInput.split(' ').filter(name => name);
            this.jobs = jobsInput.split(' ').filter(job => job);

            this.validateInputs(this.names, this.jobs);

            if (this.names.length < 2) {
                throw new Error('Please enter at least 2 names');
            }

            if (this.jobs.length * 2 > this.names.length) {
                throw new Error(`Not enough names for the cleaning areas. Need ${this.jobs.length * 2} names but only have ${this.names.length}`);
            }

            // Create a copy of names and shuffle
            const shuffledNames = [...this.names];
            this.shuffle(shuffledNames);

            // Generate assignments
            const assignments = [];
            const namesCopy = [...shuffledNames];

            for (let i = 0; i < this.jobs.length; i++) {
                if (namesCopy.length >= 2) {
                    assignments.push({
                        job: this.jobs[i],
                        person1: namesCopy[0],
                        person2: namesCopy[1]
                    });
                    namesCopy.splice(0, 2);
                }
            }

            // Display results
            this.displayResults(shuffledNames, assignments, namesCopy);
            this.hideError();

        } catch (error) {
            this.showError(error.message);
        }
    }

    validateInputs(names, jobs) {
    // Check for reasonable input lengths
    if (names.some(name => name.length > 50)) {
        throw new Error('Names too long (max 50 characters)');
    }
    if (jobs.some(job => job.length > 50)) {
        throw new Error('Job names too long (max 50 characters)');
    }
    
    // Check for excessive input counts
    if (names.length > 100) {
        throw new Error('Too many names (max 100)');
    }
    if (jobs.length > 50) {
        throw new Error('Too many jobs (max 50)');
    }
    
    // Check for potentially dangerous characters (basic XSS prevention)
    const dangerousChars = /[<>"'&]/;
    if (names.some(name => dangerousChars.test(name))) {
        throw new Error('Names contain invalid characters');
    }
    if (jobs.some(job => dangerousChars.test(job))) {
        throw new Error('Job names contain invalid characters');
    }
}

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    displayResults(originalNames, assignments, noCleaning) {
    // Display names and jobs
    document.getElementById('namesList').textContent = originalNames.join(' ');
    document.getElementById('jobsList').textContent = this.jobs.join(' ');

    // Display assignments
    const assignmentList = document.getElementById('assignmentList');
    assignmentList.innerHTML = '';
    
    assignments.forEach(assignment => {
        const assignmentElement = document.createElement('div');
        assignmentElement.className = 'assignment-item';
        assignmentElement.textContent = 
            `Area to clean: ${assignment.job} ----> ${assignment.person1} and ${assignment.person2}`;
        assignmentList.appendChild(assignmentElement);
    });

    // Display no cleaning list
    document.getElementById('noCleaningList').textContent = 
        noCleaning.length > 0 ? noCleaning.join(' ') : 'None';

    // Show output section and hide error
    document.getElementById('output').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
}

    showError(message) {
        const errorElement = document.getElementById('error');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        document.getElementById('output').classList.add('hidden');
    }
    
    hideError() {
        document.getElementById('error').classList.add('hidden');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CleaningSchedule();
});
