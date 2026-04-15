//==========================================================================================
//                                    DOM Element Selectors
//==========================================================================================

let search = document.querySelector(".search");
let input = document.querySelector("input");
let h1 = document.querySelector("h1");
let movies_container = document.querySelector(".movies-container");
let nothing = document.querySelector(".nothing");
let displayMore = document.querySelector(".displayMore");
let showMyWatchlistBtn = document.querySelector("#showMyWatchlist");
let overlay = document.querySelector(".overlay");
let closeOverlayBtn = document.querySelector(".x");
let buttonUp = document.querySelector(".button");
let filter = document.querySelector(".filter");
let filterPanel = document.querySelector(".filter-panel");
let applyfilterbtn = document.querySelector(".apply-filter-btn");
let clearfilterbtn = document.querySelector(".clear-filter-btn");
let closePanel = document.querySelector(".closePanel");
let base_api_path = "http://127.0.0.1:8000";
let aiInput = document.querySelector("#ai-input");
let aiSend = document.querySelector("#ai-send");
let chatContent = document.querySelector("#chat-content");
let chatBox = document.querySelector("#chat-box");
let chatToggleBtn = document.querySelector("#chat-toggle-btn");
let aiShatWrabber = document.querySelector("#ai-chat-wrapper");
let loginBtn = document.querySelector("#loginBtn");
let logoutBtn = document.querySelector("#logoutBtn");

//==========================================================================================
//                                     Global Variables
//==========================================================================================
let page = 1;
let searchValue = "";
let totalResults = 0;

//==========================================================================================
//                                     Helper Functions
//==========================================================================================

// Function to add event listeners to "Details" buttons on movie cards
function addDetailsButtonListeners() {
  let buttons = document.querySelectorAll(".details-btn");
  buttons.forEach((button) => {
    if (button.getAttribute("data-details-listener-added") === "true") {
      return;
    }
    button.setAttribute("data-details-listener-added", "true");

    button.addEventListener("click", (e) => {
      let imdbId = e.target.dataset.imdbId;
      getMovieDetails(imdbId);
    });
  });
}

//function to refresh token if access token expired
async function refreshAccessToken(){
    let refreshToken = localStorage.getItem('refresh_token')

    if (!refreshToken) return false

    try{
        const response = await fetch(`${base_api_path}/api/token/refresh/` , {
            method : 'POST',
            headers : {
                "Content-Type": "application/json"
            },
            body : JSON.stringify({ refresh: refreshToken }) // تم التعديل هنا
        })

                            if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }

        if (response.ok){
            let data = await response.json()
            localStorage.setItem('access_token' , data.access)
            return true
        }else{
            return false
        }
    }catch (error) {
        console.error("Error refreshing token:", error);
        return false;
    }
}

