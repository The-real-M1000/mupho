// Mantener la configuración original de Firebase y Cloudinary

// Añadir funcionalidad del menú móvil
document.addEventListener('DOMContentLoaded', () => {
    // Crear botón del menú móvil
    const mobileButton = document.createElement('button');
    mobileButton.className = 'mobile-menu-button';
    mobileButton.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(mobileButton);

    // Toggle sidebar
    mobileButton.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // Cerrar sidebar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar') && 
            !e.target.closest('.mobile-menu-button')) {
            document.querySelector('.sidebar').classList.remove('active');
        }
    });
});

// Mejorar la función loadPosts para manejar imágenes
function loadPosts() {
    const postsRef = database.ref('posts');
    postsRef.on('value', (snapshot) => {
        const postsContainer = document.getElementById('posts');
        postsContainer.innerHTML = '';
        
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            posts.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        posts.sort((a, b) => b.timestamp - a.timestamp);

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            
            // Crear elemento de imagen con lazy loading y placeholder
            const imgElement = new Image();
            imgElement.src = post.photoUrl;
            imgElement.alt = post.title;
            imgElement.loading = 'lazy';
            imgElement.className = 'loading';

            imgElement.onload = () => {
                imgElement.classList.remove('loading');
            };

            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${post.userPhoto}" alt="${post.userName}" loading="lazy">
                    <div>
                        <div class="post-user">${post.userName}</div>
                        <div class="post-date">${formatDate(post.timestamp)}</div>
                    </div>
                </div>
                <div class="post-title">${post.title}</div>
            `;

            // Añadir imagen
            postElement.appendChild(imgElement);

            // Añadir reproductor de audio
            const audioElement = document.createElement('audio');
            audioElement.controls = true;
            audioElement.src = post.audioUrl;
            postElement.appendChild(audioElement);

            postsContainer.appendChild(postElement);
        });
    });
}

// Función para formatear fechas
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const hours = Math.floor(diffTime / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diffTime / (1000 * 60));
            return `hace ${minutes} minutos`;
        }
        return `hace ${hours} horas`;
    } else if (diffDays === 1) {
        return 'ayer';
    } else if (diffDays < 7) {
        return `hace ${diffDays} días`;
    } else {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Mejorar el manejo de la subida de archivos
function handleUpload(error, result) {
    if (error) {
        showError('Error al subir el archivo: ' + error.message);
        return;
    }

    if (result.event === "success") {
        const url = result.info.secure_url;
        uploadProgress.style.display = 'block';
        
        if (result.info.resource_type === 'image') {
            currentPhotoUrl = url;
            uploadProgress.textContent = 'Foto subida correctamente';
            
            const imgPreview = new Image();
            imgPreview.src = url;
            imgPreview.onload = () => {
                document.getElementById('preview').innerHTML = '';
                document.getElementById('preview').appendChild(imgPreview);
            };
        } else if (result.info.resource_type === 'video') {
            currentAudioUrl = url;
            uploadProgress.textContent = 'Audio subido correctamente';
            
            const audioPreview = document.createElement('audio');
            audioPreview.controls = true;
            audioPreview.src = url;
            document.getElementById('preview').appendChild(audioPreview);
        }
        
        publishButton.disabled = !(currentPhotoUrl && currentAudioUrl);
        if (publishButton.disabled === false) {
            uploadProgress.textContent = '¡Listo para publicar!';
        }
    }
}

// Añadir validación al título del post
document.getElementById('postTitle').addEventListener('input', (e) => {
    const title = e.target.value.trim();
    publishButton.disabled = !(title && currentPhotoUrl && currentAudioUrl);
});

// Mejorar el manejo de errores
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'block';
    errorMessage.textContent = message;
    errorMessage.classList.add('fade-in');
    
    setTimeout(() => {
        errorMessage.classList.remove('fade-in');
        errorMessage.style.display = 'none';
    }, 5000);
}
    });
}
