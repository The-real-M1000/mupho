// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDG1wZMBobltVFJ1SR_mDbt8INiw3ZxVdQ",
    authDomain: "mupho-ee0c0.firebaseapp.com",
    projectId: "mupho-ee0c0",
    databaseURL: "https://mupho-ee0c0-default-rtdb.firebaseio.com"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

// Variables globales
let currentPhotoUrl = null;
let currentAudioUrl = null;
let currentUser = null;

// Elementos DOM
const modal = document.getElementById('uploadModal');
const createPostButton = document.getElementById('createPost');
const closeModal = document.querySelector('.close-modal');
const publishButton = document.getElementById('publishPost');
const uploadProgress = document.querySelector('.upload-progress');

// Event Listeners para el modal
createPostButton.addEventListener('click', () => {
    modal.style.display = 'flex';
    resetUploadForm();
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Funciones de utilidad
function resetUploadForm() {
    currentPhotoUrl = null;
    currentAudioUrl = null;
    document.getElementById('postTitle').value = '';
    document.getElementById('preview').innerHTML = '';
    publishButton.disabled = true;
    uploadProgress.style.display = 'none';
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.style.display = 'block';
    errorMessage.textContent = message;
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Configuración de Cloudinary
const cloudinaryConfig = {
    cloudName: 'ddmi89zwa',
    uploadPreset: 'mupho_preset',
    folder: 'mupho'
};

// Widgets de Cloudinary
const photoWidget = cloudinary.createUploadWidget(
    {
        ...cloudinaryConfig,
        sources: ['local', 'camera'],
        maxFiles: 1,
        maxFileSize: 5000000,
        acceptedFiles: 'image/*'
    },
    handleUpload
);

const audioWidget = cloudinary.createUploadWidget(
    {
        ...cloudinaryConfig,
        sources: ['local'],
        maxFiles: 1,
        maxFileSize: 10000000,
        acceptedFiles: 'audio/*'
    },
    handleUpload
);

document.getElementById('uploadPhoto').addEventListener('click', () => {
    photoWidget.open();
});

document.getElementById('uploadAudio').addEventListener('click', () => {
    audioWidget.open();
});

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
            document.getElementById('preview').innerHTML = `<img src="${url}" style="max-width: 300px;">`;
        } else if (result.info.resource_type === 'video') {
            currentAudioUrl = url;
            uploadProgress.textContent = 'Audio subido correctamente';
            document.getElementById('preview').innerHTML += `<audio controls src="${url}"></audio>`;
        }

        if (currentPhotoUrl && currentAudioUrl) {
            publishButton.disabled = false;
            uploadProgress.textContent = '¡Listo para publicar!';
        }
    }
}

// Funcionalidad de inicio de sesión
document.getElementById('loginButton').addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Usuario autenticado:", result.user);
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error);
            showError("Error al iniciar sesión: " + error.message);
        });
});

// Manejador de estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('userInfo').innerHTML = `
            <img src="${user.photoURL}" alt="Usuario">
            <span>Bienvenido, ${user.displayName}</span>
        `;
        loadPosts();
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('userInfo').innerHTML = '';
    }
});

// Funcionalidad de likes
function handleLike(postId) {
    if (!currentUser) {
        showError('Debes iniciar sesión para dar like');
        return;
    }

    const postRef = database.ref(`posts/${postId}/likes/${currentUser.uid}`);
    postRef.once('value', snapshot => {
        if (snapshot.exists()) {
            postRef.remove(); // Quitar like
        } else {
            postRef.set(true); // Añadir like
        }
    });
}

// Funcionalidad de comentarios
function handleComment(postId, comment) {
    if (!currentUser) {
        showError('Debes iniciar sesión para comentar');
        return;
    }

    const commentData = {
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        comment: comment,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    database.ref(`posts/${postId}/comments`).push(commentData);
}

// Cargar posts
function loadPosts() {
    const postsRef = database.ref('posts');
    postsRef.on('value', snapshot => {
        const postsContainer = document.getElementById('posts');
        postsContainer.innerHTML = '';

        snapshot.forEach(childSnapshot => {
            const post = childSnapshot.val();
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${post.userPhoto}" alt="${post.userName}">
                    <div>
                        <div>${post.userName}</div>
                        <div class="post-date">${new Date(post.timestamp).toLocaleString()}</div>
                    </div>
                </div>
                <div class="post-title">${post.title}</div>
                <img src="${post.photoUrl}" alt="${post.title}">
                <audio controls src="${post.audioUrl}"></audio>
                <button class="like-button"><i class="fas fa-heart"></i> Like</button>
                <div class="comments">
                    <input type="text" class="comment-input" placeholder="Añade un comentario...">
                    <button class="comment-button">Comentar</button>
                    <div class="comment-list"></div>
                </div>
            `;
            postsContainer.appendChild(postElement);

            // Añadir event listeners para likes y comentarios
            const likeButton = postElement.querySelector('.like-button');
            likeButton.addEventListener('click', () => handleLike(childSnapshot.key));

            const commentButton = postElement.querySelector('.comment-button');
            commentButton.addEventListener('click', () => {
                const commentInput = postElement.querySelector('.comment-input');
                const comment = commentInput.value.trim();
                if (comment) {
                    handleComment(childSnapshot.key, comment);
                    commentInput.value = '';
                }
            });
        });
    });
}

// Publicar post
publishButton.addEventListener('click', () => {
    const title = document.getElementById('postTitle').value.trim();
    if (!title) {
        showError('Por favor, añade un título a tu publicación');
        return;
    }

    if (currentPhotoUrl && currentAudioUrl) {
        const post = {
            title: title,
            photoUrl: currentPhotoUrl,
            audioUrl: currentAudioUrl,
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userPhoto: currentUser.photoURL,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        database.ref('posts').push(post)
            .then(() => {
                modal.style.display = 'none';
                resetUploadForm();
            })
            .catch(error => {
                showError('Error al publicar: ' + error.message);
            });
    }
});
