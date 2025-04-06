document.addEventListener("DOMContentLoaded", function () {
  // Add click handler for JanVichar logo/text
  const janvicharLogo = document.querySelector(".logo");
  if (janvicharLogo) {
    janvicharLogo.style.cursor = "pointer"; // Make it look clickable
    janvicharLogo.addEventListener("click", function (e) {
      e.preventDefault();
      // Redirect to home page
      window.location.href = "/";

      // Update active state of nav links
      document.querySelectorAll("ul li a").forEach((link) => {
        link.classList.remove("active");
      });
      const homeLink = document.querySelector('a[href="#home"]');
      if (homeLink) {
        homeLink.classList.add("active");
      }
    });
  }

  // Scroll to top of the page
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  const navLinks = document.querySelectorAll("ul li a");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      navLinks.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  const hash = window.location.hash || "#home";
  const activeLink = document.querySelector(`a[href="${hash}"]`);
  if (activeLink) {
    navLinks.forEach((l) => l.classList.remove("active"));
    activeLink.classList.add("active");
  }

  // Load dashboard stats
  loadDashboardStats();

  // Setup quick analysis
  setupQuickAnalysis();

  // Load recent searches
  loadRecentSearches();

  // Start emotion updates simulation
  simulateEmotionUpdates();

  // Load custom tracking data
  loadCustomTracking();

  // Update platform cards with hardcoded values
  const platformCardData = {
    reddit: {
      posts: "1,234",
      comments: "8,567",
      sentiment: "48%",
      engagement: "6.8%",
      trend: "+8%",
      isPositive: true,
    },
    youtube: {
      posts: "1,313",
      comments: "7,325",
      sentiment: "35%",
      engagement: "7.6%",
      trend: "+5%",
      isPositive: true,
    },
  };

  // Update Reddit card
  document.getElementById("redditPosts").textContent =
    platformCardData.reddit.posts;
  document.getElementById("redditComments").textContent =
    platformCardData.reddit.comments;
  document.getElementById("redditSentiment").textContent =
    platformCardData.reddit.sentiment;
  document.getElementById("redditEngagement").textContent =
    platformCardData.reddit.engagement;

  // Update YouTube card
  document.getElementById("youtubePosts").textContent =
    platformCardData.youtube.posts;
  document.getElementById("youtubeComments").textContent =
    platformCardData.youtube.comments;
  document.getElementById("youtubeSentiment").textContent =
    platformCardData.youtube.sentiment;
  document.getElementById("youtubeEngagement").textContent =
    platformCardData.youtube.engagement;

  // Set default platform to Reddit
  const defaultPlatform = "reddit";
  switchPlatform(defaultPlatform);

  // Initialize charts
  initializeCharts();

  // Fetch initial comments
  fetchLatestComments(defaultPlatform);

  // Set up auto-refresh for comments
  setInterval(() => {
    const platformSelect = document.getElementById("platform");
    const platform = platformSelect ? platformSelect.value : defaultPlatform;
    fetchLatestComments(platform);
  }, 30000);

  // Set up theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Set up platform select dropdown
  const platformSelectDropdown = document.getElementById("platform");
  if (platformSelectDropdown) {
    platformSelectDropdown.addEventListener("change", function () {
      switchPlatform(this.value);
    });
  }
});

let currentPlatform = "reddit";

// Global variables to store chart instances
let redditChart = null;
let platformComparisonChart = null;
let emotionPieChart = null;

// Common chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: "index",
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.9)",
      padding: 12,
      bodySpacing: 4,
      borderColor: "rgba(148, 163, 184, 0.1)",
      borderWidth: 1,
      titleColor: "#f8fafc",
      bodyColor: "#f8fafc",
      callbacks: {
        label: function (context) {
          return `${context.raw}%`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      min: 0,
      max: 80,
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
        drawBorder: false,
      },
      ticks: {
        color: "#94a3b8",
        callback: function (value) {
          return value + "%";
        },
        stepSize: 20,
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#94a3b8",
        maxRotation: 0,
      },
    },
  },
};

// Function to initialize charts
async function initializeCharts() {
  try {
    console.log("Initializing charts...");
    const response = await fetch("http://localhost:8000/sentiment-trends");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    createCharts(data);
  } catch (error) {
    console.error("Error initializing charts:", error);
    // If API fails, use hardcoded data
    initializeChartsWithHardcodedData();
  }
}

