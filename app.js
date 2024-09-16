document.addEventListener('DOMContentLoaded', () => {
    const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;  // Cloudflare Worker URL
    const repoContentsElement = document.getElementById('repo-contents');
    const backButton = document.getElementById('back-button');
    const toggleLayoutButton = document.getElementById('toggle-layout');
    let history = [];  // To keep track of navigation history
    let isGridView = false;  // Track current layout state
    let authToken = null;  // To store the authentication token
    const protectedFolders = ['/public/'];  // List of protected folders

    // Function to get icon based on file type
    function getIcon(type, name) {
        const extension = name.split('.').pop().toLowerCase();
        switch (type) {
            case 'dir': return 'folder';
            case 'file':
                switch (extension) {
                    case 'jpg':
                    case 'jpeg':
                    case 'png': return 'image';
                    case 'pdf': return 'picture_as_pdf';
                    case 'txt': return 'text_format';
                    case 'js':
                    case 'html':
                    case 'css': return 'code';
                    default: return 'insert_drive_file';
                }
            default: return 'insert_drive_file';
        }
    }

    // Function to prompt for authentication
    function promptForAuth() {
        return new Promise((resolve, reject) => {
            const username = prompt('Enter your username:');
            const password = prompt('Enter your password:');
            if (username && password) {
                resolve(btoa(`${username}:${password}`));  // Encode credentials to base64
            } else {
                reject(new Error('Authentication credentials are required.'));
            }
        });
    }

    // Function to fetch and display repo contents
    function fetchRepoContents(path = '') {
        // Determine if the path is protected
        const isProtected = protectedFolders.some(folder => path.startsWith(folder));

        if (!authToken && isProtected) {
            promptForAuth().then(token => {
                authToken = token;
                fetchData(path);  // Retry fetching data with authentication
            }).catch(error => {
                console.error('Authentication error:', error);
            });
        } else {
            fetchData(path);  // Fetch data with existing authentication
        }
    }

    // Helper function to fetch data
    function fetchData(path) {
        const headers = new Headers();
        if (authToken) {
            headers.append('Authorization', `Basic ${authToken}`);
        }

        fetch(repoApiBaseUrl + path, { headers })
            .then(response => {
                if (response.status === 401) {
                    // Unauthorized, prompt for credentials
                    if (protectedFolders.some(folder => path.startsWith(folder))) {
                        authToken = null;
                        fetchRepoContents(path);
                    } else {
                        throw new Error('Unauthorized access');
                    }
                } else if (!response.ok) {
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
                        const element = document.createElement('div');
                        element.textContent = item.name;
                        element.className = `repo-item ${item.type === 'dir' ? 'folder' : 'file'}`;

                        // Add icons based on type
                        const icon = document.createElement('i');
                        icon.className = `material-icons icon`;
                        icon.textContent = getIcon(item.type, item.name);  // Get relevant icon
                        element.prepend(icon);

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
        repoContentsElement.className = `repo-contents ${isGridView ? 'grid' : 'list'}`;  // Apply grid or list class
        toggleLayoutButton.innerHTML = `<i class="material-icons">${isGridView ? 'view_list' : 'view_module'}</i>`;  // Update button icon
    });

    // Load the root of the repo
    fetchRepoContents();
});
