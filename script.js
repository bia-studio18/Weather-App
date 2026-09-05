/* =====================================================
   WEATHER PRO
   Complete professional weather application
===================================================== */

const CONFIG = {
    apiKey: "047934e9b1eb63acaa4087765129f9c5",
    weatherUrl: "https://api.openweathermap.org/data/2.5/weather",
    forecastUrl: "https://api.openweathermap.org/data/2.5/forecast",
    iconUrl: "https://openweathermap.org/img/wn/",
    historyLimit: 6,
    defaultCity: "London"
};

const state = {
    currentCity: "",
    units: "metric", // metric | imperial
    theme: "light",
    history: [],
    favorites: [],
    lastWeather: null,
    lastForecast: null,
    isLoading: false
};

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);

const els = {
    loader: $("loader"),
    cityInput: $("cityInput"),
    searchBtn: $("searchBtn"),
    locationBtn: $("locationBtn"),
    unitBtn: $("unitBtn"),
    unitLabel: $("unitLabel"),
    themeBtn: $("themeBtn"),
    themeIcon: $("themeIcon"),
    historyChips: $("historyChips"),
    skeleton: $("skeleton"),
    weatherBody: $("weatherBody"),
    errorBox: $("errorBox"),
    errorText: $("errorText"),
    retryBtn: $("retryBtn"),
    cityName: $("cityName"),
    countryName: $("countryName"),
    favBtn: $("favBtn"),
    favIcon: $("favIcon"),
    weatherIcon: $("weatherIcon"),
    tempValue: $("tempValue"),
    description: $("description"),
    feelsLike: $("feelsLike"),
    humidity: $("humidity"),
    wind: $("wind"),
    pressure: $("pressure"),
    visibility: $("visibility"),
    tempMax: $("tempMax"),
    tempMin: $("tempMin"),
    sunrise: $("sunrise"),
    sunset: $("sunset"),
    hourlySection: $("hourlySection"),
    hourlyList: $("hourlyList"),
    forecastSection: $("forecastSection"),
    forecastList: $("forecastList"),
    favoritesList: $("favoritesList"),
    dayName: $("dayName"),
    fullDate: $("fullDate"),
    liveTime: $("liveTime"),
    updatedAt: $("updatedAt")
};

/* ---------- Storage ---------- */
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}
function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
        return fallback;
    }
}

/* ---------- Units helpers ---------- */
function tempUnit() {
    return state.units === "metric" ? "°C" : "°F";
}
function speedUnit() {
    return state.units === "metric" ? "km/h" : "mph";
}
function convertTemp(celsius) {
    if (state.units === "metric") return Math.round(celsius);
    return Math.round((celsius * 9) / 5 + 32);
}
function convertSpeed(ms) {
    // API always returns m/s for wind when units=metric; we convert display
    if (state.units === "metric") return (ms * 3.6).toFixed(1);
    return (ms * 2.237).toFixed(1);
}
function formatTemp(val) {
    return `${convertTemp(val)}${tempUnit()}`;
}

/* ---------- UI helpers ---------- */
function showLoader() {
    els.loader.classList.remove("hide");
}
function hideLoader() {
    els.loader.classList.add("hide");
}
function showSkeleton() {
    els.skeleton.classList.remove("hidden");
    els.weatherBody.classList.add("hidden");
    els.errorBox.classList.add("hidden");
}
function hideSkeleton() {
    els.skeleton.classList.add("hidden");
}
function showError(msg) {
    els.errorText.textContent = msg;
    els.errorBox.classList.remove("hidden");
    els.weatherBody.classList.add("hidden");
    hideSkeleton();
    els.hourlySection.classList.add("hidden");
    els.forecastSection.classList.add("hidden");
}
function hideError() {
    els.errorBox.classList.add("hidden");
}

