// Solo añadir este código al final del archivo app.js existente

// Funcionalidad del menú móvil
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

    // Añadir lazy loading a las imágenes existentes
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
        img.setAttribute('loading', 'lazy');
    });
});