// Function to create or update charts
function createCharts(data) {
  const ctx = document.getElementById("redditChart");
  if (!ctx) {
    console.error("Chart canvas not found");
    return;
  }

  // Destroy existing chart instances if they exist
  if (redditChart) {
    redditChart.destroy();
  }
  if (platformComparisonChart) {
    platformComparisonChart.destroy();
  }
  if (emotionPieChart) {
    emotionPieChart.destroy();
  }

  // Get the currently active platform from the select dropdown
  const platformSelect = document.getElementById("platform");
  const platform = platformSelect ? platformSelect.value : "reddit"; // Default to reddit if no platform selected

  // Create new chart with only the selected platform's data
  redditChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.time_labels,
      datasets: [
        {
          label: platform.charAt(0).toUpperCase() + platform.slice(1),
          data: platform === "reddit" ? data.reddit_trend : data.youtube_trend,
          borderColor: platform === "reddit" ? "#ff4500" : "#ff0000",
          tension: 0.4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
        },
      },
    },
  });

  // Create emotion pie chart
  const emotionCtx = document.getElementById("emotionPieChart");
  if (emotionCtx) {
    // Get emotion data from the API response
    const emotionData = data.emotions || {
      joy: 35,
      sadness: 25,
      anger: 15,
      fear: 10,
      surprise: 15,
    };

    // Update emotion list values
    updateEmotionList(emotionData);

    // Create pie chart
    emotionPieChart = new Chart(emotionCtx, {
      type: "pie",
      data: {
        labels: ["Joy", "Sadness", "Anger", "Fear", "Surprise"],
        datasets: [
          {
            data: [
              emotionData.joy || 0,
              emotionData.sadness || 0,
              emotionData.anger || 0,
              emotionData.fear || 0,
              emotionData.surprise || 0,
            ],
            backgroundColor: [
              "#FFD700", // Joy - Gold
              "#4169E1", // Sadness - Blue
              "#FF4500", // Anger - Red
              "#800080", // Fear - Purple
              "#32CD32", // Surprise - Green
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: document.body.classList.contains("dark-mode")
                ? "#f8fafc"
                : "#1e293b",
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.raw}%`;
              },
            },
          },
        },
      },
    });
  }
}

// Function to initialize charts with hardcoded data
function initializeChartsWithHardcodedData() {
  console.log("Using hardcoded data for charts");

  // Get the currently active platform from the select dropdown
  const platformSelect = document.getElementById("platform");
  const platform = platformSelect ? platformSelect.value : "reddit"; // Default to reddit if no platform selected

  // Generate sample data
  const sampleData = {
    time_labels: Array.from({ length: 24 }, (_, i) => `${23 - i}:00`),
    reddit_trend: Array.from(
      { length: 24 },
      () => Math.floor(Math.random() * 30) + 40
    ),
    youtube_trend: Array.from(
      { length: 24 },
      () => Math.floor(Math.random() * 30) + 35
    ),
    emotions: {
      joy: 35,
      sadness: 25,
      anger: 15,
      fear: 10,
      surprise: 15,
    },
  };

  // Create chart with only the selected platform's data
  const ctx = document.getElementById("redditChart");
  if (!ctx) {
    console.error("Chart canvas not found");
    return;
  }

  // Destroy existing chart instances if they exist
  if (redditChart) {
    redditChart.destroy();
  }
  if (platformComparisonChart) {
    platformComparisonChart.destroy();
  }
  if (emotionPieChart) {
    emotionPieChart.destroy();
  }

  redditChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: sampleData.time_labels,
      datasets: [
        {
          label: platform.charAt(0).toUpperCase() + platform.slice(1),
          data:
            platform === "reddit"
              ? sampleData.reddit_trend
              : sampleData.youtube_trend,
          borderColor: platform === "reddit" ? "#ff4500" : "#ff0000",
          tension: 0.4,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
        },
      },
    },
  });

  // Create emotion pie chart with hardcoded data
  const emotionCtx = document.getElementById("emotionPieChart");
  if (emotionCtx) {
    // Update emotion list values
    updateEmotionList(sampleData.emotions);

    // Create pie chart
    emotionPieChart = new Chart(emotionCtx, {
      type: "pie",
      data: {
        labels: ["Joy", "Sadness", "Anger", "Fear", "Surprise"],
        datasets: [
          {
            data: [
              sampleData.emotions.joy,
              sampleData.emotions.sadness,
              sampleData.emotions.anger,
              sampleData.emotions.fear,
              sampleData.emotions.surprise,
            ],
            backgroundColor: [
              "#FFD700", // Joy - Gold
              "#4169E1", // Sadness - Blue
              "#FF4500", // Anger - Red
              "#800080", // Fear - Purple
              "#32CD32", // Surprise - Green
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: document.body.classList.contains("dark-mode")
                ? "#f8fafc"
                : "#1e293b",
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.raw}%`;
              },
            },
          },
        },
      },
    });
  }
}

// Function to update emotion list values
function updateEmotionList(emotionData) {
  const emotionItems = document.querySelectorAll(".emotion-item");
  if (emotionItems.length === 0) return;

  // Update each emotion item
  emotionItems.forEach((item) => {
    const emotionName = item
      .querySelector(".emotion-info span:first-child")
      .textContent.toLowerCase();
    const emotionValue = item.querySelector(".emotion-value");
    const progressBar = item.querySelector(".progress");

    if (emotionValue && progressBar && emotionData[emotionName] !== undefined) {
      const value = emotionData[emotionName];
      emotionValue.textContent = `${value}%`;
      progressBar.style.width = `${value}%`;
    }
  });
}

// Function to switch between platforms
function switchPlatform(platform) {
  // Update platform selection dropdown
  const platformSelect = document.querySelector(".platform-select");
  if (platformSelect) {
    platformSelect.value = platform;
  }

  // Update chart visibility and titles
  const redditChart = document.querySelector(".reddit-chart");
  const youtubeChart = document.querySelector(".youtube-chart");
  const redditTitle = document.querySelector(".reddit-title");
  const youtubeTitle = document.querySelector(".youtube-title");

  if (platform === "reddit") {
    redditChart.style.display = "block";
    youtubeChart.style.display = "none";
    redditTitle.classList.add("active");
    youtubeTitle.classList.remove("active");
  } else {
    redditChart.style.display = "none";
    youtubeChart.style.display = "block";
    redditTitle.classList.remove("active");
    youtubeTitle.classList.add("active");
  }

  // Fetch platform-specific comments
  fetchLatestComments(platform);
}

// Function to fetch data from URL
async function fetchData() {
  const urlInput = document.getElementById("url-input");
  const url = urlInput.value.trim();
  const platform = document.querySelector(".platform-select").value;

  if (!url) {
    showError("Please enter a URL");
    return;
  }

  // Show loading state
  showLoading();

  try {
    // Make API call to analyze URL
    const response = await fetch("http://localhost:8000/analyze-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, platform }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received analysis data:", data);

    // Update UI with response data
    updateUI(data);

    // Fetch platform-specific comments
    fetchLatestComments(platform);

    // Hide loading state
    hideLoading();
  } catch (error) {
    console.error("Error fetching data:", error);
    showError(error.message);
    hideLoading();
  }
}