function capitalize(str) {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(unix, timezoneOffset = 0) {
    // Use local browser time for simplicity & consistency
    return new Date(unix * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* ---------- Clock ---------- */
function updateClock() {
    const now = new Date();
    els.dayName.textContent = now.toLocaleDateString(undefined, { weekday: "long" });
    els.fullDate.textContent = now.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
    els.liveTime.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}
setInterval(updateClock, 1000);
updateClock();

/* ---------- Theme ---------- */
function applyTheme() {
    document.body.classList.toggle("dark", state.theme === "dark");
    els.themeIcon.className =
        state.theme === "dark" ? "ri-sun-line" : "ri-moon-clear-line";
}
function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    save("theme", state.theme);
    applyTheme();
}

/* ---------- Units toggle ---------- */
function toggleUnits() {
    state.units = state.units === "metric" ? "imperial" : "metric";
    els.unitLabel.textContent = state.units === "metric" ? "°C" : "°F";
    save("units", state.units);
    // Re-render with cached data if available
    if (state.lastWeather) {
        renderWeather(state.lastWeather);
        if (state.lastForecast) renderForecast(state.lastForecast);
    }
}

/* ---------- Background ---------- */
function setBackground(main, icon) {
    document.body.classList.remove(
        "sunny", "cloudy", "rainy", "storm", "snow", "mist", "night"
    );
    if (icon && icon.endsWith("n")) {
        document.body.classList.add("night");
        return;
    }
    const m = (main || "").toLowerCase();
    if (m === "clear") document.body.classList.add("sunny");
    else if (m === "clouds") document.body.classList.add("cloudy");
    else if (m === "rain" || m === "drizzle") document.body.classList.add("rainy");
    else if (m === "thunderstorm") document.body.classList.add("storm");
    else if (m === "snow") document.body.classList.add("snow");
    else document.body.classList.add("mist");
}

/* ---------- History ---------- */
function saveHistory(city) {
    let list = load("history", []);
    list = list.filter((c) => c.toLowerCase() !== city.toLowerCase());
    list.unshift(city);
    if (list.length > CONFIG.historyLimit) list.length = CONFIG.historyLimit;
    state.history = list;
    save("history", list);
    renderHistory();
}
function renderHistory() {
    state.history = load("history", []);
    els.historyChips.innerHTML = "";
    state.history.forEach((city) => {
        const btn = document.createElement("button");
        btn.className = "chip";
        btn.textContent = city;
        btn.addEventListener("click", () => loadCity(city));
        els.historyChips.appendChild(btn);
    });
}

/* ---------- Favorites ---------- */
function isFavorite(city) {
    return state.favorites.some((c) => c.toLowerCase() === city.toLowerCase());
}
function toggleFavorite() {
    if (!state.currentCity) return;
    const city = state.currentCity;
    let list = load("favorites", []);
    if (isFavorite(city)) {
        list = list.filter((c) => c.toLowerCase() !== city.toLowerCase());
    } else {
        list.push(city);
    }
    state.favorites = list;
    save("favorites", list);
    updateFavButton();
    renderFavorites();
}
function updateFavButton() {
    const active = isFavorite(state.currentCity);
    els.favBtn.classList.toggle("active", active);
    els.favIcon.className = active ? "ri-heart-fill" : "ri-heart-line";
    els.favBtn.title = active ? "Remove from favorites" : "Add to favorites";
}
function renderFavorites() {
    state.favorites = load("favorites", []);
    els.favoritesList.innerHTML = "";
    if (state.favorites.length === 0) {
        els.favoritesList.innerHTML =
            '<p class="empty-fav">Use the heart button to save cities</p>';
        return;
    }
    state.favorites.forEach((city) => {
        const btn = document.createElement("button");
        btn.className = "fav-chip";
        btn.innerHTML = `<i class="ri-heart-fill"></i> ${city} <span class="remove" data-city="${city}">×</span>`;
        btn.addEventListener("click", (e) => {
            if (e.target.classList.contains("remove")) {
                e.stopPropagation();
                removeFavorite(city);
            } else {
                loadCity(city);
            }
        });
        els.favoritesList.appendChild(btn);
    });
}
function removeFavorite(city) {
    state.favorites = load("favorites", []).filter(
        (c) => c.toLowerCase() !== city.toLowerCase()
    );
    save("favorites", state.favorites);
    updateFavButton();
    renderFavorites();
}

/* ---------- API ---------- */
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
        if (res.status === 404) throw new Error("City not found. Check the spelling.");
        if (res.status === 401) throw new Error("API key issue. Please try again later.");
        throw new Error("Unable to fetch weather data.");
    }
    return res.json();
}

