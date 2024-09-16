const repoOwner = 'iAman-G';
const repoName = 'CF-Files';
const githubApiBaseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
const repoContentsElement = document.getElementById('repo-contents');

// Function to fetch and display repo contents
function fetchRepoContents(path = '') {
    fetch(githubApiBaseUrl + path)
        .then(response => response.json())
        .then(data => {
            // Clear existing content
            repoContentsElement.innerHTML = '';

            // Display files and directories
            data.forEach(item => {
                const element = document.createElement('div');
                element.textContent = item.name;
                element.className = item.type === 'dir' ? 'folder' : 'file';

                if (item.type === 'dir') {
                    // Fetch contents of the folder on click
                    element.addEventListener('click', () => fetchRepoContents(item.path));
                } else {
                    // Open file in a new tab
                    element.addEventListener('click', () => window.open(item.html_url, '_blank'));
                }

                repoContentsElement.appendChild(element);
            });
        })
        .catch(error => console.error('Error fetching repo contents:', error));
}

// Load the root of the repo
fetchRepoContents();
