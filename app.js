document.addEventListener('DOMContentLoaded', () => {
    const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;  // Cloudflare Worker URL
    const repoContentsElement = document.getElementById('repo-contents');
    const backButton = document.getElementById('back-button');
    const toggleLayoutButton = document.getElementById('toggle-layout');
    let history = [];  // To keep track of the navigation history
    let isGridView = false;  // Track current layout state

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

                if (path) {
                    // Show the back button if we're in a subdirectory
                    backButton.style.display = 'block';
                } else {
                    // Hide the back button if we're in the root directory
                    backButton.style.display = 'none';
                }

                if (Array.isArray(data)) {
                    // Display files and directories
                    data.forEach(item => {
                        const element = document.createElement('a');
                        element.textContent = item.name;
                        element.className = `repo-item ${item.type === 'dir' ? 'folder' : 'file'}`;

                        if (item.type === 'dir') {
                            // Fetch contents of the folder on click
                            element.addEventListener('click', () => {
                                history.push(path);  // Add current path to history
                                fetchRepoContents(item.path);
                            });
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

    // Function to handle the back navigation
    function goBack() {
        const previousPath = history.pop();  // Get the last path from history
        fetchRepoContents(previousPath);  // Fetch contents of the previous path
    }

    // Add event listener to the back button
    backButton.addEventListener('click', goBack);

    // Add event listener to the toggle layout button
    toggleLayoutButton.addEventListener('click', () => {
        isGridView = !isGridView;  // Toggle the layout state
        repoContentsElement.className = `repo-contents ${isGridView ? 'grid' : ''}`;  // Apply grid or list class
        toggleLayoutButton.textContent = isGridView ? 'Switch to List' : 'Switch to Grid';  // Update button text
    });

    // Load the root of the repo
    fetchRepoContents();
});
