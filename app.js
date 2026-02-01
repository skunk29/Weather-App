const API_KEY = "872b0afdc4c4b5eb6d0c14eb33026028";
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherInfo = document.getElementById('weather-info');
const forecastContainer = document.getElementById('forecast');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const toggleModeBtn = document.getElementById('toggle-mode');
const tempChartEl = document.getElementById('temp-chart');
let tempChart = null;

// Dark/Light Mode
const darkMode = localStorage.getItem('darkMode') === 'true';
if (darkMode) document.body.classList.add('dark-mode');

toggleModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Load last city
const lastCity = localStorage.getItem('lastCity');
if (lastCity) {
  cityInput.value = lastCity;
  fetchWeather(lastCity);
}

// Debounce
let debounceTimer;
searchBtn.addEventListener('click', () => fetchWeather(cityInput.value));
cityInput.addEventListener('input', e => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchWeather(e.target.value), 500);
});

// Fetch Weather
async function fetchWeather(city) {
  if (!city) return;

  errorMessage.innerText = '';
  weatherInfo.innerHTML = '';
  forecastContainer.innerHTML = '';
  loader.classList.remove('hidden');

  try {
    // Current weather
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (!currentRes.ok) throw new Error('City not found');
    const currentData = await currentRes.json();

    // 5-day forecast
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    if (!forecastRes.ok) throw new Error('Forecast not found');
    const forecastData = await forecastRes.json();

    localStorage.setItem('lastCity', city);

    displayCurrentWeather(currentData);
    displayForecast(forecastData);
    displayChart(forecastData);

  } catch (error) {
    errorMessage.innerText = error.message;
  } finally {
    loader.classList.add('hidden');
  }
}

// Display Current Weather
function displayCurrentWeather(data) {
  const { name, sys, main, weather, wind } = data;
  weatherInfo.innerHTML = `
    <h2>${name}, ${sys.country}</h2>
    <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}">
    <p>${weather[0].main} - ${weather[0].description}</p>
    <p>Temp: ${main.temp}°C (Feels like: ${main.feels_like}°C)</p>
    <p>Humidity: ${main.humidity}%</p>
    <p>Wind: ${wind.speed} m/s</p>
  `;
}

// Display Forecast
function displayForecast(data) {
  // OpenWeather forecast gives 3-hour intervals. We'll pick one per day (12:00)
  const forecastByDay = {};
  data.list.forEach(item => {
    if (item.dt_txt.includes("12:00:00")) {
      const date = item.dt_txt.split(" ")[0];
      forecastByDay[date] = item;
    }
  });

  Object.values(forecastByDay).forEach(f => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <h3>${new Date(f.dt_txt).toLocaleDateString()}</h3>
      <img src="https://openweathermap.org/img/wn/${f.weather[0].icon}@2x.png" alt="${f.weather[0].description}">
      <p>${f.weather[0].main}</p>
      <p>${f.main.temp}°C</p>
    `;
    forecastContainer.appendChild(card);
  });
}

// Display Chart
function displayChart(data) {
  const labels = [];
  const temps = [];

  data.list.forEach(item => {
    labels.push(item.dt_txt.split(" ")[1].substring(0,5)); // HH:MM
    temps.push(item.main.temp);
  });

  if (tempChart) tempChart.destroy();

  tempChart = new Chart(tempChartEl, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperature °C',
        data: temps,
        borderColor: '#007BFF',
        backgroundColor: 'rgba(0,123,255,0.2)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}