// Function to update platform data from API response
function updatePlatformData(platform, data) {
  // Update percentage
  const percentageElement = document.getElementById(`${platform}-percentage`);
  if (percentageElement && data.percentage) {
    percentageElement.textContent = `${data.percentage}%`;
  }

  // Update trend
  const trendElement = document.getElementById(`${platform}-trend`);
  const trendValueElement = document.getElementById(`${platform}-trend-value`);
  if (trendElement && trendValueElement && data.trend) {
    const isPositive = data.trend > 0;
    trendElement.className = `trend ${isPositive ? "positive" : "negative"}`;
    trendElement.querySelector("i").className = isPositive
      ? "fas fa-arrow-up"
      : "fas fa-arrow-down";
    trendValueElement.textContent = `${Math.abs(data.trend)}% since yesterday`;
  }

  // Update chart data
  const chart =
    platform === "reddit" ? window.redditChart : window.youtubeChart;

  if (chart && data.chartData) {
    chart.data.datasets[0].data = data.chartData;
    chart.update();
  }
}

// Function to update emotion chart data
function updateEmotionChart(data) {
  const emotionChart = window.emotionChart;
  emotionChart.data.datasets[0].data = data;
  emotionChart.update();

  // Update progress bars
  const emotions = ["Joy", "Sadness", "Anger", "Fear", "Surprise"];
  emotions.forEach((emotion, index) => {
    const emotionItem = document.querySelector(
      `.emotion-item:nth-child(${index + 1})`
    );
    const valueSpan = emotionItem.querySelector(".emotion-value");
    const progressBar = emotionItem.querySelector(".progress");

    valueSpan.textContent = data[index] + "%";
    progressBar.style.width = data[index] + "%";
  });
}

// Example function to simulate real-time updates
function simulateEmotionUpdates() {
  setInterval(() => {
    const newData = [
      Math.floor(Math.random() * 30) + 20, // Joy: 20-50%
      Math.floor(Math.random() * 20) + 15, // Sadness: 15-35%
      Math.floor(Math.random() * 15) + 10, // Anger: 10-25%
      Math.floor(Math.random() * 10) + 5, // Fear: 5-15%
      Math.floor(Math.random() * 15) + 10, // Surprise: 10-25%
    ];
    updateEmotionChart(newData);
  }, 5000); // Update every 5 seconds
}

// Theme toggle functionality
const themeToggle = document.getElementById("theme-toggle");
const darkModeCheckbox = document.getElementById("dark-mode");

// Function to update theme
function updateTheme(isDark, showNotification = true) {
  // Update document class
  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark-mode", isDark);

  // Update localStorage
  localStorage.setItem("theme-preference", isDark ? "dark" : "light");

  // Update theme toggle button state
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", isDark ? "dark" : "light");
    themeToggle.classList.toggle("active", isDark);
  }

  // Update dark mode checkbox
  if (darkModeCheckbox) {
    darkModeCheckbox.checked = isDark;
  }

  // Recreate platform comparison chart with updated colors
  if (window.platformChart) {
    const oldData = window.platformChart.data;
    window.platformChart.destroy();
    const platformCtx = document
      .getElementById("platformComparisonChart")
      .getContext("2d");
    window.platformChart = new Chart(platformCtx, {
      type: "bar",
      data: oldData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: isDark ? "#FFFFFF" : "#000000",
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: isDark ? "#FFFFFF" : "#000000",
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            align: "center",
            labels: {
              color: isDark ? "#FFFFFF" : "#000000",
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: {
                size: 12,
              },
            },
          },
        },
      },
    });
  }

  // Show notification only if explicitly requested
  if (showNotification) {
    showNotification(`${isDark ? "Dark" : "Light"} mode enabled!`, "info");
  }
}

// Function to initialize theme
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme-preference");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
  updateTheme(isDark, false); // Don't show notification on initialization
}

// Initialize theme on page load
initializeTheme();

// Theme toggle button click handler
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    updateTheme(!isDark);
  });
}

// Dark mode checkbox change handler
if (darkModeCheckbox) {
  darkModeCheckbox.addEventListener("change", (e) => {
    updateTheme(e.target.checked);
  });
}

// Listen for theme changes from other pages
window.addEventListener("storage", (e) => {
  if (e.key === "theme-preference") {
    const isDark = e.newValue === "dark";
    updateTheme(isDark);
  }
});

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme-preference")) {
      updateTheme(e.matches);
    }
  });

// Load dashboard statistics
function loadDashboardStats() {
  // In a real application, this would fetch from your API
  // For now, we'll simulate the data

  // Simulate API call delay
  setTimeout(() => {
    // Update overall sentiment
    document.getElementById("overall-sentiment").textContent = "62%";

    // Update total posts
    document.getElementById("total-posts").textContent = "1,248";

    // Update trending topics
    document.getElementById("trending-topics").textContent = "5";

    // Show notification
    showNotification("Dashboard stats updated", "success");
  }, 1000);
}

// Update comment analysis function
async function analyzeComments() {
  const platform = document.getElementById("platform").value;
  const url = document.getElementById("input").value;
  const resultsDiv = document.getElementById("results");

  if (!url) {
    showNotification("Please enter a valid URL", "error");
    return;
  }

  // Show loading state
  resultsDiv.innerHTML = '<div class="loading">Analyzing comments...</div>';

  try {
    // Simulate API call with timeout
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulated analysis results
    const results = {
      sentiment: Math.random() > 0.5 ? "positive" : "negative",
      score: Math.floor(Math.random() * 100),
      totalComments: Math.floor(Math.random() * 1000),
      emotions: {
        joy: Math.floor(Math.random() * 100),
        sadness: Math.floor(Math.random() * 100),
        anger: Math.floor(Math.random() * 100),
        fear: Math.floor(Math.random() * 100),
        surprise: Math.floor(Math.random() * 100),
      },
    };

    // Display results
    resultsDiv.innerHTML = `
      <div class="analysis-result">
        <div class="result-header">
          <h3>Analysis Results</h3>
          <span class="sentiment ${results.sentiment}">${
      results.sentiment
    }</span>
        </div>
        <div class="result-details">
          <div class="result-detail">
            <span class="detail-label">Sentiment Score:</span>
            <span class="detail-value">${results.score}%</span>
          </div>
          <div class="result-detail">
            <span class="detail-label">Total Comments:</span>
            <span class="detail-value">${results.totalComments}</span>
          </div>
        </div>
        <div class="emotion-breakdown">
          <h4>Emotion Breakdown</h4>
          <div class="emotion-list">
            ${Object.entries(results.emotions)
              .map(
                ([emotion, value]) => `
              <div class="emotion-item">
                <div class="emotion-info">
                  <span>${
                    emotion.charAt(0).toUpperCase() + emotion.slice(1)
                  }</span>
                  <span class="emotion-value">${value}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress" style="width: ${value}%; background-color: ${getEmotionColor(
                  emotion
                )};"></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    showNotification("Analysis completed successfully", "success");
  } catch (error) {
    resultsDiv.innerHTML =
      '<div class="error">Error analyzing comments. Please try again.</div>';
    showNotification("Error analyzing comments", "error");
  }
}

