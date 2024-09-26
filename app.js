document.addEventListener('DOMContentLoaded', () => {
    const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;
    const repoContentsElement = document.getElementById('repo-contents');
    const backButton = document.getElementById('back-button');
    const toggleLayoutButton = document.getElementById('toggle-layout');
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const progressBar = document.getElementById('progress-bar');
    const uploadStatus = document.getElementById('upload-status');
    
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

                // Show/hide back button
                backButton.style.display = path ? 'block' : 'none';

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

    // Function to handle file uploads
    async function uploadFiles(files) {
        const totalFiles = files.length;
        let uploadedFiles = 0;

        // Show progress bar
        document.getElementById('progress-container').style.display = 'block';
        progressBar.style.width = '0%';

        for (const file of files) {
            const content = await file.text(); // Get file content

            const response = await fetch(repoApiBaseUrl, {
                method: 'POST',
                body: JSON.stringify({
                    fileName: file.name,
                    content: btoa(content), // Encode as Base64
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                uploadedFiles++;
            }

            // Update progress bar
            const progressPercentage = Math.round((uploadedFiles / totalFiles) * 100);
            progressBar.style.width = `${progressPercentage}%`;
        }

        // Show upload status
        uploadStatus.textContent = 
            uploadedFiles === totalFiles ? 'All files uploaded successfully!' : `${uploadedFiles} out of ${totalFiles} files uploaded.`;
    }

    // Add event listener to upload button
    uploadButton.addEventListener('click', () => {
        const files = Array.from(fileInput.files);
        if (files.length === 0) {
            alert('Please select a file or folder to upload.');
            return;
        }
        uploadFiles(files);
    });

    // Handle back navigation
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
