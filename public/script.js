let analysis = '';

function checkResume() {
    const fileInput = document.getElementById('resume');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    showModal();

    const formData = new FormData();
    formData.append('resume', file);

    const checkButton = document.getElementById('checkResumeBtn');
    checkButton.textContent = 'Processing...';
    checkButton.disabled = true;

    fetch('/analyze-resume', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerHTML = data.analysis;
        document.getElementById('improveResumeBtn').style.display = 'block';
        analysis = data.analysis;
        updateVisitorCount();
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('result').innerHTML = 'An error occurred while processing the resume.';
    })
    .finally(() => {
        checkButton.textContent = 'Check My Resume';
        checkButton.disabled = false;
    });
}

function improveResume() {
    const improveButton = document.getElementById('improveResumeBtn');
    improveButton.textContent = 'Processing...';
    improveButton.disabled = true;

    fetch('/improve-resume', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis: analysis })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('improvements').innerHTML = data.improvements;
        document.getElementById('improvements').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('improvements').innerHTML = 'An error occurred while improving the resume.';
        document.getElementById('improvements').style.display = 'block';
    })
    .finally(() => {
        improveButton.textContent = 'Improve My Resume';
        improveButton.disabled = false;
    });
}

function toggleLearnMore() {
    const content = document.getElementById('learnMoreContent');
    const arrow = document.querySelector('.learn-more-box h3 .arrow');
    const h3 = document.querySelector('.learn-more-box h3');
    
    content.classList.toggle('show');
    arrow.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
    
    if (content.classList.contains('show')) {
        h3.firstChild.textContent = 'IMPORTANT';
        content.style.display = 'block';
    } else {
        h3.firstChild.textContent = 'Want to learn more? ';
        setTimeout(() => { content.style.display = 'none'; }, 300); // Match this to your transition time
    }
}

function toggleWaitingList() {
    const content = document.getElementById('waitingListContent');
    const arrow = document.querySelector('.waiting-list-container h3 .arrow');
    const h3 = document.querySelector('.waiting-list-container h3');
    
    content.classList.toggle('show');
    arrow.style.transform = content.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
    
    if (content.classList.contains('show')) {
        h3.firstChild.textContent = 'Hide Waiting List ';
        content.style.display = 'block';
    } else {
        h3.firstChild.textContent = 'Join Our Waiting List ';
        setTimeout(() => { content.style.display = 'none'; }, 300); // Match this to your transition time
    }
}

function showModal() {
    document.getElementById('privacyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('privacyModal').style.display = 'none';
}

function updateVisitorCount() {
    fetch('/visitor-count')
        .then(response => response.json())
        .then(data => {
            document.getElementById('count').textContent = data.count;
        })
        .catch(error => console.error('Error:', error));
}

// Call updateVisitorCount immediately when the page loads
document.addEventListener('DOMContentLoaded', updateVisitorCount);

// Optionally, update the count periodically
setInterval(updateVisitorCount, 60000); // Update every minute