function getEmotionColor(emotion) {
  const colors = {
    joy: "#22c55e",
    sadness: "#3b82f6",
    anger: "#ef4444",
    fear: "#8b5cf6",
    surprise: "#f59e0b",
  };
  return colors[emotion] || "#94a3b8";
}

// Emotion keywords mapping
const emotionKeywords = {
  joy: [
    "happy",
    "excited",
    "great",
    "wonderful",
    "amazing",
    "love",
    "joy",
    "delight",
    "fantastic",
    "brilliant",
  ],
  sadness: [
    "sad",
    "unhappy",
    "depressed",
    "miserable",
    "heartbroken",
    "grief",
    "sorrow",
    "unfortunate",
    "tragic",
  ],
  anger: [
    "angry",
    "mad",
    "furious",
    "outraged",
    "hate",
    "terrible",
    "awful",
    "horrible",
    "disgusting",
    "annoying",
  ],
  fear: [
    "scared",
    "afraid",
    "terrified",
    "fearful",
    "worried",
    "anxious",
    "nervous",
    "panic",
    "dread",
    "horrified",
  ],
  surprise: [
    "surprised",
    "shocked",
    "amazed",
    "astonished",
    "unexpected",
    "wow",
    "incredible",
    "unbelievable",
    "stunned",
  ],
};

// Function to analyze text for emotions
function analyzeEmotions(text) {
  const emotions = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
  };

  const words = text.toLowerCase().split(/\s+/);
  let totalEmotions = 0;

  // Count emotion keywords
  words.forEach((word) => {
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.includes(word)) {
        emotions[emotion]++;
        totalEmotions++;
      }
    });
  });

  // Convert to percentages
  if (totalEmotions > 0) {
    Object.keys(emotions).forEach((emotion) => {
      emotions[emotion] = Math.round((emotions[emotion] / totalEmotions) * 100);
    });
  }

  return emotions;
}

// Function to filter comments by emotion
function filterCommentsByEmotion(comments, emotion) {
  return comments.filter((comment) => {
    const words = comment.toLowerCase().split(/\s+/);
    return emotionKeywords[emotion].some((keyword) => words.includes(keyword));
  });
}

// Function to set up quick analysis functionality
function setupQuickAnalysis() {
  const quickAnalyzeBtn = document.getElementById("quick-analyze-btn");
  const quickUrlInput = document.getElementById("quick-url-input");
  const quickResult = document.getElementById("quick-analysis-result");

  // If any of the required elements are missing, return silently
  if (!quickAnalyzeBtn || !quickUrlInput || !quickResult) {
    console.log("Quick analysis elements not found, skipping setup");
    return;
  }

  quickAnalyzeBtn.addEventListener("click", async function () {
    const url = quickUrlInput.value.trim();

    if (!url) {
      showNotification("Please enter a URL to analyze", "error");
      return;
    }

    // Show loading state
    quickResult.innerHTML =
      '<div class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> Analyzing...</div>';

    try {
      // Determine platform
      const platform = url.includes("youtube.com")
        ? "youtube"
        : url.includes("reddit.com")
        ? "reddit"
        : null;

      if (!platform) {
        throw new Error(
          "Unsupported URL. Please enter a YouTube or Reddit URL."
        );
      }

      // Call your FastAPI endpoint
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: platform,
          input: url,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();

      // Process the response data to display results
      quickResult.innerHTML = `
                <div class="analysis-result">
                    <div class="result-header">
                        <div class="result-title">Content Analysis</div>
                        <div class="result-score sentiment-${getSentimentClass(
                          data.sentiment_stats
                        )}">
                            ${calculateOverallSentiment(data.sentiment_stats)}%
                        </div>
                    </div>
                    <div class="emotion-filters">
                        <h4>Filter by Emotion</h4>
                        <div class="emotion-buttons">
                            ${Object.entries(data.emotion_stats)
                              .map(
                                ([emotion, count]) => `
                                <button class="emotion-filter-btn ${emotion}" data-emotion="${emotion}">
                                    <i class="fas fa-${getEmotionIcon(
                                      emotion
                                    )}"></i>
                                    ${
                                      emotion.charAt(0).toUpperCase() +
                                      emotion.slice(1)
                                    } (${count})
                                </button>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                    <div class="filtered-comments">
                        <h4>Sample Comments</h4>
                        <div class="comments-list">
                            ${data.sample_comments
                              .map(
                                (comment) => `
                                <div class="comment-item">
                                    <p>${comment.text}</p>
                                    <div class="comment-emotions">
                                        <span class="sentiment-tag sentiment-${comment.sentiment.label.toLowerCase()}">
                                            ${comment.sentiment.label}
                                        </span>
                                        <span class="emotion-tag ${comment.emotion.label.toLowerCase()}">
                                            ${comment.emotion.label}
                                        </span>
                                    </div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            `;

      // Add event listeners to emotion filter buttons
      document.querySelectorAll(".emotion-filter-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          const emotion = this.dataset.emotion;
          const filteredComments = data.sample_comments.filter(
            (c) => c.emotion.label.toLowerCase() === emotion
          );

          // Update comments list
          const commentsList = document.querySelector(".comments-list");
          commentsList.innerHTML = filteredComments
            .map(
              (comment) => `
                        <div class="comment-item">
                            <p>${comment.text}</p>
                            <div class="comment-emotions">
                                <span class="emotion-tag ${emotion}">
                                    ${
                                      emotion.charAt(0).toUpperCase() +
                                      emotion.slice(1)
                                    }
                                </span>
                            </div>
                        </div>
                    `
            )
            .join("");

          // Update active state
          document
            .querySelectorAll(".emotion-filter-btn")
            .forEach((b) => b.classList.remove("active"));
          this.classList.add("active");
        });
      });

      showNotification("Analysis complete", "success");
    } catch (error) {
      console.error("Error:", error);
      quickResult.innerHTML = `<div class="error-text">Error: ${error.message}</div>`;
      showNotification(error.message, "error");
    }
  });
}

