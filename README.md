
# Weather Pro

A beautiful and fully-featured weather application built with pure HTML, CSS, and JavaScript.

**Features real-time weather, 5-day forecast, hourly outlook, favorites, dark mode, and geolocation.**

---

### Features

- Current weather (temperature, feels like, high/low, humidity, wind, pressure, visibility)
- Sunrise & sunset times
- Dynamic weather icons and animated backgrounds
- Next 24 hours hourly forecast
- 5-day daily forecast
- Search any city worldwide
- Current location (Geolocation API)
- Recent search history (saved in localStorage)
- Favorite cities with one-click access
- °C / °F unit toggle
- Dark / Light theme
- Offline detection & recovery
- Fully responsive design

---

### Tech Stack

- HTML5
- CSS3 (Custom properties, Glassmorphism, Responsive)
- Vanilla JavaScript (ES6+, Fetch API, LocalStorage, Geolocation)
- OpenWeatherMap API

---



### How to Run

1. Clone or download this repository
2. Open `index.html` in any modern browser  
   (or use Live Server in VS Code)

No build step or installation required.

---

### API Key

The app currently uses a demo OpenWeatherMap API key.

For personal/production use, get a free API key from [OpenWeatherMap](https://openweathermap.org/api) and replace it in `script.js`:

```js
apiKey: "YOUR_API_KEY"
