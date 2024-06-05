// Global variables
let currentPage = 1;
const cardsPerPage = 3;
let totalCards = 0;
let totalPages = 0;
const questions = [];
let ratings = {};
let userName = '';

// Function to change the number of questions displayed per page
function setCardsPerPage(newCount) {
  cardsPerPage = parseInt(newCount, 10);
  totalPages = Math.ceil(totalCards / cardsPerPage);
  displayPage(1); // Reset to the first page with the new count
}

document.getElementById('cards-per-page').addEventListener('change', function() {
  setCardsPerPage(this.value);
});

// Add Event Listeners for Quiz Start, Pagination, and Keyboard Input
document.getElementById('start-button').addEventListener('click', startQuiz);
document.getElementById('user-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        startQuiz();
    }
});
document.getElementById('prev-button').addEventListener('click', () => changePage(-1));
document.getElementById('next-button').addEventListener('click', () => changePage(1));

function startQuiz() {
    userName = document.getElementById('user-name').value;
    if (userName) {
        console.log('Starting quiz for user:', userName);
        document.getElementById('name-container').classList.add('d-none');
        document.getElementById('quiz-container').classList.remove('d-none');
        loadJsonFiles();
    } else {
        alert('Please enter your name.');
    }
}

function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage > 0 && newPage <= totalPages) {
        displayPage(newPage);
    }
}

function loadJsonFiles() {
    console.log('Loading JSON files...');
    document.getElementById('loading-screen').classList.remove('d-none');

    fetch('/json')
        .then(response => response.json())
        .then(jsonFiles => {
            const loadFilePromises = jsonFiles.map(file => fetch(`/json/${file}`).then(res => res.json()));
            return Promise.all(loadFilePromises);
        })
        .then(filesContent => {
            questions.push(...filesContent.flatMap(fileContent => parseQuestions(fileContent)));
            totalCards = questions.length;
            totalPages = Math.ceil(totalCards / cardsPerPage);
            displayPage(1);
        })
        .catch(error => {
            console.error('Error loading JSON files:', error);
            document.getElementById('loading-screen').classList.add('d-none');
        })
        .finally(() => {
            document.getElementById('loading-screen').classList.add('d-none');
        });
}

function parseQuestions(fileContent) {
    const parsedQuestions = [];
    ['True/False Questions', 'Yes/No Questions', 'Multiple Choice Questions', 'Matrix Order', 'Rank Order', 'Rating Scale Questions'].forEach(type => {
        if (fileContent[type]) {
            fileContent[type].forEach(q => {
                const items = type === 'Matrix Order' || type === 'Rank Order' ? q.items : [];
                const responses = type === 'Rating Scale Questions' ? Array.from({length: 10}, (_, i) => (i + 1).toString()) : q.responses || ['True', 'False'];
                addQuestion(type.replace(/ Questions| Order/g, ''), q.question, responses, items, fileContent.file);
            });
        }
    });
    return parsedQuestions;
}

function addQuestion(questionType, question, responses, items, file) {
    questions.push({ type: questionType, question, responses, items, file });
}

function displayPage(page) {
    console.log('Displaying page:', page);
    currentPage = page;
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, totalCards);
    const questionnaireContainer = document.getElementById('questionnaire-container');
    questionnaireContainer.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
        const question = questions[i];
        const card = document.createElement('div');
        card.className = 'card';
        let content = `
            <h2>Type: ${question.type}</h2>
            <p>Question: ${question.question}</p>
            <p>Responses: ${question.responses.join(', ')}</p>
            ${question.items.length ? `<p>Items: ${question.items.join(', ')}</p>` : ''}
            <div class="rating" data-question="${i}">
                ${[...Array(5)].map((_, i) => `<span class="star" data-value="${i + 1}">&#9733;</span>`).join('')}
            </div>
        `;
        card.innerHTML = content;
        questionnaireContainer.appendChild(card);
    }
    updatePaginationControls();
}

function handleRatingClick(e) {
    if (e.target.classList.contains('star')) {
        const value = e.target.dataset.value;
        const questionIndex = e.target.parentElement.dataset.question;
        const currentRating = ratings[questionIndex];
        if (currentRating === value) {
            delete ratings[questionIndex];
            e.target.parentElement.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
        } else {
            ratings[questionIndex] = value;
            e.target.parentElement.querySelectorAll('.star').forEach(star => {
                star.classList.remove('selected');
                if (star.dataset.value <= value) {
                    star.classList.add('selected');
                }
            });
        }
        saveRatings(questionIndex, value);
    }
}

function saveRatings(questionIndex, value) {
    console.log('Saving rating. Question:', questionIndex, 'Value:', value);
    ratings[questionIndex] = value;
    localStorage.setItem('ratings', JSON.stringify(ratings));
}

function updatePaginationControls() {
    document.getElementById('prev-button').disabled = currentPage === 1;
    document.getElementById('next-button').disabled = currentPage === totalPages;
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}