// Function to add event listeners to favorite buttons (heart icons) on movie cards
function addFavListener() {
  let favButtons = document.querySelectorAll(".fav-btn");
  favButtons.forEach((btn) => {
    if (btn.getAttribute("data-listener-added") === "true") {
      return;
    }
    btn.setAttribute("data-listener-added", "true");

    btn.addEventListener("click", async (e) => {
      let token = localStorage.getItem('access_token')
      if (!token) {
          alert("Please Login or Register to add movies to your Watchlist!");
          window.location.href = "login.html"; 
          return;
      }

      let movieData = {
        imdb_id: btn.dataset.imdbId,
        title: btn.dataset.title,
        poster: btn.dataset.poster,
        year: btn.dataset.year
      };

      try{
        let response = await fetch(`${base_api_path}/api/Watchlist/toggle/` , {
          method : "POST" ,
          headers : {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          } , 
          body : JSON.stringify(movieData)
        })
                            if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }

        if (response.status === 401) {
          console.log("Access Token Expired! Trying to refresh...");
          
          const isRefreshed = await refreshAccessToken();
          
          if (isRefreshed) {
            token = localStorage.getItem("access_token");
            
            response = await fetch(`${base_api_path}/api/Watchlist/toggle/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body : JSON.stringify(movieData)
            });
                                if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }
          } else {
            alert("Your session has expired. Please login again.");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "login.html";
            return;
          }
        }

        const result = await response.json();
        
        if (response.ok){
          if (result.action === 'added'){
            btn.classList.add("active");
            AddRemoveMessage("Added", "TO", movieData.title);
          }else if(result.action === 'removed'){
            btn.classList.remove("active");
            AddRemoveMessage("Removed", "From", movieData.title);
            if (movies_container.dataset.mode === "watchlist") {
                  displayMyWatchlist();
              }
          }else {
            console.error("Error toggling watchlist:", result);
            alert("Session expired! Please login again.");
          }
        }
      }catch(error){
        console.error("Network Error:", error);
      }

    })
  });
}

function checkMoreItems(totalResults, currentPage) {
  if (currentPage * 10 < totalResults) {
    displayMore.style.display = "flex";
  } else {
    displayMore.style.display = "none";
  }
}

function saveSearchState() {
  localStorage.setItem("lastSearchValue", JSON.stringify(searchValue));
  localStorage.setItem("lastSearchPage", JSON.stringify(page));
}

function clearSearchState() {
  localStorage.removeItem("lastSearchValue");
  localStorage.removeItem("lastSearchPage");
}

function getMovieDetails(imdbId) {
  if (!imdbId) {
    console.log("No IMDb ID provided for movie details.");
    return;
  }

  let dataUrl = `${base_api_path}/api/details/?i=${imdbId}`;

  fetch(dataUrl)
    .then((response) => response.json())
    .then((movieDetails) => {
      console.log("Movie Details:", movieDetails);

      let poster = (movieDetails.Poster && movieDetails.Poster !== "N/A")
          ? movieDetails.Poster
          : "https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg";

      let modal = document.querySelector("#movie-details-modal");

      modal.querySelector("img").src = poster;
      modal.querySelector("img").onerror = function() {
        this.onerror = null;
        this.src = 'https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg';
      };

      modal.querySelector("h2").textContent = `${movieDetails.Title} (${movieDetails.Year})`;
      modal.querySelector(".dummy-rating-box").innerHTML = `
                <span>IMDb: ${movieDetails.imdbRating}</span>
                <span>Time: ${movieDetails.Runtime}</span>
                <span>Rated: ${movieDetails.Rated}</span>
            `;
      modal.querySelector(".dummy-plot").textContent = movieDetails.Plot;
      modal.querySelector(".dummy-other-details").innerHTML = `
                <p><strong>Genre:</strong> ${movieDetails.Genre}</p>
                <p><strong>Director:</strong> ${movieDetails.Director}</p>
                <p><strong>Actors:</strong> ${movieDetails.Actors}</p>
                <p><strong>Awards:</strong> ${movieDetails.Awards}</p>
            `;

      document.querySelector(".overlay").style.display = "block";
      document.querySelector("#movie-details-modal").classList.add("show-modal");
      modal.style.display = "flex"; 
    })
    .catch((error) => console.error("Error fetching movie details:", error));
}

async function getMovie(searchQuery, pageNumber) {
    let url = `${base_api_path}/api/search/?s=${searchQuery}&page=${pageNumber}`;

    try {
        const response = await fetch(url);
                            if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }
        const data = await response.json();

        let loadingcircle = document.querySelector(".loading");
        if (loadingcircle) {
            loadingcircle.style.display = "none";
        }

        totalResults = data.totalResults;

        let favorites = [];
        let token = localStorage.getItem('access_token');
        
        if (token) {
            try {
                let favResponse = await fetch(`${base_api_path}/api/Watchlist/`, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                
                if (favResponse.status === 401) {
                    const isRefreshed = await refreshAccessToken();
                    if (isRefreshed) {
                        token = localStorage.getItem("access_token");
                        favResponse = await fetch(`${base_api_path}/api/Watchlist/`, {
                            method: 'GET',
                            headers: {
                                "Authorization": `Bearer ${token}`
                            }
                        });
                                            if (favResponse.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }
                    }
                }
                
                if (favResponse.ok) {
                    let favData = await favResponse.json();
                    favorites = favData.results ? favData.results : favData; 
                }
            } catch (error) {
                console.error("Error fetching favorites for search comparison:", error);
            }
        }

        if (data.Search) {
            if (pageNumber === 1) {
                movies_container.innerHTML = "";
                movies_container.style.display = "grid";
            }
            nothing.style.display = "none";
            
            data.Search.forEach((film, index) => {
                let isFav = favorites.findIndex((f) => f.imdb_id === film.imdbID) !== -1;
                let activeClass = isFav ? "active" : "";

                let safePoster = (film.Poster && film.Poster !== "N/A") 
                    ? film.Poster 
                    : "https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg";

                const movieCard = document.createElement("div");
                movieCard.classList.add("movie-card");
                movieCard.style.setProperty("--delay", `${index * 0.1}s`);

                movieCard.innerHTML = `
                    <div class="fav-btn ${activeClass}"
                        data-imdb-id="${film.imdbID}"
                        data-title="${film.Title}"
                        data-poster="${safePoster}"
                        data-year="${film.Year}"
                        data-genre="N/A"
                        data-actors="N/A">
                        ♥
                    </div>
                    <img src="${safePoster}" loading="lazy" onerror="this.onerror=null; this.src='https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg';">                    <h3>${film.Title}</h3>
                    <div class="year">Year : ${film.Year}</div>
                    <button class="details-btn" data-imdb-id="${film.imdbID}">Details</button>
                `;
                movies_container.appendChild(movieCard);
            });

            addDetailsButtonListeners();
            addFavListener();
            checkMoreItems(totalResults, pageNumber);
            
        } else {
            if (pageNumber === 1) {
                nothing.textContent = "No movies found for this name.";
                nothing.style.display = `block`;
                movies_container.innerHTML = "";
                movies_container.style.display = "block";
            }
            displayMore.style.display = `none`;
        }
    } catch (error) {
        console.error("Error fetching movie data:", error);
        let loadingcircle = document.querySelector(".loading");
        if (loadingcircle) loadingcircle.style.display = "none";
        nothing.textContent = "Error fetching data. Please try again later.";
        nothing.style.display = `block`;
        displayMore.style.display = `none`;
        movies_container.innerHTML = "";
    }
}

async function displayMyWatchlist() {
  movies_container.innerHTML = "";
  nothing.style.display = `none`;
  displayMore.style.display = `none`;

  movies_container.dataset.mode = "watchlist";
  showMyWatchlistBtn.textContent = "Back to Search";

  let token = localStorage.getItem('access_token')

  if(!token){
    alert("Please Login or Register to add movies to your Watchlist!");
      window.location.href = "login.html"; 
      return;
  }

  try{
    let response = await fetch(`${base_api_path}/api/Watchlist/`, {
      method : 'GET',
      headers : {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
                        if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }
    
    if (response.status === 401) {
          console.log("Access Token Expired! Trying to refresh...");
          const isRefreshed = await refreshAccessToken();
          if (isRefreshed) {
            token = localStorage.getItem("access_token");
            response = await fetch(`${base_api_path}/api/Watchlist/`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
                                if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }
          } else {
            alert("Your session has expired. Please login again.");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "login.html";
            return;
          }
        }

    const data = await response.json() 
    const favorites = data.results ? data.results : data; 

    if (favorites.length === 0) {
      nothing.textContent = "Your Watchlist is empty. Add some movies!";
      nothing.style.display = `block`;
      return;
    }

    favorites.forEach((film, index) => {
      let safePoster = (film.poster && film.poster !== "N/A") 
          ? film.poster 
          : "https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg";  
      const movieCard = document.createElement("div");
      movieCard.classList.add("movie-card");
      movieCard.style.setProperty("--delay", `${index * 0.1}s`);
  
      movieCard.innerHTML = `
              <div class="fav-btn active"
                  data-imdb-id="${film.imdb_id}"
                  data-title="${film.title}"
                  data-poster="${safePoster}"
                  data-year="${film.year}"
                  data-genre="N/A"
                  data-actors="N/A">
                  ♥
              </div>
              <img src="${safePoster}" loading="lazy" onerror="this.onerror=null; this.src='https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg';">              <h3>${film.title}</h3>
              <div class="year">Year : ${film.year}</div>
              <button class="details-btn" data-imdb-id="${film.imdb_id}">Details</button>
          `;
      movies_container.appendChild(movieCard);
    });
    addDetailsButtonListeners();
    addFavListener();
  }catch (error) {
      console.error("Error fetching watchlist:", error);
      nothing.textContent = "Error loading Watchlist.";
      nothing.style.display = `block`;
  }
}

function AddRemoveMessage(atr, atr2, film) {
  let AddingAndREmovungFIlm = document.querySelector(".AddingAndREmovungFIlm");
  AddingAndREmovungFIlm.innerHTML = `
    You <span>${atr} ${film}</span> ${atr2} Your Favorites .. <span><button class="remove">✕</button></span>
  `;
  AddingAndREmovungFIlm.style.display = "flex";

  let Timer = setTimeout(() => {
    AddingAndREmovungFIlm.style.display = "none";
  }, 4000);
  document.querySelector(".remove").addEventListener("click", () => {
    clearTimeout(Timer);
    AddingAndREmovungFIlm.style.display = "none";
  });
}

search.addEventListener("click", () => {
  searchValue = input.value.trim();
  movies_container.innerHTML = ``;
  displayMore.style.display = `none`;
  nothing.style.display = `none`;

  if (!searchValue) {
    nothing.textContent = "🎬 No movies found — try searching for something !";
    nothing.style.display = `block`;
    input.focus();
    clearSearchState();
    return;
  } else {
    movies_container.innerHTML = `
            <div class="loading">
              <div class="cssload-dots">
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
                  <div class="cssload-dot"></div>
              </div>
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      <filter id="goo">
                          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="12" ></feGaussianBlur>
                          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" result="goo" ></feColorMatrix>
                      </filter>
                  </defs>
              </svg>
            </div>
      `;
    movies_container.dataset.mode = "search";
    page = 1;
    getMovie(searchValue, page);
    saveSearchState();
  }
});

input.addEventListener("keyup", (e) => {
  if (e.key === `Enter`) {
    search.click();
  }
});

let debounceTimer;
input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    search.click();
  }, 1000);
});

h1.addEventListener("click", () => {
  movies_container.innerHTML = ``;
  nothing.style.display = `none`;
  displayMore.style.display = `none`;
  input.value = "";
  input.focus();
  movies_container.dataset.mode = "initial";
  clearSearchState();
});

displayMore.addEventListener("click", () => {
  page++;
  getMovie(searchValue, page);
  saveSearchState();
});

if (showMyWatchlistBtn) {
  showMyWatchlistBtn.addEventListener("click", () => {
    if (movies_container.dataset.mode === "watchlist") {
      goBackToLastSearch();
    } else {
      saveSearchState();
      displayMyWatchlist();
    }
  });
}

closeOverlayBtn.addEventListener("click", () => {
  overlay.style.display = "none";
  document.querySelector("#movie-details-modal").classList.remove("show-modal");
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    overlay.style.display = "none";
    
    let modal = document.querySelector("#movie-details-modal");
    if(modal) modal.classList.remove("show-modal");
    
    let filterPanel = document.querySelector(".filter-panel");
    if(filterPanel) filterPanel.className = "filter-panel";
  }
});

function goBackToLastSearch() {
  const savedSearchValue = JSON.parse(localStorage.getItem("lastSearchValue"));
  const savedPage = JSON.parse(localStorage.getItem("lastSearchPage"));

  movies_container.innerHTML = "";
  nothing.style.display = "none";
  displayMore.style.display = "none";
  input.value = "";

  if (savedSearchValue && savedPage) {
    searchValue = savedSearchValue;
    page = savedPage;
    input.value = searchValue;
    movies_container.dataset.mode = "search";
    getMovie(searchValue, page);
  } else {
    movies_container.dataset.mode = "initial";
  }
  showMyWatchlistBtn.textContent = "My Watchlist";
  input.focus();
}
filter.addEventListener("click", () => {
    filterPanel.className = "filter-panel active"; 
    overlay.style.display = "block";
});

closePanel.addEventListener("click", () => {
    filterPanel.className = "filter-panel";
    overlay.style.display = "none";
});

overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
        filterPanel.className = "filter-panel";
        overlay.style.display = "none";
    }
});

function closeswich() {
  if (filterPanel.classList.contains("show-panel")) {
    filter.innerHTML = `
      <svg fill="#fff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
            Close
    `;
  } else {
    filter.innerHTML = `
      <svg fill="#fff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
            Filter
      
    `;
  }
}

applyfilterbtn.addEventListener("click", () => {
  let filterYear = document
    .querySelector("#filter-year")
    .value.trim()
    .toLowerCase();
  let filterGenre = document
    .querySelector("#filter-genre")
    .value.trim()
    .toLowerCase();
  let filterActor = document
    .querySelector("#filter-actor")
    .value.trim()
    .toLowerCase();
  let cardsForApply = document.querySelectorAll(".movie-card");

  let resultsFound = false;

  cardsForApply.forEach((card) => {
    let favbtn = card.querySelector(".fav-btn");
    let movieYear = favbtn.dataset.year.trim().toLowerCase();
    let movieGenre = favbtn.dataset.genre.trim().toLowerCase();
    let movieActors = favbtn.dataset.actors.trim().toLowerCase();
    let isMatch = true;
    if (filterYear && movieYear.indexOf(filterYear) === -1) {
      isMatch = false;
    }

    if (filterGenre && movieGenre.indexOf(filterGenre) === -1) {
      isMatch = false;
    }

    if (filterActor) {
      const movieActorList = movieActors
        .split(",")
        .map((actor) => actor.trim().toLowerCase());
      const filterActorWords = filterActor
        .split(" ")
        .map((word) => word.trim());

      let actorMatch = false;

      for (const filterWord of filterActorWords) {
        if (filterWord) {
          if (
            movieActorList.some((actorName) => actorName.includes(filterWord))
          ) {
            actorMatch = true;
            break;
          }
        }
      }

      if (!actorMatch) {
        isMatch = false;
      }
    }

    if (isMatch) {
      card.style.display = "flex";
      resultsFound = true;
    } else {
      card.style.display = "none";
    }
  });

  if (!resultsFound && (filterYear || filterGenre || filterActor)) {
    nothing.textContent = "No movies match your filter criteria.";
    nothing.style.display = "block";
    displayMore.style.display = "none";
  } else {
    nothing.style.display = "none";
  }
  closePanel.click();
});

clearfilterbtn.addEventListener("click", () => {
  document.querySelector("#filter-year").value = "";
  document.querySelector("#filter-genre").value = "";
  document.querySelector("#filter-actor").value = "";
  let cardsForclear = document.querySelectorAll(".movie-card");
  cardsForclear.forEach((card) => {
    card.style.display = "flex";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  input.focus();
  let savedSearchValue = JSON.parse(localStorage.getItem("lastSearchValue"));
  let savedPage = JSON.parse(localStorage.getItem("lastSearchPage"));

  if (savedPage && savedSearchValue) {
    searchValue = savedSearchValue;
    page = savedPage;
    input.value = searchValue;
    movies_container.dataset.mode = "search";
    getMovie(searchValue, page);
    showMyWatchlistBtn.textContent = "My Watchlist";
  } else {
    const suggestions = [
      "Marvel",
      "Avatar",
      "John Wick",
      "Harry Potter",
      "Batman",
      "Spider-Man",
      "Inception",
      "Interstellar",
      "Fast & Furious",
    ];

    const randomMovie =
      suggestions[Math.floor(Math.random() * suggestions.length)];

    nothing.style.display = "none";

    searchValue = randomMovie;
    movies_container.dataset.mode = "search";
    getMovie(randomMovie, 1);

    input.placeholder = `Suggested for you: ${randomMovie}...`;
  }
});

function after500() {
  if (window.scrollY >= 500) {
    buttonUp.style.display = "flex";
  } else {
    buttonUp.style.display = "none";
  }
}
window.addEventListener("scroll", after500);
after500();
buttonUp.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

const themeSwitch = document.querySelector(".lightandDArk");
const body = document.body;

if (localStorage.getItem("theme") === "light") {
  body.classList.add("light-mode");
  themeSwitch.classList.add("active-light");
}

themeSwitch.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  themeSwitch.classList.toggle("active-light");

  if (body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});

//===============================================
//          gemeni functions
//===============================================

let chatHistory = [];

chatToggleBtn.addEventListener("click", () => {
    e.stopPropagation(); 
    chatBox.classList.remove('hidden');
    aiShatWrabber.style.zIndex = "1050";
    document.getElementById('ai-input').focus();});

aiSend.addEventListener("click", async () => {
    const message = aiInput.value.trim();
    if (!message) return; 

    appendChat("You", message);
    aiInput.value = "";

    chatHistory.push({ role: "user", text: message });

    try {
        const response = await fetch(`${base_api_path}/api/chat/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: message,
                history: chatHistory 
            })
        });
                            if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }
        const data = await response.json();

        if (response.ok && data.reply) {
            chatHistory.push({ role: "model", text: data.reply });
            processGeminiResponse(data.reply); 
        } else {
            appendChat("System", "عذراً، حدث خطأ في السيرفر: " + (data.error || "Internal Server Error"));
            chatHistory.pop(); 
        }
        
    } catch (e) {
        appendChat("System", "Error connecting to AI. Is the server running?");
        console.error(e);
        chatHistory.pop();
    }
});

