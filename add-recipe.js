var API_URL = 'http://localhost:8000';
var recipeIngredients = [];
var editingRecipeId = null;

function checkAuth() {
    var token = localStorage.getItem('access_token');
    if (!token) {
        document.getElementById('loginPrompt').style.display = 'block';
        document.getElementById('addRecipeContent').style.display = 'none';
        return;
    }

    document.getElementById('loginPrompt').style.display = 'none';
    document.getElementById('addRecipeContent').style.display = 'block';
    loadFormData();

    var urlParams = new URLSearchParams(window.location.search);
    editingRecipeId = urlParams.get('edit');
    if (editingRecipeId) {
        loadRecipeForEditing(editingRecipeId);
        document.querySelector('h1').textContent = 'Edit Recipe';
        document.querySelector('button[type="submit"]').textContent = 'Update Recipe';
    }
}

function loadFormData() {
    loadCategories();
    loadCuisines();
    loadComplexities();
    loadIngredients();
    loadUnits();
}

function loadRecipeForEditing(recipeId) {
    console.log('Loading recipe for editing:', recipeId);
    fetchWithAuth(API_URL + '/recipes/' + recipeId + '/')
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Failed to load recipe');
        }
        return response.json();
    })
    .then(function(recipe) {
        console.log('Recipe loaded:', recipe);

        document.getElementById('title').value = recipe.title || '';
        document.getElementById('description').value = recipe.description || '';
        document.getElementById('instructions').value = recipe.instructions || '';
        document.getElementById('cookingTime').value = recipe.cooking_time || '';
        document.getElementById('servings').value = recipe.servings || '';
        document.getElementById('rating').value = recipe.rating || 0;

        setTimeout(function() {
            if (recipe.category) {
                document.getElementById('category').value = recipe.category.id;
            }
            if (recipe.cuisine) {
                document.getElementById('cuisine').value = recipe.cuisine.id;
            }
            if (recipe.complexity) {
                document.getElementById('complexity').value = recipe.complexity.id;
            }
        }, 500);

        if (recipe.ingredients && recipe.ingredients.length > 0) {
            recipeIngredients = recipe.ingredients.map(function(ing) {
                return {
                    ingredient_id: ing.ingredient.id,
                    ingredient_name: ing.ingredient.name,
                    quantity: parseFloat(ing.quantity),
                    unit_id: ing.unit ? ing.unit.id : null,
                    unit_name: ing.unit ? ing.unit.name : ''
                };
            });
            updateIngredientsList();
        }
    })
    .catch(function(error) {
        console.error('Error loading recipe:', error);
        alert('Failed to load recipe for editing');
        window.location.href = 'profile.html';
    });
}

