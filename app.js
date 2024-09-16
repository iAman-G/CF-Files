const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;  // Replace with your Cloudflare Worker URL
const repoContentsElement = document.getElementById('repo-contents');

// Function to fetch and display repo contents
function fetchRepoContents(path = '') {
    fetch(repoApiBaseUrl + path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
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