function appendChat(sender, text) {
    const msg = document.createElement("div");
    msg.style.padding = "5px";
    msg.style.borderBottom = "1px solid #444";
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatContent.appendChild(msg);
    chatContent.scrollTop = chatContent.scrollHeight; 
}

function processGeminiResponse(reply) {
    if (reply.includes("ACTION: SEARCH")) {
        
        const moviesMatch = reply.match(/MOVIES:\s*(.+)/i);
        
        if (moviesMatch) {
            const moviesArray = moviesMatch[1].split(','); 
            
            appendChat("Gemini", `Searching for: ${moviesMatch[1]}...`);
            
            movies_container.innerHTML = "";
            nothing.style.display = "none";

            displayMore.style.display = "none";
            
            moviesArray.forEach(async (movieName) => {
                let cleanTitle = movieName.trim();
                if (!cleanTitle) return; 

                try {
                    const response = await fetch(`${base_api_path}/api/search/?s=${cleanTitle}`);

                    if (response.status === 404) {
                      window.location.href = "404.html";
                    return; 
                    }
                    const data = await response.json();
                    
                    if (data.Search && data.Search.length > 0) {
                        const film = data.Search[0]; 
                        
                        let safePoster = (film.Poster && film.Poster !== "N/A") 
                            ? film.Poster 
                            : "https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg";
                        const movieCard = document.createElement("div");
                        movieCard.classList.add("movie-card"); 
                        
                        movieCard.innerHTML = `
                            <div class="fav-btn"
                                data-imdb-id="${film.imdbID}"
                                data-title="${film.Title}"
                                data-poster="${safePoster}"
                                data-year="${film.Year}"
                                data-genre="N/A"
                                data-actors="N/A">
                                ♥
                            </div>
                            <img src="${safePoster}" loading="lazy" onerror="this.onerror=null; this.src='https://motivatevalmorgan.com/wp-content/uploads/2016/06/default-movie.jpg';">                            <h3>${film.Title}</h3>
                            <div class="year">Year : ${film.Year}</div>
                            <button class="details-btn" data-imdb-id="${film.imdbID}">Details</button>
                        `;
                        
                        movies_container.appendChild(movieCard);

                        addDetailsButtonListeners();
                        addFavListener();
                    }
                } catch (error) {
                    console.error(`Error fetching movie: ${cleanTitle}`, error);
                }
            });
        }
        
    } else {
        let formattedReply = reply.replace(/\n/g, "<br>");
        appendChat("Gemini", formattedReply);
    }
}