function loadCategories() {
    fetch(API_URL + '/categories/')
        .then(function(response) { return response.json(); })
        .then(function(categories) {
            var select = document.getElementById('category');
            for (var i = 0; i < categories.length; i++) {
                var option = document.createElement('option');
                option.value = categories[i].id;
                option.textContent = categories[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error loading categories:', error);
        });
}

function loadCuisines() {
    fetch(API_URL + '/cuisines/')
        .then(function(response) { return response.json(); })
        .then(function(cuisines) {
            var select = document.getElementById('cuisine');
            for (var i = 0; i < cuisines.length; i++) {
                var option = document.createElement('option');
                option.value = cuisines[i].id;
                option.textContent = cuisines[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error loading cuisines:', error);
        });
}

function loadComplexities() {
    fetch(API_URL + '/complexities/')
        .then(function(response) { return response.json(); })
        .then(function(complexities) {
            var select = document.getElementById('complexity');
            for (var i = 0; i < complexities.length; i++) {
                var option = document.createElement('option');
                option.value = complexities[i].id;
                option.textContent = complexities[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error loading complexities:', error);
        });
}

function loadIngredients() {
    fetch(API_URL + '/ingredients/')
        .then(function(response) { return response.json(); })
        .then(function(ingredients) {
            var select = document.getElementById('newIngredient');
            for (var i = 0; i < ingredients.length; i++) {
                var option = document.createElement('option');
                option.value = ingredients[i].id;
                option.textContent = ingredients[i].name;
                option.dataset.name = ingredients[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error loading ingredients:', error);
        });
}

function loadUnits() {
    fetch(API_URL + '/units/')
        .then(function(response) { return response.json(); })
        .then(function(units) {
            var select = document.getElementById('newUnit');
            for (var i = 0; i < units.length; i++) {
                var option = document.createElement('option');
                option.value = units[i].id;
                option.textContent = units[i].name;
                option.dataset.name = units[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error loading units:', error);
        });
}

function addIngredient() {
    var ingredientSelect = document.getElementById('newIngredient');
    var quantityInput = document.getElementById('newQuantity');
    var unitSelect = document.getElementById('newUnit');

    var ingredientId = ingredientSelect.value;
    var ingredientName = ingredientSelect.options[ingredientSelect.selectedIndex]?.dataset.name || '';
    var quantity = quantityInput.value;
    var unitId = unitSelect.value;
    var unitName = unitSelect.options[unitSelect.selectedIndex]?.dataset.name || '';

    if (!ingredientId || !quantity) {
        alert('Please select an ingredient and enter quantity');
        return;
    }

    for (var i = 0; i < recipeIngredients.length; i++) {
        if (recipeIngredients[i].ingredient_id === parseInt(ingredientId)) {
            alert('This ingredient is already added');
            return;
        }
    }

    var ingredient = {
        ingredient_id: parseInt(ingredientId),
        ingredient_name: ingredientName,
        quantity: parseFloat(quantity),
        unit_id: unitId ? parseInt(unitId) : null,
        unit_name: unitName
    };

    recipeIngredients.push(ingredient);
    updateIngredientsList();

    ingredientSelect.value = '';
    quantityInput.value = '';
    unitSelect.value = '';
}

function removeIngredient(index) {
    recipeIngredients.splice(index, 1);
    updateIngredientsList();
}

function updateIngredientsList() {
    var list = document.getElementById('ingredientsList');

    if (recipeIngredients.length === 0) {
        list.innerHTML = '<p style="color: var(--text-light); font-style: italic;">No ingredients added yet</p>';
        return;
    }

    list.innerHTML = '';
    for (var i = 0; i < recipeIngredients.length; i++) {
        var item = document.createElement('div');
        item.className = 'ingredient-item';

        var unit = recipeIngredients[i].unit_name ? ' ' + recipeIngredients[i].unit_name : '';

        item.innerHTML =
            '<span>' + recipeIngredients[i].ingredient_name + ' - ' +
            recipeIngredients[i].quantity + unit + '</span>' +
            '<button type="button" class="btn-icon" onclick="removeIngredient(' + i + ')">🗑️</button>';

        list.appendChild(item);
    }
}

function submitRecipe(event) {
    event.preventDefault();

    var errorDiv = document.getElementById('recipeError');
    errorDiv.style.display = 'none';

    var title = document.getElementById('title').value.trim();
    var description = document.getElementById('description').value.trim();
    var instructions = document.getElementById('instructions').value.trim();
    var cookingTime = document.getElementById('cookingTime').value;
    var servings = document.getElementById('servings').value;
    var rating = document.getElementById('rating').value;
    var categoryId = document.getElementById('category').value;
    var cuisineId = document.getElementById('cuisine').value;
    var complexityId = document.getElementById('complexity').value;

    if (!title || !instructions) {
        errorDiv.textContent = 'Please fill in all required fields';
        errorDiv.style.display = 'block';
        return;
    }

    var recipeData = {
        title: title,
        description: description,
        instructions: instructions,
        rating: rating ? parseFloat(rating) : 0.0
    };

    if (cookingTime) recipeData.cooking_time = parseInt(cookingTime);
    if (servings) recipeData.servings = parseInt(servings);
    if (categoryId) recipeData.category_id = parseInt(categoryId);
    if (cuisineId) recipeData.cuisine_id = parseInt(cuisineId);
    if (complexityId) recipeData.complexity_id = parseInt(complexityId);

    if (editingRecipeId) {
        fetchWithAuth(API_URL + '/auth/user/')
        .then(function(response) {
            return response.json();
        })
        .then(function(user) {
            recipeData.author = user.id;

            return fetchWithAuth(API_URL + '/recipes/' + editingRecipeId + '/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipeData)
            });
        })
        .then(function(response) {
            if (!response.ok) {
                return response.json().then(function(err) {
                    throw new Error(err.error || JSON.stringify(err));
                });
            }
            return response.json();
        })
        .then(function(recipe) {
            console.log('Recipe updated:', recipe);
            alert('Recipe updated successfully!');
            window.location.href = 'profile.html';
        })
        .catch(function(error) {
            console.error('Error:', error);
            errorDiv.textContent = 'Error updating recipe: ' + error.message;
            errorDiv.style.display = 'block';
        });
    } else {
        fetchWithAuth(API_URL + '/auth/user/')
        .then(function(response) {
            return response.json();
        })
        .then(function(user) {
            recipeData.author = user.id;

            return fetchWithAuth(API_URL + '/recipes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipeData)
            });
        })
        .then(function(response) {
            if (!response.ok) {
                return response.json().then(function(err) {
                    throw new Error(JSON.stringify(err));
                });
            }
            return response.json();
        })
        .then(function(recipe) {
            console.log('Recipe created:', recipe);

            if (recipeIngredients.length > 0) {
                return addIngredientsToRecipe(recipe.id);
            }
            return recipe;
        })
        .then(function() {
            alert('Recipe created successfully!');
            window.location.href = 'profile.html';
        })
        .catch(function(error) {
            console.error('Error:', error);
            errorDiv.textContent = 'Error creating recipe: ' + error.message;
            errorDiv.style.display = 'block';
        });
    }
}

function addIngredientsToRecipe(recipeId) {
    var promises = [];

    for (var i = 0; i < recipeIngredients.length; i++) {
        var ingredientData = {
            ingredient_id: recipeIngredients[i].ingredient_id,
            quantity: recipeIngredients[i].quantity
        };

        if (recipeIngredients[i].unit_id) {
            ingredientData.unit_id = recipeIngredients[i].unit_id;
        }

        var promise = fetchWithAuth(API_URL + '/recipes/' + recipeId + '/ingredients/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ingredientData)
        });

        promises.push(promise);
    }

    return Promise.all(promises);
}

window.onload = function() {
    checkAuth();
    document.getElementById('addRecipeForm').onsubmit = submitRecipe;
    updateIngredientsList();
};
