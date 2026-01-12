// main.js

const API_BASE_URL = "https://api.coingecko.com/api/v3";

// Elements
const coinListEl = document.getElementById("coin-list");
const searchInput = document.getElementById("search");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const closeModalBtn = document.getElementById("close-modal");
const lastUpdatedEl = document.getElementById("last-updated");

// Utility: Loading state
const showLoading = () => {
  coinListEl.innerHTML = "<p style='text-align: center;'>Loading data...</p>";
};

// Utility: Debounce
const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

let coinsData = [];
let refreshIntervalId = null;

// Fetch top coins from CoinGecko
const fetchCoins = async () => {
  try {
    showLoading();

    const res = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`
    );
    const data = await res.json();

    coinsData = data;
    renderCoins(data);

    // Update last refreshed time
    const now = new Date();
    lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
  } catch (error) {
    coinListEl.innerHTML =
      "<p style='text-align: center;'>Failed to fetch data.</p>";
  }
};

// Auto refresh logic
const startAutoRefresh = (ms = 30000) => {
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  refreshIntervalId = setInterval(fetchCoins, ms);
};

// Initialize data fetch and auto-refresh on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchCoins();
  startAutoRefresh(30000);
});

// Render coin cards
const renderCoins = (coins) => {
  coinListEl.innerHTML = "";

  if (coins.length === 0) {
    coinListEl.innerHTML = "<p style='text-align: center;'>No coins found.</p>";
    return;
  }

  coins.forEach((coin) => {
    const card = document.createElement("div");
    card.className = "coin-card";
    card.innerHTML = `
      <img src="${coin.image}" alt="${coin.name}" />
      <h2>${coin.name}</h2>
      <p>Symbol: ${coin.symbol.toUpperCase()}</p>
      <p>Price: $${coin.current_price.toLocaleString()}</p>
      <p>Market Cap: $${coin.market_cap.toLocaleString()}</p>
      <p class="${coin.price_change_percentage_24h >= 0 ? "positive" : "negative"}">
        24h Change: ${coin.price_change_percentage_24h.toFixed(2)}%
      </p>
    `;

    card.addEventListener("click", () => showCoinDetails(coin.id));
    coinListEl.appendChild(card);
  });
};

// Search logic with debounce
const handleSearch = (e) => {
  const term = e.target.value.toLowerCase();
  const filteredCoins = coinsData.filter((coin) =>
    coin.name.toLowerCase().includes(term)
  );
  renderCoins(filteredCoins);
};

searchInput.addEventListener("input", debounce(handleSearch, 300));

// Fetch and show coin details in modal
const showCoinDetails = async (coinId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/coins/${coinId}`);
    const coin = await res.json();
    displayModal(coin);
  } catch (error) {
    alert("Failed to fetch coin details.");
  }
};

// Display modal with coin details
const displayModal = (coin) => {
  modalBody.innerHTML = `
    <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>
    <img src="${coin.image.large}" alt="${coin.name}" style="width:100px;height:100px;border-radius:50%;" />
    <p><strong>Current Price:</strong> $${coin.market_data.current_price.usd.toLocaleString()}</p>
    <p><strong>Market Cap:</strong> $${coin.market_data.market_cap.usd.toLocaleString()}</p>
    <p><strong>Total Volume:</strong> $${coin.market_data.total_volume.usd.toLocaleString()}</p>
    <p><strong>24h Change:</strong> ${coin.market_data.price_change_percentage_24h.toFixed(2)}%</p>
    <p><strong>Circulating Supply:</strong> ${coin.market_data.circulating_supply.toLocaleString()}</p>
  `;
  modal.style.display = "block";
};

// Close modal events
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// ESC key closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.style.display = "none";
  }
});