document.getElementById('chat-toggle-btn').addEventListener('click', () => {
    document.getElementById('chat-box').classList.remove('hidden');
    aiShatWrabber.style.zIndex = 1050
});

document.getElementById('close-chat-btn').addEventListener('click', () => {
    document.getElementById('chat-box').classList.add('hidden');
    aiShatWrabber.style.zIndex = -1000
});


function checkAuthStatus() {
    let accessToken = localStorage.getItem("access_token"); 
    
    if (accessToken) {
        if (logoutBtn) logoutBtn.classList.remove("hidden");
        if (loginBtn) loginBtn.classList.add("hidden");
    } else {
        if (logoutBtn) logoutBtn.classList.add("hidden");
        if (loginBtn) loginBtn.classList.remove("hidden");
    }
}

checkAuthStatus();

logoutBtn.addEventListener("click", async () => {
    let refreshToken = localStorage.getItem("refresh_token"); 
    
    if (refreshToken) {
        try {
            await fetch(`${base_api_path}/api/logout/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh: refreshToken })
            });
            
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    
    window.location.reload(); 
});

if (closeOverlayBtn) {
  closeOverlayBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    let modal = document.querySelector("#movie-details-modal");
    if(modal) modal.classList.remove("show-modal");
  });
}

let closeDetailsBtn = document.querySelector("#movie-details-modal .x");
if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener("click", () => {
        document.querySelector(".overlay").style.display = "none";
        document.querySelector("#movie-details-modal").style.display = "none";
    });
}

let mainOverlay = document.querySelector(".overlay");
if (mainOverlay) {
    mainOverlay.addEventListener("click", (e) => {
        if (e.target === mainOverlay) {
            mainOverlay.style.display = "none";
            document.querySelector("#movie-details-modal").style.display = "none";
            
            let filterPanel = document.querySelector(".filter-panel");
            if(filterPanel) filterPanel.className = "filter-panel";
        }
    });
}