// Global variables
let currentPage = 1;
let cardsPerPage = 3;
let totalCards = 0;
let totalPages = 0;
let questions = [];
let ratings = JSON.parse(localStorage.getItem('ratings')) || {};

let cache = {};  // Add a cache object to store the fetched data

document.getElementById('cards-per-page').addEventListener('change', function() {
  setCardsPerPage(this.value);
});

document.getElementById('start-button').addEventListener('click', startQuiz);

document.getElementById('prev-button').addEventListener('click', () => changePage(-1));
document.getElementById('next-button').addEventListener('click', () => changePage(1));

async function startQuiz() {
    console.log('Starting quiz.');
    document.getElementById('name-container').classList.add('d-none');
    document.getElementById('quiz-container').classList.remove('d-none');
    await loadJsonFiles();
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage > 0 && newPage <= totalPages) {
        displayPage(newPage);
    }
}

async function loadJsonFiles() {
    console.log('Loading JSON files...');
    document.getElementById('loading-screen').classList.remove('d-none');

    try {
        const response = await fetch('/json');
        const jsonFiles = await response.json();
        console.log('jsonFiles:', jsonFiles);
        
        const loadFilePromises = jsonFiles.map(async (file) => {
            const fileName = file.fileName;  // Ensure correct handling of fileName
            console.log('JSON File:', fileName);
            if (cache[fileName]) {
                return { data: cache[fileName], fileName };  // Ensuring data and fileName are correctly structured
            } else {
                const res = await fetch(`/json/${fileName}`);
                const data = await res.json();
                cache[fileName] = data;
                return { data, fileName };  // Ensuring data and fileName are correctly structured
            }
        });

        const filesContent = await Promise.all(loadFilePromises);
        questions = filesContent.flatMap(fileContent => parseQuestions(fileContent.data, fileContent.fileName));  // Use .data and .fileName correctly
        totalCards = questions.length;
        totalPages = Math.ceil(totalCards / cardsPerPage);
        displayPage(1);
    } catch (error) {
        console.error('Error loading JSON files:', error);
        alert('Failed to load quiz questions. Please try again later.');
    } finally {
        document.getElementById('loading-screen').classList.add('d-none');
    }
}

function parseQuestions(fileContent, fileName) {
    console.log('File name received in parseQuestions:', fileName);
    const parsedQuestions = [];
    ['True/False Questions', 'Yes/No Questions', 'Multiple Choice Questions', 'Matrix Order', 'Rank Order', 'Rating Scale Questions', 'Likert Scale Questions'].forEach(type => {
        if (fileContent[type]) {
            fileContent[type].forEach(q => {
                const items = type === 'Matrix Order' || type === 'Rank Order' ? q.items : [];
                const responses = type === 'Rating Scale Questions' || type === 'Likert Scale Questions' ? [] : q.responses || ['True', 'False'];
                parsedQuestions.push({ type: type.replace(/ Questions| Order/g, ''), question: q.question, responses, items, file: fileName, min: q.min || 1, max: q.max || (type === 'Rating Scale Questions' ? 10 : 5) });
            });
        }
    });
    return parsedQuestions;
}

function setCardsPerPage(newCount) {
    cardsPerPage = parseInt(newCount, 10);
    totalPages = Math.ceil(totalCards / cardsPerPage);
    displayPage(1); // Reset to the first page with the new count
}

