var API_URL = 'http://localhost:8000';

function checkAuth() {
    var token = localStorage.getItem('access_token');
    if (!token) {
        document.getElementById('loginPrompt').style.display = 'block';
        document.getElementById('profileContent').style.display = 'none';
        return;
    }

    showUserInfo();
    loadFavorites();
    loadProducts();
}

function showUserInfo() {
    fetchWithAuth(API_URL + '/auth/user/')
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        return response.json();
    })
    .then(function(user) {
        document.getElementById('username').textContent = user.username;
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('loginPrompt').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';
    })
    .catch(function(error) {
        console.error('Error:', error);
        logout();
    });
}

function loadFavorites() {
    document.getElementById('favoritesLoading').style.display = 'block';
    document.getElementById('favoritesGrid').innerHTML = '';
    document.getElementById('favoritesEmpty').style.display = 'none';

    fetchWithAuth(API_URL + '/favorites/')
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Failed to load favorites');
        }
        return response.json();
    })
    .then(function(favorites) {
        document.getElementById('favoritesLoading').style.display = 'none';
        document.getElementById('favoritesCount').textContent = favorites.length;

        if (favorites.length === 0) {
            document.getElementById('favoritesEmpty').style.display = 'block';
            return;
        }

        var grid = document.getElementById('favoritesGrid');
        for (var i = 0; i < favorites.length; i++) {
            var card = createFavoriteCard(favorites[i]);
            grid.appendChild(card);
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        document.getElementById('favoritesLoading').style.display = 'none';
    });
}

function createFavoriteCard(favorite) {
    var recipe = favorite.recipe;
    var card = document.createElement('div');
    card.className = 'recipe-card';

    var imageHTML = '<div class="recipe-card-image">🍽️</div>';
    if (recipe.image) {
        imageHTML = '<img src="' + recipe.image + '" alt="' + recipe.title + '" style="width:100%; height:220px; object-fit:cover;">';
    }

    card.innerHTML = imageHTML +
        '<div class="recipe-card-content">' +
        '<h3 class="recipe-card-title">' + recipe.title + '</h3>' +
        '<p class="recipe-card-description">' + (recipe.description || '') + '</p>' +
        '<div class="recipe-card-meta">' +
        '<div>⏱️ ' + (recipe.cooking_time || 'N/A') + ' min</div>' +
        '<div>⭐ ' + (recipe.rating || 0) + '</div>' +
        '</div>' +
        '<div style="margin-top:1rem; display:flex; gap:0.5rem;">' +
        '<button class="btn btn-secondary" style="flex:1;" onclick="viewRecipe(' + recipe.id + ')">View</button>' +
        '<button class="btn btn-primary" style="flex:1;" onclick="removeFavorite(' + favorite.id + ')">Remove ❤️</button>' +
        '</div>' +
        '</div>';

    return card;
}

function removeFavorite(favoriteId) {
    if (!confirm('Remove from favorites?')) {
        return;
    }

    fetchWithAuth(API_URL + '/favorites/' + favoriteId + '/', {
        method: 'DELETE'
    })
    .then(function(response) {
        if (response.ok) {
            loadFavorites();
        } else {
            alert('Failed to remove');
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        alert('Error');
    });
}

function viewRecipe(recipeId) {
    window.location.href = 'recipe-details.html?id=' + recipeId;
}

function loadProducts() {
    document.getElementById('productsLoading').style.display = 'block';
    document.getElementById('productsGrid').innerHTML = '';
    document.getElementById('productsEmpty').style.display = 'none';

    fetchWithAuth(API_URL + '/user-products/')
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        return response.json();
    })
    .then(function(products) {
        document.getElementById('productsLoading').style.display = 'none';
        document.getElementById('productsCount').textContent = products.length;

        if (products.length === 0) {
            document.getElementById('productsEmpty').style.display = 'block';
            return;
        }

        var grid = document.getElementById('productsGrid');
        for (var i = 0; i < products.length; i++) {
            var card = createProductCard(products[i]);
            grid.appendChild(card);
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        document.getElementById('productsLoading').style.display = 'none';
    });
}

function createProductCard(product) {
    var card = document.createElement('div');
    card.className = 'product-card';

    var name = product.ingredient ? product.ingredient.name : 'Unknown';
    var unit = product.ingredient && product.ingredient.unit ? product.ingredient.unit.name : '';

    card.innerHTML =
        '<div class="product-card-header">' +
        '<h3>' + name + '</h3>' +
        '<button class="btn-icon" onclick="deleteProduct(' + product.id + ')">🗑️</button>' +
        '</div>' +
        '<div class="product-card-body">' +
        '<div class="product-info">' +
        '<span class="product-label">Quantity:</span>' +
        '<span class="product-value">' + product.quantity + ' ' + unit + '</span>' +
        '</div>' +
        '<div class="product-info">' +
        '<span class="product-label">Expires:</span>' +
        '<span class="product-value">' + (product.expiration_date || 'No date') + '</span>' +
        '</div>' +
        '</div>';

    return card;
}

function deleteProduct(productId) {
    if (!confirm('Delete this product?')) {
        return;
    }

    fetchWithAuth(API_URL + '/user-products/' + productId + '/', {
        method: 'DELETE'
    })
    .then(function(response) {
        if (response.ok) {
            loadProducts();
        } else {
            alert('Failed to delete');
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        alert('Error');
    });
}

function switchTab(tabName) {
    if (tabName === 'favorites') {
        document.getElementById('favoritesTab').classList.add('active');
        document.getElementById('productsTab').classList.remove('active');
    } else {
        document.getElementById('favoritesTab').classList.remove('active');
        document.getElementById('productsTab').classList.add('active');
    }
}

function showAddProductModal() {
    document.getElementById('addProductModal').style.display = 'flex';
    loadIngredientsForModal();
}

function closeAddProductModal() {
    document.getElementById('addProductModal').style.display = 'none';
    document.getElementById('addProductForm').reset();
}

function loadIngredientsForModal() {
    fetch(API_URL + '/ingredients/')
        .then(function(response) {
            return response.json();
        })
        .then(function(ingredients) {
            var select = document.getElementById('productIngredient');
            select.innerHTML = '<option value="">Select ingredient...</option>';

            for (var i = 0; i < ingredients.length; i++) {
                var option = document.createElement('option');
                option.value = ingredients[i].id;
                option.textContent = ingredients[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
        });
}

function addProduct(event) {
    event.preventDefault();

    var ingredientId = document.getElementById('productIngredient').value;
    var quantity = document.getElementById('productQuantity').value;
    var expiration = document.getElementById('productExpiration').value;

    var data = {
        ingredient_id: parseInt(ingredientId),
        quantity: parseFloat(quantity)
    };

    if (expiration) {
        data.expiration_date = expiration;
    }

    fetchWithAuth(API_URL + '/user-products/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(function(response) {
        if (response.ok) {
            closeAddProductModal();
            loadProducts();
        } else {
            alert('Error adding product');
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        alert('Error');
    });
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = 'index.html';
}

function showLoginModal() {
    document.getElementById('authModal').style.display = 'flex';
}

window.onload = function() {
    initAuth();
    checkAuth();

    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('addProductForm').onsubmit = addProduct;
};
