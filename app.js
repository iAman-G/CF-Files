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
                    const element = document.createElement('a');
                    element.textContent = item.name;
                    element.className = `collection-item repo-item ${item.type === 'dir' ? 'folder' : 'file'}`;

                    if (item.type === 'dir') {
                        // Fetch contents of the folder on click
                        element.addEventListener('click', () => fetchRepoContents(item.path));
                    } else {
                        // Create a download link
                        element.href = item.download_url;  // Use download_url to get the direct file URL
                        element.download = item.name;  // Set filename for download
                        element.addEventListener('click', (event) => {
                            // Handle file download directly
                            if (!element.href) {
                                event.preventDefault();
                                console.error('No download URL available.');
                            }
                        });
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
