let currentPage = 1;
const cardsPerPage = 1;
let totalCards = 0;
let totalPages = 0;
let questions = [];
let ratings = {};
let userName = '';

document.getElementById('start-button').addEventListener('click', function() {
  userName = document.getElementById('user-name').value;
  if (userName) {
    document.getElementById('name-container').classList.add('d-none');
    document.getElementById('quiz-container').classList.remove('d-none');
    loadJsonFiles();
  } else {
    alert('Please enter your name.');
  }
});

document.getElementById('prev-button').addEventListener('click', () => {
  if (currentPage > 1) {
    displayPage(currentPage - 1);
  }
});

document.getElementById('next-button').addEventListener('click', () => {
  if (currentPage < totalPages) {
    displayPage(currentPage + 1);
  }
});

function loadJsonFiles() {
  document.getElementById('loading-screen').classList.remove('d-none');

  fetch('/json')
    .then(response => response.json())
    .then(jsonFiles => {
      const loadFilePromises = jsonFiles.map(file => fetch(`/json/${file}`).then(res => res.json()));
      
      Promise.all(loadFilePromises)
        .then(filesContent => {
          questions = [];
          filesContent.forEach(fileContent => {
            // Check for different types of questions and normalize the format
            if (fileContent['True/False Questions']) {
              fileContent['True/False Questions'].forEach(q => {
                questions.push({
                  type: 'True/False',
                  question: q.question,
                  responses: ['True', 'False'],
                  file: fileContent.file
                });
              });
            } else if (fileContent['Multiple Choice Questions']) {
              fileContent['Multiple Choice Questions'].forEach(q => {
                questions.push({
                  type: 'Multiple Choice',
                  question: q.question,
                  responses: q.responses || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                  file: fileContent.file
                });
              });
            } else if (fileContent.questions) {
              fileContent.questions.forEach(q => {
                questions.push({
                  ...q,
                  file: fileContent.file
                });
              });
            } else if (fileContent['Matrix Order']) {
              fileContent['Matrix Order'].forEach(q => {
                questions.push({
                  type: 'Matrix Table',
                  question: q.question,
                  responses: q.responses,
                  items: q.items,
                  file: fileContent.file
                });
              });
            } else if (fileContent['Rank Order']) {
              fileContent['Rank Order'].forEach(q => {
                questions.push({
                  type: 'Rank Order',
                  question: q.question,
                  responses: q.responses,
                  file: fileContent.file
                });
              });
            } else {
              console.warn(`File content does not match expected format:`, fileContent);
            }
          });

          totalCards = questions.length;
          totalPages = Math.ceil(totalCards / cardsPerPage);
          displayPage(1);
          document.getElementById('loading-screen').classList.add('d-none');
        })
        .catch(error => {
          console.error('Error loading JSON files:', error);
          document.getElementById('loading-screen').classList.add('d-none');
        });
    });
}

function displayPage(page) {
  currentPage = page;
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = Math.min(startIndex + cardsPerPage, totalCards);
  document.getElementById('questionnaire-container').innerHTML = '';

  for (let i = startIndex; i < endIndex; i++) {
    const question = questions[i];
    const card = document.createElement('div');
    card.className = 'col-12 col-md-6 col-lg-4 card';
    let content = `
      <h2>Type: ${question.type}</h2>
      <p>Question: ${question.question}</p>
    `;

    if (question.responses) {
      content += `<p>Responses: ${question.responses.join(', ')}</p>`;
    }

    if (question.items) {
      content += `<p>Items: ${question.items.join(', ')}</p>`;
    }

    content += `
      <div class="rating" data-question="${i}">
        <span class="star" data-value="1">&#9733;</span>
        <span class="star" data-value="2">&#9733;</span>
        <span class="star" data-value="3">&#9733;</span>
        <span class="star" data-value="4">&#9733;</span>
        <span class="star" data-value="5">&#9733;</span>
      </div>
    `;

    card.innerHTML = content;
    document.getElementById('questionnaire-container').appendChild(card);

    // Apply existing rating if available
    const currentRating = ratings[i];
    if (currentRating) {
      document.querySelectorAll(`[data-question="${i}"] .star`).forEach(star => {
        if (star.dataset.value <= currentRating) {
          star.classList.add('selected');
        }
      });
    }
  }

  document.querySelectorAll('.rating').forEach(rating => {
    rating.addEventListener('click', (e) => {
      if (e.target.classList.contains('star')) {
        const value = e.target.dataset.value;
        const questionIndex = rating.dataset.question;
        const currentRating = ratings[questionIndex];

        if (currentRating === value) {
          delete ratings[questionIndex];
          rating.querySelectorAll('.star').forEach(star => star.classList.remove('selected'));
        } else {
          ratings[questionIndex] = value;
          rating.querySelectorAll('.star').forEach(star => {
            star.classList.remove('selected');
            if (star.dataset.value <= value) {
              star.classList.add('selected');
            }
          });
        }
        saveRatings(questionIndex, value);
      }
    });
  });

  updatePaginationControls();
}

function saveRatings(questionIndex, value) {
  const question = questions[questionIndex];
  const file = question.file;
  
  fetch(`/json/${file}`)
    .then(response => response.json())
    .then(data => {
      if (!data.ratings) {
        data.ratings = [];
      }
      data.ratings[questionIndex] = value;
      return fetch(`/json/${file}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    })
    .then(response => response.json())
    .then(data => {
      console.log('Rating saved:', data);
    })
    .catch(error => {
      console.error('Error saving rating:', error);
    });
}

function updatePaginationControls() {
  document.getElementById('prev-button').disabled = currentPage === 1;
  document.getElementById('next-button').disabled = currentPage === totalPages;
  document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}
