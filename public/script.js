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

    fetch('/analyze-resume', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerHTML = data.analysis;
        document.querySelector('button[onclick="improveResume()"]').style.display = 'block';
        analysis = data.analysis;
        updateVisitorCount();
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('result').innerHTML = 'An error occurred while processing the resume.';
    });
}

function improveResume() {
    fetch('/improve-resume', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis: analysis })
    })
    .then(response => response.json())
    .then(data => {
        // Update the improvements div with the received data
        document.getElementById('improvements').innerHTML = data.improvements;

        // Show the improvements div
        document.getElementById('improvements').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        // Display the error message and show the improvements div
        document.getElementById('improvements').innerHTML = 'An error occurred while improving the resume.';
        document.getElementById('improvements').style.display = 'block';
    });
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