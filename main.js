// main.js

const API_BASE_URL = "https://api.coingecko.com/api/v3";

let coinsData = [];
let refreshIntervalId = null;

// Utility: Debounce
const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

document.addEventListener("DOMContentLoaded", () => {
  // Elements (SAFE to access now)
  const coinListEl = document.getElementById("coin-list");
  const searchInput = document.getElementById("search");
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const closeModalBtn = document.getElementById("close-modal");
  const lastUpdatedEl = document.getElementById("last-updated");
  const themeToggleBtn = document.getElementById("theme-toggle");

  // Loading state
  const showLoading = () => {
    coinListEl.innerHTML = "<p style='text-align:center;'>Loading data...</p>";
  };

  // Fetch coins
  const fetchCoins = async () => {
  showLoading();
  try {
    const res = await fetch(
      `${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`,
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!res.ok) throw new Error("API blocked");

    const data = await res.json();
    coinsData = data;
    renderCoins(data);

    if (lastUpdatedEl) {
      lastUpdatedEl.textContent =
        `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  } catch (err) {
    coinListEl.innerHTML = `
      <p style="text-align:center;color:red;">
        API temporarily unavailable. Please try again later.
      </p>
    `;
    console.error("Fetch failed:", err);
  }
};



  // Auto refresh
  const startAutoRefresh = (ms = 30000) => {
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(fetchCoins, ms);
  };

  // Render coins
  const renderCoins = (coins) => {
    coinListEl.innerHTML = "";

    if (!coins.length) {
      coinListEl.innerHTML =
        "<p style='text-align:center;'>No coins found.</p>";
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

  // Search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = coinsData.filter((c) =>
      c.name.toLowerCase().includes(term)
    );
    renderCoins(filtered);
  };

  searchInput.addEventListener("input", debounce(handleSearch, 300));

  // Modal logic
  const showCoinDetails = async (coinId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/coins/${coinId}`);
      const coin = await res.json();
      displayModal(coin);
    } catch {
      alert("Failed to fetch coin details.");
    }
  };

  const displayModal = (coin) => {
  modalBody.innerHTML = `
    <h2>${coin.name} (${coin.symbol.toUpperCase()})</h2>

    <div class="modal-icon">
      <img src="${coin.image.large}" alt="${coin.name} logo" />
    </div>

    <p><strong>Current Price:</strong> $${coin.market_data.current_price.usd.toLocaleString()}</p>
    <p><strong>Market Cap:</strong> $${coin.market_data.market_cap.usd.toLocaleString()}</p>
    <p><strong>Total Volume:</strong> $${coin.market_data.total_volume.usd.toLocaleString()}</p>
    <p><strong>24h Change:</strong> ${coin.market_data.price_change_percentage_24h.toFixed(2)}%</p>
    <p><strong>Circulating Supply:</strong> ${coin.market_data.circulating_supply.toLocaleString()}</p>
  `;
  modal.style.display = "block";
};


  closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.style.display = "none";
  });

  // Dark mode (SAFE)
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      themeToggleBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      themeToggleBtn.textContent = "☀️ Light Mode";
    }
  }

  // Start app
  fetchCoins();
});
