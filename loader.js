let isLoaderRemoved = false;

function createLoader() {
    const loader = document.createElement("div");
    loader.classList.add('loader');
    document.body.appendChild(loader);
    isLoaderRemoved = false;
}

function removeLoader() {
    if (isLoaderRemoved) return;
    const loader = document.querySelector('.loader');
    loader.classList.add('loader-hidden');
    loader.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'visibility') {
            document.body.removeChild(loader);
        }
    });
    isLoaderRemoved = true;
}