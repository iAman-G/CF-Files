document.addEventListener('DOMContentLoaded', () => {
    const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;
    const repoContentsElement = document.getElementById('repo-contents');
    const backButton = document.getElementById('back-button');
    const toggleLayoutButton = document.getElementById('toggle-layout');
    let history = [];
    let isGridView = false;

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
                // Clear existing content
                repoContentsElement.innerHTML = '';

                if (path) {
                    backButton.style.display = 'block';
                } else {
                    backButton.style.display = 'none';
                }

                // Display files and directories
                data.forEach(item => {
                    const element = document.createElement('a');
                    element.textContent = item.name;
                    element.className = `repo-item ${item.type === 'dir' ? 'folder' : 'file'}`;

                    const icon = document.createElement('i');
                    icon.className = `material-icons icon`;
                    icon.textContent = getIcon(item.type, item.name);
                    element.prepend(icon);

                    if (item.type === 'dir') {
                        element.addEventListener('click', () => {
                            history.push(path);
                            fetchRepoContents(item.path);
                        });
                    } else {
                        element.href = item.download_url;
                        element.download = item.name;
                    }

                    repoContentsElement.appendChild(element);
                });

                // Apply layout class
                repoContentsElement.className = `repo-contents ${isGridView ? 'grid' : 'list'}`;
            })
            .catch(error => console.error('Error fetching repo contents:', error));
    }

    // Function to handle the back navigation
    backButton.addEventListener('click', () => {
        const previousPath = history.pop();
        fetchRepoContents(previousPath);
    });

    // Toggle layout
    toggleLayoutButton.addEventListener('click', () => {
        isGridView = !isGridView;
        fetchRepoContents(); // Re-fetch contents to apply layout changes
        toggleLayoutButton.innerHTML = `<i class="material-icons">${isGridView ? 'view_list' : 'view_module'}</i>`;
    });

    // Load the root of the repo
    fetchRepoContents();
});