function displayPage(page) {
    console.log('Displaying page:', page);
    currentPage = page;
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, totalCards);
    const questionnaireContainer = document.getElementById('questionnaire-container');
    questionnaireContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
        const question = questions[i];
        const card = document.createElement('div');
        card.className = 'card';
        let content = `
            <h2>Type: ${question.type}</h2>
            <p>Question: ${question.question}</p>
        `;
        if (question.type === 'Rating Scale' || question.type === 'Likert Scale') {
            content += `
                <input type="range" min="${question.min}" max="${question.max}" step="1" value="${ratings[i] || (question.min + question.max) / 2}" data-question="${i}" class="slider">
                <span class="slider-value">${ratings[i] || (question.min + question.max) / 2}</span>
            `;
        } else {
            content += `<p>Responses: ${question.responses.join(', ')}</p>`;
        }
        if (question.items.length) {
            content += `<p>Items: ${question.items.join(', ')}</p>`;
        }
        if (question.type === 'Multiple Choice' || question.type === 'True/False' || question.type === 'Yes/No') {
            content += `
                <div class="rating" data-question="${i}">
                    ${[...Array(5)].map((_, idx) => `<span class="star" data-value="${idx + 1}" role="button" tabindex="0" aria-label="Rate ${idx + 1}">&#9733;</span>`).join('')}
                </div>
            `;
        }
        card.innerHTML = content;
        fragment.appendChild(card);
    }
    questionnaireContainer.appendChild(fragment);
    attachSliderEventListeners();
    attachStarEventListeners();
    updatePaginationControls();
    updateAllStarsDisplay();  // Update the display of stars for all questions on initial load
}

function attachSliderEventListeners() {
    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', handleSliderInput);
        slider.addEventListener('change', handleSliderChange);
    });
}

function handleSliderInput(e) {
    const value = e.target.value;
    e.target.nextElementSibling.textContent = value;
}

async function handleSliderChange(e) {
    const value = e.target.value;
    const questionIndex = e.target.dataset.question;
    ratings[questionIndex] = value;
    await saveRatings(questionIndex, value, questions[questionIndex].file);
}

async function saveRatings(questionIndex, value, file) {
    console.log('File name used in saveRatings:', file);
    if (!file) {
        console.error('File name is undefined, cannot save rating');
        return;
    }
    console.log('Question Index:', questionIndex);
    console.log('File associated with the question:', file);

    console.log('Saving rating. Question:', questionIndex, 'Value:', value);
    ratings[questionIndex] = value;
    localStorage.setItem('ratings', JSON.stringify(ratings)); // Save ratings locally for persistence

    let data = cache[file] || {};
    data.weight = value;  // Store the rating within the weight key

    try {
        const response = await fetch(`/json/${file}`);
        const serverData = await response.json();
        serverData.weight = value;

        const updateResponse = await fetch(`/json/${file}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serverData)
        });
        const updatedData = await updateResponse.json();
        console.log('Rating saved:', updatedData);
        cache[file] = updatedData; // Update the cache with new data from the server
    } catch (error) {
        console.error('Error saving rating:', error);
        alert('Failed to update rating on server. Please try again later.');
        // Revert local rating if server update fails
        ratings[questionIndex] = currentRating;
        localStorage.setItem('ratings', JSON.stringify(ratings));
    }
}

function updateStarDisplay(questionIndex) {
    const ratingValue = ratings[questionIndex] || 0;
    document.querySelectorAll(`[data-question="${questionIndex}"] .star`).forEach(star => {
        if (parseInt(star.dataset.value, 10) <= ratingValue) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

function updateAllStarsDisplay() {
    questions.forEach((_, index) => updateStarDisplay(index));
}

function attachStarEventListeners() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', handleRatingClick);
        star.addEventListener('mouseover', handleStarMouseOver);
        star.addEventListener('mouseout', handleStarMouseOut);
        star.addEventListener('keypress', handleStarKeyPress);
    });
}

function handleStarMouseOver(e) {
    const hoveredStar = e.target;
    const stars = hoveredStar.parentElement.querySelectorAll('.star');
    const hoverValue = parseInt(hoveredStar.dataset.value, 10);

    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value, 10);
        if (starValue <= hoverValue) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

function handleStarMouseOut(e) {
    const stars = e.target.parentElement.querySelectorAll('.star');
    stars.forEach(star => {
        star.classList.remove('selected');
    });
    updateStarDisplay(e.target.parentElement.dataset.question); // Ensures persistent rating display
}

function handleStarKeyPress(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        handleRatingClick(e);
    }
}

async function handleRatingClick(e) {
    const value = e.target.dataset.value;
    const questionIndex = e.target.parentElement.dataset.question;
    const currentRating = ratings[questionIndex];
    if (currentRating === value) {
        delete ratings[questionIndex];
    } else {
        ratings[questionIndex] = value;
    }
    
    const question = questions[questionIndex];
    const file = question ? question.file : null;  // Ensure you extract the file name here
    
    await saveRatings(questionIndex, value, file);  // Pass 'file' to saveRatings
    updateStarDisplay(questionIndex); // Update stars to reflect current rating
}

function updatePaginationControls() {
    document.getElementById('prev-button').disabled = currentPage === 1;
    document.getElementById('next-button').disabled = currentPage === totalPages;
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}