// Helper functions
function getSentimentClass(sentimentStats) {
  const positive = sentimentStats.positive || 0;
  const negative = sentimentStats.negative || 0;
  return positive > negative
    ? "positive"
    : negative > positive
    ? "negative"
    : "neutral";
}

function calculateOverallSentiment(sentimentStats) {
  const total =
    (sentimentStats.positive || 0) +
    (sentimentStats.negative || 0) +
    (sentimentStats.neutral || 0);
  if (total === 0) return 0;
  return Math.round(((sentimentStats.positive || 0) / total) * 100);
}

function getEmotionIcon(emotion) {
  const icons = {
    joy: "smile",
    sadness: "sad-tear",
    anger: "angry",
    fear: "fear",
    surprise: "surprise",
  };
  return icons[emotion] || "comment";
}

// Save recent search
function saveRecentSearch(url, sentimentScore) {
  // Get existing searches
  let recentSearches = JSON.parse(
    localStorage.getItem("recentSearches") || "[]"
  );

  // Add new search
  recentSearches.unshift({
    url: url,
    sentiment: sentimentScore,
    timestamp: new Date().toISOString(),
  });

  // Limit to 5 searches
  if (recentSearches.length > 5) {
    recentSearches = recentSearches.slice(0, 5);
  }

  // Save to localStorage
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));

  // Reload recent searches display
  loadRecentSearches();
}

// Load recent searches
function loadRecentSearches() {
  const recentSearchesContainer = document.getElementById("recent-searches");

  // Get searches from localStorage
  const recentSearches = JSON.parse(
    localStorage.getItem("recentSearches") || "[]"
  );

  if (recentSearches.length === 0) {
    recentSearchesContainer.innerHTML =
      '<div class="placeholder-text">Your recent searches will appear here</div>';
    return;
  }

  // Create HTML for each search
  let html = "";
  recentSearches.forEach((search) => {
    const sentimentClass =
      search.sentiment > 60
        ? "sentiment-positive"
        : search.sentiment < 40
        ? "sentiment-negative"
        : "sentiment-neutral";

    html += `
            <div class="recent-search-item">
                <div class="recent-search-url">${search.url}</div>
                <div class="recent-search-sentiment ${sentimentClass}">${search.sentiment}%</div>
            </div>
        `;
  });

  recentSearchesContainer.innerHTML = html;
}

// Notification function
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${
              type === "success"
                ? "fa-check-circle"
                : type === "error"
                ? "fa-exclamation-circle"
                : "fa-info-circle"
            }"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

  // Add to document
  document.body.appendChild(notification);

  // Add show class after a small delay (for animation)
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Add close button functionality
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }, 5000);
}

// Add smooth scrolling for navigation links
document.querySelectorAll('ul li a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Update active state of nav links
      document.querySelectorAll("ul li a").forEach((link) => {
        link.classList.remove("active");
      });
      this.classList.add("active");
    }
  });
});

// Load custom tracking data
function loadCustomTracking() {
  const customTrackingContainer = document.querySelector(
    ".custom-tracking-list"
  );

  // Dummy tracking data
  const trackingData = [
    {
      id: 1,
      name: "Election Sentiment",
      keywords: ["election", "vote", "democracy", "politics"],
      platforms: ["reddit", "youtube"],
      sentiment: 65,
      volume: 1250,
      trend: "positive",
      lastUpdated: "2 hours ago",
    },
    {
      id: 2,
      name: "Product Launch",
      keywords: ["new product", "launch", "release", "announcement"],
      platforms: ["reddit"],
      sentiment: 78,
      volume: 850,
      trend: "positive",
      lastUpdated: "5 hours ago",
    },
    {
      id: 3,
      name: "Brand Reputation",
      keywords: ["brand", "company", "service", "quality"],
      platforms: ["youtube"],
      sentiment: 45,
      volume: 2100,
      trend: "negative",
      lastUpdated: "1 hour ago",
    },
    {
      id: 4,
      name: "Tech Trends",
      keywords: ["technology", "innovation", "future", "AI"],
      platforms: ["reddit", "youtube"],
      sentiment: 72,
      volume: 1800,
      trend: "positive",
      lastUpdated: "3 hours ago",
    },
  ];

  // Create HTML for each tracking item
  let html = "";
  trackingData.forEach((item) => {
    const sentimentClass =
      item.sentiment > 60
        ? "sentiment-positive"
        : item.sentiment < 40
        ? "sentiment-negative"
        : "sentiment-neutral";

    const trendIcon =
      item.trend === "positive" ? "fa-arrow-up" : "fa-arrow-down";
    const trendClass = item.trend === "positive" ? "positive" : "negative";

    html += `
            <div class="tracking-item">
                <div class="tracking-header">
                    <h4 class="tracking-title">${item.name}</h4>
                    <div class="tracking-actions">
                        <button class="edit-btn" title="Edit tracking">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" title="Delete tracking">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="tracking-details">
                    <div class="tracking-keywords">
                        <i class="fas fa-tags"></i>
                        <span class="tracking-text">${item.keywords.join(
                          ", "
                        )}</span>
                    </div>
                    <div class="tracking-platforms">
                        <i class="fas fa-globe"></i>
                        <span class="tracking-text">${item.platforms.join(
                          ", "
                        )}</span>
                    </div>
                </div>
                <div class="tracking-metrics">
                    <div class="metric">
                        <span class="metric-label tracking-text">Sentiment</span>
                        <span class="metric-value ${sentimentClass}">${
      item.sentiment
    }%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label tracking-text">Volume</span>
                        <span class="metric-value tracking-text">${item.volume.toLocaleString()}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label tracking-text">Trend</span>
                        <span class="metric-value ${trendClass}">
                            <i class="fas ${trendIcon}"></i>
                            ${item.trend}
                        </span>
                    </div>
                </div>
                <div class="tracking-footer">
                    <span class="last-updated tracking-text">Last updated: ${
                      item.lastUpdated
                    }</span>
                </div>
            </div>
        `;
  });

  customTrackingContainer.innerHTML = html;

  // Add event listeners for edit and delete buttons
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const trackingItem = this.closest(".tracking-item");
      const trackingName =
        trackingItem.querySelector(".tracking-title").textContent;
      showNotification(`Editing tracking: ${trackingName}`, "info");
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const trackingItem = this.closest(".tracking-item");
      const trackingName =
        trackingItem.querySelector(".tracking-title").textContent;
      if (confirm(`Are you sure you want to delete "${trackingName}"?`)) {
        trackingItem.remove();
        showNotification(`Deleted tracking: ${trackingName}`, "success");
      }
    });
  });
}

