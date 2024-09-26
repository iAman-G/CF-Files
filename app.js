document.addEventListener('DOMContentLoaded', () => {
    const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;  // Cloudflare Worker URL
    const repoContentsElement = document.getElementById('repo-contents');
    const backButton = document.getElementById('back-button');
    const toggleLayoutButton = document.getElementById('toggle-layout');
    const uploadButton = document.getElementById('upload-button');
    const fileUploadInput = document.getElementById('file-upload');
    let history = [];  // To keep track of navigation history
    let isGridView = false;  // Track current layout state

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
                    default: return 'insert_drive_file';  // Default file icon
                }
            default: return 'insert_drive_file';  // Default file icon
        }
    }

    // Function to fetch and display repo contents
    function fetchRepoContents(path = '') {
        const headers = new Headers();

        fetch(repoApiBaseUrl + path, { headers })
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
                    backButton.style.display = 'block'; // Show back button if in subdirectory
                } else {
                    backButton.style.display = 'none'; // Hide back button if in root
                }

                if (Array.isArray(data)) {
                    // Display files and directories
                    data.forEach(item => {
                        const element = document.createElement('a');
                        element.textContent = item.name;
                        element.className = `repo-item ${item.type === 'dir' ? 'folder' : 'file'}`;

                        // Add icons based on type
                        const icon = document.createElement('i');
                        icon.className = `material-icons icon`;
                        icon.textContent = getIcon(item.type, item.name);
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
                        }

                        repoContentsElement.appendChild(element);
                    });
                } else {
                    console.error('Unexpected API response:', data);
                }
            })
            .catch(error => console.error('Error fetching repo contents:', error));
    }

    // Function to handle file uploads
    async function handleFileUpload(file) {
        const path = ''; // Set the appropriate path where the file should be uploaded
        const reader = new FileReader();

        reader.onload = async () => {
            const content = reader.result.split(',')[1]; // Base64 content
            const fileName = file.name;

            const response = await fetch(repoApiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: fileName,
                    content: content,
                }),
            });

            if (response.ok) {
                console.log('File uploaded successfully');
                fetchRepoContents(path); // Refresh the file list after upload
            } else {
                console.error('Upload failed:', await response.text());
            }
        };

        reader.readAsDataURL(file);
    }

    // Add event listener to the upload button
    uploadButton.addEventListener('click', () => {
        const file = fileUploadInput.files[0];
        if (file) {
            handleFileUpload(file);
        } else {
            alert('Please select a file to upload.');
        }
    });

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
        toggleLayoutButton.innerHTML = `<i class="material-icons"> ${isGridView ? 'view_list' : 'view_module'}</i>`;  // Update button icon
    });

    // Load the root of the repo
    fetchRepoContents();
});
