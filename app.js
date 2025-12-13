var API_URL = 'http://localhost:8000';

var currentFilters = {
    category: '',
    cuisine: '',
    complexity: '',
    search: ''
};

var currentPage = 1;
var nextPageUrl = null;
var previousPageUrl = null;

function loadRecipes() {
    console.log('loadRecipes called, page:', currentPage);

    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('recipesGrid').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';

    var url = API_URL + '/recipes/?limit=6&offset=' + (currentPage - 1) * 6;

    if (currentFilters.category) url += '&category=' + currentFilters.category;
    if (currentFilters.cuisine) url += '&cuisine=' + currentFilters.cuisine;
    if (currentFilters.complexity) url += '&complexity=' + currentFilters.complexity;
    if (currentFilters.search) url += '&search=' + currentFilters.search;

    console.log('Fetching from:', url);

    fetch(url)
        .then(function(response) {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(function(data) {
            console.log('Data received:', data);
            console.log('Results count:', data.results ? data.results.length : 0);

            document.getElementById('loadingSpinner').style.display = 'none';

            if (data.results && data.results.length > 0) {
                console.log('Showing recipes');
                showRecipes(data.results);
                updatePagination(data);
            } else {
                console.log('No recipes found, showing empty state');
                document.getElementById('emptyState').style.display = 'block';
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
        });
}

function showRecipes(recipes) {
    console.log('showRecipes called with', recipes.length, 'recipes');
    var grid = document.getElementById('recipesGrid');
    console.log('Grid element:', grid);

    grid.style.display = 'grid';
    grid.innerHTML = '';

    for (var i = 0; i < recipes.length; i++) {
        var recipe = recipes[i];
        console.log('Creating card for:', recipe.title);
        var card = createRecipeCard(recipe);
        grid.appendChild(card);
    }

    console.log('All cards added to grid');
}

function createRecipeCard(recipe) {
    var card = document.createElement('div');
    card.className = 'recipe-card';
    card.onclick = function() {
        window.location.href = 'recipe-details.html?id=' + recipe.id;
    };

    var imageHTML = '';
    if (recipe.image) {
        imageHTML = '<img src="' + recipe.image + '" alt="' + recipe.title + '" class="recipe-card-image">';
    } else {
        imageHTML = '<div class="recipe-card-image">🍽️</div>';
    }

    var description = recipe.description || 'Description not available';
    var time = recipe.cooking_time || 'N/A';
    var rating = recipe.rating ? recipe.rating.toFixed(1) : '0.0';
    var category = recipe.category ? recipe.category.name : '';

    card.innerHTML =
        imageHTML +
        '<div class="recipe-card-content">' +
            '<h3 class="recipe-card-title">' + recipe.title + '</h3>' +
            '<p class="recipe-card-description">' + description + '</p>' +
            '<div class="recipe-card-meta">' +
                '<div class="recipe-card-meta-item">⏱️ ' + time + ' min</div>' +
                '<div class="recipe-card-rating">⭐ ' + rating + '</div>' +
            '</div>' +
            '<div class="recipe-card-meta" style="margin-top: 0.5rem;">' +
                (category ? '<span class="recipe-card-category">' + category + '</span>' : '') +
            '</div>' +
        '</div>';

    return card;
}

function loadRandomRecipe() {
    fetch(API_URL + '/recipes/random/')
        .then(function(response) {
            return response.json();
        })
        .then(function(recipe) {
            displayRandomRecipe(recipe);
        })
        .catch(function(error) {
            console.error('Error:', error);
            alert('Failed to load recipe');
        });
}

function loadRandomRecipeWithFilters(formFilters) {
    var url = API_URL + '/recipes/random-with-wishes/?';
    var params = [];

    if (formFilters.category) params.push('category=' + formFilters.category);
    if (formFilters.cuisine) params.push('cuisine=' + formFilters.cuisine);
    if (formFilters.complexity) params.push('complexity=' + formFilters.complexity);
    if (formFilters.maxTime) params.push('max_time=' + formFilters.maxTime);
    if (formFilters.servings) params.push('servings=' + formFilters.servings);

    url += params.join('&');

    console.log('Fetching random recipe with filters from:', url);

    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.error) {
                alert(data.error + '\nTry adjusting your filters.');
                return;
            }

            closeFiltersModal();
            closeRandomChoiceModal();
            displayRandomRecipe(data.recipe, data.filters_info);
        })
        .catch(function(error) {
            console.error('Error:', error);
            alert('Failed to load recipe with filters');
        });
}