// Hardcoded stats data
const hardcodedStats = {
  totalPosts: "2,547",
  totalComments: "15,892",
  averageSentiment: "68.5%",
  engagementRate: "7.2%",
  platformStats: {
    reddit: {
      posts: "1,234",
      comments: "8,567",
      sentiment: "65.3%",
      engagement: "6.8%",
    },
    youtube: {
      posts: "1,313",
      comments: "7,325",
      sentiment: "71.7%",
      engagement: "7.6%",
    },
  },
  emotionBreakdown: {
    joy: 35,
    sadness: 15,
    anger: 10,
    fear: 8,
    surprise: 12,
    neutral: 20,
  },
  recentSearches: [
    { query: "tech reviews", count: 156, sentiment: "72.3%" },
    { query: "gaming news", count: 143, sentiment: "68.7%" },
    { query: "product launches", count: 98, sentiment: "65.4%" },
    { query: "market trends", count: 87, sentiment: "70.1%" },
    { query: "user feedback", count: 76, sentiment: "63.2%" },
  ],
  advancedMetrics: {
    engagement: 12923,
    posts: 3499,
    activeUsers: 7604,
    impressions: 88014,
    likes: 4495,
    comments: 377,
    shares: 892,
  },
};

// Update dashboard stats
function updateDashboardStats() {
  // Update total stats
  document.getElementById("totalPosts").textContent = hardcodedStats.totalPosts;
  document.getElementById("totalComments").textContent =
    hardcodedStats.totalComments;
  document.getElementById("averageSentiment").textContent =
    hardcodedStats.averageSentiment;
  document.getElementById("engagementRate").textContent =
    hardcodedStats.engagementRate;

  // Update platform stats
  document.getElementById("redditPosts").textContent =
    hardcodedStats.platformStats.reddit.posts;
  document.getElementById("redditComments").textContent =
    hardcodedStats.platformStats.reddit.comments;
  document.getElementById("redditSentiment").textContent =
    hardcodedStats.platformStats.reddit.sentiment;
  document.getElementById("redditEngagement").textContent =
    hardcodedStats.platformStats.reddit.engagement;

  document.getElementById("youtubePosts").textContent =
    hardcodedStats.platformStats.youtube.posts;
  document.getElementById("youtubeComments").textContent =
    hardcodedStats.platformStats.youtube.comments;
  document.getElementById("youtubeSentiment").textContent =
    hardcodedStats.platformStats.youtube.sentiment;
  document.getElementById("youtubeEngagement").textContent =
    hardcodedStats.platformStats.youtube.engagement;

  // Update advanced metrics
  updateAdvancedMetrics();

  // Update emotion breakdown
  const emotionChart = document.getElementById("emotionChart");
  if (emotionChart) {
    const ctx = emotionChart.getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(hardcodedStats.emotionBreakdown),
        datasets: [
          {
            data: Object.values(hardcodedStats.emotionBreakdown),
            backgroundColor: [
              "#FFD700", // joy
              "#4169E1", // sadness
              "#FF4500", // anger
              "#800080", // fear
              "#32CD32", // surprise
              "#808080", // neutral
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  // Update recent searches
  const recentSearchesList = document.getElementById("recentSearches");
  if (recentSearchesList) {
    recentSearchesList.innerHTML = hardcodedStats.recentSearches
      .map(
        (search) => `
            <div class="search-item">
                <div class="search-query">${search.query}</div>
                <div class="search-stats">
                    <span class="search-count">${search.count} posts</span>
                    <span class="search-sentiment">${search.sentiment}</span>
                </div>
            </div>
        `
      )
      .join("");
  }
}

// Function to fetch latest metrics data
function fetchLatestMetrics() {
  // In a real application, this would be an API call
  // For now, we'll simulate the data with random variations

  // Get current values from the hardcoded stats
  const currentMetrics = {
    engagement: parseInt(
      hardcodedStats.advancedMetrics.engagement.toString().replace(/,/g, "")
    ),
    posts: parseInt(
      hardcodedStats.advancedMetrics.posts.toString().replace(/,/g, "")
    ),
    activeUsers: parseInt(
      hardcodedStats.advancedMetrics.activeUsers.toString().replace(/,/g, "")
    ),
    impressions: parseInt(
      hardcodedStats.advancedMetrics.impressions.toString().replace(/,/g, "")
    ),
    comments: parseInt(
      hardcodedStats.advancedMetrics.comments.toString().replace(/,/g, "")
    ),
    shares: parseInt(
      hardcodedStats.advancedMetrics.shares.toString().replace(/,/g, "")
    ),
    ctr: 3.84, // Current CTR value
  };

  // Generate new values with random variations
  const newMetrics = {
    engagement: Math.max(
      0,
      currentMetrics.engagement + Math.floor(Math.random() * 200) - 100
    ),
    posts: Math.max(
      0,
      currentMetrics.posts + Math.floor(Math.random() * 50) - 25
    ),
    activeUsers: Math.max(
      0,
      currentMetrics.activeUsers + Math.floor(Math.random() * 100) - 50
    ),
    impressions: Math.max(
      0,
      currentMetrics.impressions + Math.floor(Math.random() * 500) - 250
    ),
    comments: Math.max(
      0,
      currentMetrics.comments + Math.floor(Math.random() * 10) - 5
    ),
    shares: Math.max(
      0,
      currentMetrics.shares + Math.floor(Math.random() * 20) - 10
    ),
    ctr: Math.max(0.1, currentMetrics.ctr + (Math.random() * 0.4 - 0.2)),
  };

  // Update the hardcoded stats with new values
  hardcodedStats.advancedMetrics = {
    engagement: newMetrics.engagement,
    posts: newMetrics.posts,
    activeUsers: newMetrics.activeUsers,
    impressions: newMetrics.impressions,
    comments: newMetrics.comments,
    shares: newMetrics.shares,
    ctr: newMetrics.ctr,
  };

  return newMetrics;
}

// Function to update advanced metrics with real-time data
function updateAdvancedMetrics() {
  // Fetch latest metrics data
  const latestMetrics = fetchLatestMetrics();

  // Update each metric with the new values
  const metricElements = document.querySelectorAll(
    ".metrics-grid .metric-value"
  );

  // Map of metric titles to their corresponding values
  const metricMap = {
    Engagement: latestMetrics.engagement,
    Posts: latestMetrics.posts,
    "Active Users": latestMetrics.activeUsers,
    Impressions: latestMetrics.impressions,
    Comments: latestMetrics.comments,
    CTR: latestMetrics.ctr.toFixed(2) + "%",
  };

  // Update each metric element
  metricElements.forEach((element) => {
    const metricTitle = element.previousElementSibling.textContent;
    const newValue = metricMap[metricTitle];

    if (newValue !== undefined) {
      // Format the value with commas if it's a number
      const formattedValue =
        typeof newValue === "number" ? newValue.toLocaleString() : newValue;

      // Update the text content
      element.textContent = formattedValue;

      // Add animation effect
      element.classList.add("updated");
      setTimeout(() => {
        element.classList.remove("updated");
      }, 1000);
    }
  });

  // Update latest comments
  fetchLatestComments();
}

// Function to fetch latest comments from API
async function fetchLatestComments(platform = null) {
  const commentsList = document.querySelector(".comments-list");
  if (!commentsList) {
    console.error("Comments list element not found");
    return;
  }

  const commentsSection = document.querySelector(".latest-comments-section h3");
  if (commentsSection) {
    commentsSection.innerHTML = `<i class="fas fa-comment-alt"></i> Top Comments ${
      platform ? `from ${platform}` : ""
    }`;
  }

  try {
    // Show loading state
    commentsList.innerHTML =
      '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading comments...</div>';
    console.log("Fetching top comments...");

    // Make API call to fetch comments
    const url = platform
      ? `http://localhost:8000/top-comments?platform=${encodeURIComponent(
          platform
        )}`
      : "http://localhost:8000/top-comments";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received comments data:", data);

    if (!data.comments || !Array.isArray(data.comments)) {
      throw new Error("Invalid comments data format");
    }

    // Generate HTML for comments with platform-specific styling
    const commentsHTML = data.comments
      .map((comment) => {
        // Choose platform-specific icon
        let platformIcon = "";
        let platformClass = comment.platform.toLowerCase();

        if (platformClass === "youtube") {
          platformIcon = '<i class="fab fa-youtube"></i>';
        } else if (platformClass === "reddit") {
          platformIcon = '<i class="fab fa-reddit-alien"></i>';
        }

        return `
        <div class="comment-item ${comment.sentiment}">
          <div class="comment-header">
            <div class="comment-user">
              <span class="user-name">${comment.user}</span>
              <span class="platform-badge ${platformClass}">${platformIcon} ${
          comment.platform
        }</span>
            </div>
            <span class="sentiment-badge ${comment.sentiment}">${
          comment.sentiment
        }</span>
          </div>
          <div class="comment-content">
            ${comment.content}
          </div>
          <div class="comment-footer">
            <span class="time">${comment.time}</span>
            ${
              platformClass === "youtube"
                ? '<span class="likes"><i class="fas fa-thumbs-up"></i> ' +
                  (Math.floor(Math.random() * 100) + 1) +
                  "</span>"
                : ""
            }
            ${
              platformClass === "reddit"
                ? '<span class="upvotes"><i class="fas fa-arrow-up"></i> ' +
                  (Math.floor(Math.random() * 500) + 1) +
                  "</span>"
                : ""
            }
          </div>
        </div>
      `;
      })
      .join("");

    // Update the comments list with a fade effect
    commentsList.style.opacity = "0";
    setTimeout(() => {
      if (commentsHTML) {
        commentsList.innerHTML = commentsHTML;
      } else {
        commentsList.innerHTML = `<div class="no-comments">
          <i class="fas fa-info-circle"></i>
          ${
            platform
              ? `No comments available for ${platform}`
              : "No comments available"
          }
        </div>`;
      }
      commentsList.style.opacity = "1";
    }, 300);
  } catch (error) {
    console.error("Error fetching comments:", error);
    commentsList.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load comments. Please try again later.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
}

// Initial comments load
function initializeComments() {
  // Initial fetch for all comments
  fetchLatestComments();

  // Add platform filter buttons
  addPlatformFilterButtons();
}

// Add platform filter buttons
function addPlatformFilterButtons() {
  const commentsSection = document.querySelector(".latest-comments-section h3");
  if (!commentsSection) return;

  const filterButtons = document.createElement("div");
  filterButtons.className = "platform-filter-buttons";
  filterButtons.innerHTML = `
    <button class="platform-filter-btn all active" data-platform="all">All</button>
    <button class="platform-filter-btn reddit" data-platform="Reddit">Reddit</button>
    <button class="platform-filter-btn youtube" data-platform="YouTube">YouTube</button>
  `;

  commentsSection.insertAdjacentElement("afterend", filterButtons);

  // Add event listeners to filter buttons
  const buttons = filterButtons.querySelectorAll(".platform-filter-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      buttons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Fetch comments for selected platform
      const platform = button.dataset.platform;
      fetchLatestComments(platform === "all" ? null : platform);
    });
  });
}

// Call this when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeComments();
});

