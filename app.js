document.addEventListener('DOMContentLoaded', () => {
    const repoApiBaseUrl = `https://cf-filesb.iaman.workers.dev/`;
    const repoContentsElement = document.getElementById('repo-contents');
    const backButton = document.getElementById('back-button');
    const toggleLayoutButton = document.getElementById('toggle-layout');
    const uploadButton = document.getElementById('upload-button');
    const fileUploadInput = document.getElementById('file-upload');
    let history = [];
    let isGridView = false;

    function getIcon(type, name) {
        const extension = name.split('.').pop().toLowerCase();
        switch (type) {
            case 'dir': return 'folder';
            case 'file':
                if (['jpg', 'jpeg', 'png'].includes(extension)) return 'image';
                if (['pdf'].includes(extension)) return 'picture_as_pdf';
                if (['txt'].includes(extension)) return 'text_format';
                return 'insert_drive_file';
            default: return 'insert_drive_file';
        }
    }

    function fetchRepoContents(path = '') {
        fetch(repoApiBaseUrl + path)
            .then(response => {
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                return response.json();
            })
            .then(data => {
                repoContentsElement.innerHTML = '';
                backButton.style.display = path ? 'block' : 'none';

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
            })
            .catch(error => console.error('Error fetching repo contents:', error));
    }

async function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = async () => {
        const content = reader.result.split(',')[1]; // Base64 content
        const fileName = file.name;

        const response = await fetch(repoApiBaseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName, content }),
        });

        if (response.ok) {
            fetchRepoContents(''); // Refresh the file list after upload
        } else {
            console.error('Upload failed:', await response.text());
        }
    };

    reader.readAsDataURL(file);
}


    uploadButton.addEventListener('click', () => {
        const file = fileUploadInput.files[0];
        if (file) {
            handleFileUpload(file);
        } else {
            alert('Please select a file to upload.');
        }
    });

    backButton.addEventListener('click', () => {
        const previousPath = history.pop();
        fetchRepoContents(previousPath);
    });

    toggleLayoutButton.addEventListener('click', () => {
        isGridView = !isGridView;
        repoContentsElement.className = `repo-contents ${isGridView ? 'grid' : 'list'}`;
        toggleLayoutButton.innerHTML = `<i class="material-icons">${isGridView ? 'view_list' : 'view_module'}</i>`;
    });

    fetchRepoContents(); // Load the root of the repo
});