function showRandomChoiceModal() {
    document.getElementById('randomChoiceModal').style.display = 'flex';
}

function closeRandomChoiceModal() {
    document.getElementById('randomChoiceModal').style.display = 'none';
}

function showFiltersModal() {
    closeRandomChoiceModal();
    document.getElementById('filtersModal').style.display = 'flex';
}

function closeFiltersModal() {
    document.getElementById('filtersModal').style.display = 'none';
}

function loadModalFilters() {
    fetch(API_URL + '/categories/')
        .then(function(response) {
            return response.json();
        })
        .then(function(categories) {
            var select = document.getElementById('modalCategoryFilter');
            select.innerHTML = '<option value="">All Categories</option>';
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

    fetch(API_URL + '/cuisines/')
        .then(function(response) {
            return response.json();
        })
        .then(function(cuisines) {
            var select = document.getElementById('modalCuisineFilter');
            select.innerHTML = '<option value="">All Cuisines</option>';
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

    fetch(API_URL + '/complexities/')
        .then(function(response) {
            return response.json();
        })
        .then(function(complexities) {
            var select = document.getElementById('modalComplexityFilter');
            select.innerHTML = '<option value="">All Levels</option>';
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

function displayRandomRecipe(recipe, filtersInfo) {
    document.getElementById('randomRecipeTitle').textContent = recipe.title;
    document.getElementById('randomRecipeDescription').textContent = recipe.description || 'Description not available';
    document.getElementById('randomRecipeTime').textContent = recipe.cooking_time || 'N/A';
    document.getElementById('randomRecipeRating').textContent = recipe.rating ? recipe.rating.toFixed(1) : '0.0';
    document.getElementById('randomRecipeCategory').textContent = recipe.category ? recipe.category.name : 'N/A';

    var imageElement = document.getElementById('randomRecipeImage');
    if (recipe.image) {
        imageElement.src = recipe.image;
        imageElement.style.display = 'block';
    } else {
        imageElement.style.display = 'none';
    }

    if (filtersInfo && filtersInfo.total_available) {
        var infoText = 'Found from ' + filtersInfo.total_available + ' matching recipes';
        var filterInfoElement = document.getElementById('randomRecipeFilterInfo');
        if (filterInfoElement) {
            filterInfoElement.textContent = infoText;
            filterInfoElement.style.display = 'block';
        }
    } else {
        var filterInfoElement = document.getElementById('randomRecipeFilterInfo');
        if (filterInfoElement) {
            filterInfoElement.style.display = 'none';
        }
    }

    document.getElementById('viewRandomRecipeBtn').onclick = function() {
        window.location.href = 'recipe-details.html?id=' + recipe.id;
    };

    document.getElementById('randomRecipeDisplay').style.display = 'flex';
}

function closeRandomRecipeDisplay() {
    document.getElementById('randomRecipeDisplay').style.display = 'none';
}

function loadCategories() {
    fetch(API_URL + '/categories/')
        .then(function(response) {
            return response.json();
        })
        .then(function(categories) {
            var select = document.getElementById('categoryFilter');
            for (var i = 0; i < categories.length; i++) {
                var option = document.createElement('option');
                option.value = categories[i].id;
                option.textContent = categories[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
        });
}

function loadCuisines() {
    fetch(API_URL + '/cuisines/')
        .then(function(response) {
            return response.json();
        })
        .then(function(cuisines) {
            var select = document.getElementById('cuisineFilter');
            for (var i = 0; i < cuisines.length; i++) {
                var option = document.createElement('option');
                option.value = cuisines[i].id;
                option.textContent = cuisines[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
        });
}

function loadComplexities() {
    fetch(API_URL + '/complexities/')
        .then(function(response) {
            return response.json();
        })
        .then(function(complexities) {
            var select = document.getElementById('complexityFilter');
            for (var i = 0; i < complexities.length; i++) {
                var option = document.createElement('option');
                option.value = complexities[i].id;
                option.textContent = complexities[i].name;
                select.appendChild(option);
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
        });
}

function updatePagination(data) {
    document.getElementById('currentPage').textContent = currentPage;

    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');

    nextPageUrl = data.next;
    previousPageUrl = data.previous;

    prevBtn.disabled = !previousPageUrl;
    nextBtn.disabled = !nextPageUrl;
}

function previousPage() {
    if (previousPageUrl && currentPage > 1) {
        currentPage--;
        loadRecipes();
    }
}

function nextPage() {
    if (nextPageUrl) {
        currentPage++;
        loadRecipes();
    }
}

function applyFilters() {
    console.log('Applying filters:', currentFilters);
    currentPage = 1;
    loadRecipes();
}

var searchTimeout;
function searchRecipes() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function() {
        applyFilters();
    }, 500);
}

window.onload = function() {
    console.log('App initializing...');

    loadCategories();
    loadCuisines();
    loadComplexities();
    loadModalFilters();

    loadRecipes();

    document.getElementById('randomRecipeBtn').onclick = showRandomChoiceModal;

    document.getElementById('simpleRandomBtn').onclick = function() {
        closeRandomChoiceModal();
        loadRandomRecipe();
    };

    document.getElementById('showFiltersBtn').onclick = showFiltersModal;

    document.getElementById('closeChoiceModal').onclick = closeRandomChoiceModal;
    document.getElementById('randomChoiceModal').onclick = function(e) {
        if (e.target.id === 'randomChoiceModal') {
            closeRandomChoiceModal();
        }
    };

    document.getElementById('closeFiltersModal').onclick = closeFiltersModal;
    document.getElementById('filtersModal').onclick = function(e) {
        if (e.target.id === 'filtersModal') {
            closeFiltersModal();
        }
    };

    document.getElementById('randomFiltersForm').onsubmit = function(e) {
        e.preventDefault();

        var formFilters = {
            category: document.getElementById('modalCategoryFilter').value,
            cuisine: document.getElementById('modalCuisineFilter').value,
            complexity: document.getElementById('modalComplexityFilter').value,
            maxTime: document.getElementById('modalMaxTimeFilter').value,
            servings: document.getElementById('modalServingsFilter').value
        };

        loadRandomRecipeWithFilters(formFilters);
    };

    document.getElementById('closeRandomRecipe').onclick = closeRandomRecipeDisplay;
    document.getElementById('randomRecipeDisplay').onclick = function(e) {
        if (e.target.id === 'randomRecipeDisplay') {
            closeRandomRecipeDisplay();
        }
    };

    document.getElementById('categoryFilter').onchange = function() {
        currentFilters.category = this.value;
        applyFilters();
    };

    document.getElementById('cuisineFilter').onchange = function() {
        currentFilters.cuisine = this.value;
        applyFilters();
    };

    document.getElementById('complexityFilter').onchange = function() {
        currentFilters.complexity = this.value;
        applyFilters();
    };

    document.getElementById('searchInput').oninput = function() {
        currentFilters.search = this.value;
        searchRecipes();
    };

    document.getElementById('prevPage').onclick = previousPage;
    document.getElementById('nextPage').onclick = nextPage;

    console.log('App initialized!');
};