// Start real-time updates for advanced metrics
function startRealTimeUpdates() {
  // Initial update
  updateAdvancedMetrics();

  // Update every 3 seconds
  setInterval(updateAdvancedMetrics, 3000);
}

// Custom Sentiment Tracking
let keywordChart = null;

function initializeCustomTracking() {
  const trackButton = document.getElementById("track-button");
  const keywordInput = document.getElementById("keyword-input");
  const trackingResults = document.getElementById("tracking-results");

  trackButton.addEventListener("click", async () => {
    const keyword = keywordInput.value.trim();
    if (!keyword) {
      alert("Please enter a keyword to track");
      return;
    }

    // Show loading state
    trackingResults.innerHTML =
      '<div class="loading">Analyzing sentiment for "' + keyword + '"...</div>';

    try {
      // Call the backend API to analyze sentiment
      const response = await fetch("/analyze-sentiment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze sentiment");
      }

      const data = await response.json();
      displaySentimentResults(keyword, data);
    } catch (error) {
      trackingResults.innerHTML = `
        <div class="error">
          <i class="fas fa-exclamation-circle"></i>
          Error analyzing sentiment
          <div class="error-details">${error.message}</div>
        </div>
      `;
    }
  });
}

function displaySentimentResults(keyword, data) {
  const trackingResults = document.getElementById("tracking-results");

  // Create sentiment analysis HTML
  const sentimentHTML = `
    <div class="sentiment-analysis">
      <h4>Sentiment Analysis for "${keyword}"</h4>
      
      <div class="keyword-tags">
        <div class="keyword-tag">
          ${keyword}
          <i class="fas fa-times" onclick="clearTracking()"></i>
        </div>
      </div>

      <div class="sentiment-stats">
        <div class="sentiment-stat positive">
          <div class="stat-label">Positive</div>
          <div class="stat-value">${data.positive}%</div>
        </div>
        <div class="sentiment-stat negative">
          <div class="stat-label">Negative</div>
          <div class="stat-value">${data.negative}%</div>
        </div>
        <div class="sentiment-stat neutral">
          <div class="stat-label">Neutral</div>
          <div class="stat-value">${data.neutral}%</div>
        </div>
      </div>

      <div class="sentiment-chart">
        <canvas id="sentimentChart"></canvas>
      </div>

      ${
        data.comments && data.comments.length > 0
          ? `
        <div class="sample-comments">
          <h5>Sample Comments</h5>
          <div class="comments-list">
            ${data.comments
              .map(
                (comment) => `
              <div class="comment-item ${comment.sentiment}">
                <div class="comment-header">
                  <span class="platform">${comment.platform}</span>
                  <span class="sentiment-badge ${comment.sentiment}">
                    ${comment.sentiment}
                  </span>
                </div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-meta">
                  <span class="author">${comment.author}</span>
                  <span class="date">${new Date(
                    comment.date
                  ).toLocaleDateString()}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;

  trackingResults.innerHTML = sentimentHTML;

  // Create pie chart
  const ctx = document.getElementById("sentimentChart").getContext("2d");

  // Destroy existing chart if it exists
  if (keywordChart) {
    keywordChart.destroy();
  }

  keywordChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [
        {
          data: [data.positive, data.negative, data.neutral],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)", // Green for positive
            "rgba(239, 68, 68, 0.8)", // Red for negative
            "rgba(148, 163, 184, 0.8)", // Gray for neutral
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(148, 163, 184, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            font: {
              size: 14,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.raw}%`;
            },
          },
        },
      },
    },
  });
}

