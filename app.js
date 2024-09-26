document.addEventListener('DOMContentLoaded', () => {
    const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;
    const repoContentsElement = document.getElementById('repo-contents');
    const backButton = document.getElementById('back-button');
    const toggleLayoutButton = document.getElementById('toggle-layout');
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    const progressContainer = document.getElementById('progress-container');
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

                // Toggle back button visibility
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
                applyLayout();
            })
            .catch(error => console.error('Error fetching repo contents:', error));
    }

    // Function to apply the current layout
    function applyLayout() {
        repoContentsElement.className = `repo-contents ${isGridView ? 'grid' : 'list'}`;
    }

    // Function to handle the back navigation
    backButton.addEventListener('click', () => {
        const previousPath = history.pop();
        fetchRepoContents(previousPath);
    });

    // Toggle layout
    toggleLayoutButton.addEventListener('click', () => {
        isGridView = !isGridView;
        applyLayout(); // Apply layout changes
    });

    // Upload files
    uploadButton.addEventListener('click', () => {
        fileInput.click(); // Trigger the file input
    });

    fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
        if (files.length === 0) {
            alert('Please select a file or folder to upload.');
            return;
        }
        uploadFiles(files);
    });

    function uploadFiles(files) {
        progressContainer.style.display = 'block';
        uploadStatus.textContent = 'Uploading...';
        let totalSize = files.length;
        let uploadedCount = 0;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result.split(',')[1]; // Get base64 content
                const fileName = file.webkitRelativePath || file.name; // Use relative path for folders

                fetch(`${repoApiBaseUrl}/${fileName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileName, content }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Upload failed: ${response.statusText}`);
                    }
                    uploadedCount++;
                    updateProgress(uploadedCount, totalSize);
                })
                .catch(error => {
                    console.error('Error uploading file:', error);
                });
            };
            reader.readAsDataURL(file);
        });
    }

    function updateProgress(uploadedCount, totalSize) {
        const percentage = (uploadedCount / totalSize) * 100;
        progressBar.style.width = `${percentage}%`;
        uploadStatus.textContent = `Uploaded ${uploadedCount} of ${totalSize} files`;

        if (uploadedCount === totalSize) {
            uploadStatus.textContent = 'Upload complete!';
            // Optionally refresh the file list after upload
            fetchRepoContents(); 
        }
    }

    // Load the root of the repo
    fetchRepoContents();
});
