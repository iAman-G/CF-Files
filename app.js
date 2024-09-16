const repoOwner = 'iAman-G';  // Replace with your GitHub username
const repoName = 'CF-Files';  // Replace with your repository name
//const githubToken = "process.env.VUE_APP_GITHUB_TOKEN";  // Replace with your personal GitHub token

//const githubToken = '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';  // Replace with your personal GitHub token
const githubApiBaseUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
const repoContentsElement = document.getElementById('repo-contents');

// Function to fetch and display repo contents
function fetchRepoContents(path = '') {
    const headers = {
        'Authorization': `token ${githubToken}`
    };
    
    fetch(githubApiBaseUrl + path, { headers })
        .then(response => {
            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);  // Log the API response for debugging

            // Clear existing content
            repoContentsElement.innerHTML = '';

            if (Array.isArray(data)) {
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
            } else {
                console.error('Unexpected API response:', data);
            }
        })
        .catch(error => console.error('Error fetching repo contents:', error));
}

// Load the root of the repo
fetchRepoContents();