function clearTracking() {
  const trackingResults = document.getElementById("tracking-results");
  const keywordInput = document.getElementById("keyword-input");

  // Clear input and results
  keywordInput.value = "";
  trackingResults.innerHTML = `
    <div class="placeholder-message">
      Enter a keyword to start tracking sentiment
    </div>
  `;

  // Destroy chart if it exists
  if (keywordChart) {
    keywordChart.destroy();
    keywordChart = null;
  }
}

// Initialize custom tracking when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeCustomTracking();
});

// Helper function to show loading state
function showLoading() {
  const button = document.querySelector(".fetch-button");
  if (button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
  }
}

// Helper function to hide loading state
function hideLoading() {
  const button = document.querySelector(".fetch-button");
  if (button) {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-search"></i> Analyze';
  }
}

// Helper function to show error message
function showError(message) {
  const errorDiv = document.querySelector(".error-message");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  } else {
    alert(message);
  }
}

// Helper function to update UI with response data
function updateUI(data) {
  // Update platform stats
  updatePlatformStats(data);

  // Update sentiment chart
  updateSentimentChart(data.sentiment);

  // Update emotion breakdown
  updateEmotionBreakdown(data.emotions);

  // Update advanced metrics
  updateAdvancedMetrics(data.metrics);

  // Add to recent searches
  addToRecentSearches(data.url);
}
