// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDG1wZMBobltVFJ1SR_mDbt8INiw3ZxVdQ",
    projectId: "mupho-ee0c0",
    authDomain: "mupho-ee0c0.firebaseapp.com",
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

// Iniciar
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';
        loadPosts();
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('uploadSection').style.display = 'none';
    }
});

document.getElementById('loginButton').addEventListener('click', () => {
    auth.signInWithPopup(provider);
});

document.getElementById('logout').addEventListener('click', () => {
    auth.signOut();
});