async function loadCity(cityName) {
    if (!cityName || state.isLoading) return;
    state.isLoading = true;
    showSkeleton();
    hideError();

    try {
        const q = encodeURIComponent(cityName.trim());
        // Always request metric from API for consistent conversion
        const weatherUrl = `${CONFIG.weatherUrl}?q=${q}&appid=${CONFIG.apiKey}&units=metric`;
        const forecastUrl = `${CONFIG.forecastUrl}?q=${q}&appid=${CONFIG.apiKey}&units=metric`;

        const [weather, forecast] = await Promise.all([
            fetchJSON(weatherUrl),
            fetchJSON(forecastUrl)
        ]);

        state.lastWeather = weather;
        state.lastForecast = forecast;
        state.currentCity = weather.name;

        renderWeather(weather);
        renderForecast(forecast);
        setBackground(weather.weather[0].main, weather.weather[0].icon);

        save("lastCity", weather.name);
        saveHistory(weather.name);
        updateFavButton();

        els.updatedAt.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        hideSkeleton();
        els.weatherBody.classList.remove("hidden");
        els.hourlySection.classList.remove("hidden");
        els.forecastSection.classList.remove("hidden");
    } catch (err) {
        showError(err.message || "Something went wrong");
        console.error(err);
    } finally {
        state.isLoading = false;
    }
}

async function loadByCoords(lat, lon) {
    if (state.isLoading) return;
    state.isLoading = true;
    showSkeleton();
    hideError();

    try {
        const weatherUrl = `${CONFIG.weatherUrl}?lat=${lat}&lon=${lon}&appid=${CONFIG.apiKey}&units=metric`;
        const forecastUrl = `${CONFIG.forecastUrl}?lat=${lat}&lon=${lon}&appid=${CONFIG.apiKey}&units=metric`;

        const [weather, forecast] = await Promise.all([
            fetchJSON(weatherUrl),
            fetchJSON(forecastUrl)
        ]);

        state.lastWeather = weather;
        state.lastForecast = forecast;
        state.currentCity = weather.name;

        renderWeather(weather);
        renderForecast(forecast);
        setBackground(weather.weather[0].main, weather.weather[0].icon);

        save("lastCity", weather.name);
        saveHistory(weather.name);
        updateFavButton();

        els.updatedAt.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

        hideSkeleton();
        els.weatherBody.classList.remove("hidden");
        els.hourlySection.classList.remove("hidden");
        els.forecastSection.classList.remove("hidden");
    } catch (err) {
        showError(err.message || "Could not get location weather");
    } finally {
        state.isLoading = false;
    }
}

/* ---------- Render ---------- */
function renderWeather(data) {
    const w = data.weather[0];
    els.cityName.textContent = data.name;
    els.countryName.textContent = data.sys.country;
    els.weatherIcon.src = `${CONFIG.iconUrl}${w.icon}@4x.png`;
    els.weatherIcon.alt = w.description;
    els.tempValue.textContent = formatTemp(data.main.temp);
    els.description.textContent = capitalize(w.description);
    els.feelsLike.textContent = `Feels like ${formatTemp(data.main.feels_like)}`;
    els.humidity.textContent = `${data.main.humidity}%`;
    els.wind.textContent = `${convertSpeed(data.wind.speed)} ${speedUnit()}`;
    els.pressure.textContent = `${data.main.pressure} hPa`;
    els.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    els.tempMax.textContent = formatTemp(data.main.temp_max);
    els.tempMin.textContent = formatTemp(data.main.temp_min);
    els.sunrise.textContent = formatTime(data.sys.sunrise);
    els.sunset.textContent = formatTime(data.sys.sunset);
}

