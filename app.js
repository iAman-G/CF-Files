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
                repoContentsElement.innerHTML = '';

                backButton.style.display = path ? 'block' : 'none';

                if (Array.isArray(data)) {
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
                }
            })
            .catch(error => console.error('Error fetching repo contents:', error));
    }

    // Function to handle file uploads
    async function handleFileUpload(file) {
        const reader = new FileReader();

        reader.onload = async () => {
            const content = reader.result.split(',')[1]; // Get Base64 content
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
                fetchRepoContents(''); // Refresh the file list after upload
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

    // Function to handle back navigation
    function goBack() {
        const previousPath = history.pop();
        fetchRepoContents(previousPath);
    }

    backButton.addEventListener('click', goBack);
    toggleLayoutButton.addEventListener('click', () => {
        isGridView = !isGridView;
        repoContentsElement.className = `repo-contents ${isGridView ? 'grid' : 'list'}`;
        toggleLayoutButton.innerHTML = `<i class="material-icons">${isGridView ? 'view_list' : 'view_module'}</i>`;
    });

    // Load the root of the repo
    fetchRepoContents();
});
