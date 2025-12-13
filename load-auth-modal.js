(function() {
    fetch('auth-modal.html')
        .then(function(response) {
            return response.text();
        })
        .then(function(html) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.trim();

            var modalElement = null;
            for (var i = 0; i < tempDiv.childNodes.length; i++) {
                if (tempDiv.childNodes[i].nodeType === 1) {
                    modalElement = tempDiv.childNodes[i];
                    break;
                }
            }

            if (modalElement) {
                document.body.appendChild(modalElement);

                if (typeof initAuth === 'function') {
                    initAuth();
                }
            }
        })
        .catch(function(error) {
            console.error('Error loading auth modal:', error);
        });
})();