function renderForecast(data) {
    // Hourly: next 8 entries (~24h)
    const hourly = data.list.slice(0, 8);
    els.hourlyList.innerHTML = "";
    hourly.forEach((item) => {
        const time = new Date(item.dt * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
        const div = document.createElement("div");
        div.className = "hourly-item";
        div.innerHTML = `
            <div class="h-time">${time}</div>
            <img src="${CONFIG.iconUrl}${item.weather[0].icon}@2x.png" alt="">
            <div class="h-temp">${formatTemp(item.main.temp)}</div>
        `;
        els.hourlyList.appendChild(div);
    });

    // 5-day: group by day, take midday-ish entry
    const byDay = {};
    data.list.forEach((item) => {
        const dayKey = new Date(item.dt * 1000).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
        if (!byDay[dayKey]) byDay[dayKey] = [];
        byDay[dayKey].push(item);
    });

    const days = Object.entries(byDay).slice(0, 5);
    els.forecastList.innerHTML = "";
    days.forEach(([dayLabel, items], idx) => {
        // Prefer item closest to 12:00
        let best = items[0];
        let bestDiff = Infinity;
        items.forEach((it) => {
            const h = new Date(it.dt * 1000).getHours();
            const diff = Math.abs(h - 12);
            if (diff < bestDiff) {
                bestDiff = diff;
                best = it;
            }
        });
        const temps = items.map((i) => i.main.temp);
        const maxT = Math.max(...temps);
        const minT = Math.min(...temps);

        const row = document.createElement("div");
        row.className = "forecast-item";
        row.innerHTML = `
            <div class="f-day">${idx === 0 ? "Today" : dayLabel.split(",")[0]}</div>
            <img src="${CONFIG.iconUrl}${best.weather[0].icon}@2x.png" alt="">
            <div class="f-desc">${best.weather[0].description}</div>
            <div class="f-temps">${formatTemp(maxT)} <span>${formatTemp(minT)}</span></div>
        `;
        els.forecastList.appendChild(row);
    });
}

/* ---------- Geolocation ---------- */
function getLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser.");
        return;
    }
    showSkeleton();
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            loadByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
            showError("Location access denied. Please search for a city instead.");
        },
        { timeout: 10000 }
    );
}

/* ---------- Events ---------- */
function handleSearch() {
    const q = els.cityInput.value.trim();
    if (!q) {
        showError("Please enter a city name.");
        return;
    }
    loadCity(q);
    els.cityInput.value = "";
}

els.searchBtn.addEventListener("click", handleSearch);
els.cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") els.cityInput.value = "";
});
els.locationBtn.addEventListener("click", getLocation);
els.themeBtn.addEventListener("click", toggleTheme);
els.unitBtn.addEventListener("click", toggleUnits);
els.favBtn.addEventListener("click", toggleFavorite);
els.retryBtn.addEventListener("click", () => {
    if (state.currentCity) loadCity(state.currentCity);
    else loadCity(CONFIG.defaultCity);
});

window.addEventListener("offline", () => {
    showError("You are offline. Check your internet connection.");
});
window.addEventListener("online", () => {
    hideError();
    if (state.currentCity) loadCity(state.currentCity);
});

/* ---------- Init ---------- */
function init() {
    state.theme = load("theme", "light");
    state.units = load("units", "metric");
    state.favorites = load("favorites", []);
    state.history = load("history", []);

    els.unitLabel.textContent = state.units === "metric" ? "°C" : "°F";
    applyTheme();
    renderHistory();
    renderFavorites();

    // Hide initial loader after short delay
    window.addEventListener("load", () => {
        setTimeout(hideLoader, 900);
        els.cityInput.focus();
    });

    const last = localStorage.getItem("lastCity");
    if (last) {
        loadCity(last);
    } else {
        loadCity(CONFIG.defaultCity);
    }
}

document.addEventListener("DOMContentLoaded", init);
