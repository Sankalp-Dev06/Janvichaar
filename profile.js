document.addEventListener("DOMContentLoaded", function () {
  // Theme toggle button functionality
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

    // Update CSS variables for theme colors
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty("--background", "#1a1a1a");
      root.style.setProperty("--foreground", "#ffffff");
      root.style.setProperty("--card", "#2d2d2d");
      root.style.setProperty("--card-foreground", "#ffffff");
      root.style.setProperty("--popover", "#2d2d2d");
      root.style.setProperty("--popover-foreground", "#ffffff");
      root.style.setProperty("--primary", "#8b5cf6");
      root.style.setProperty("--primary-foreground", "#ffffff");
      root.style.setProperty("--secondary", "#3b3b3b");
      root.style.setProperty("--secondary-foreground", "#ffffff");
      root.style.setProperty("--muted", "#3b3b3b");
      root.style.setProperty("--muted-foreground", "#a1a1aa");
      root.style.setProperty("--accent", "#3b3b3b");
      root.style.setProperty("--accent-foreground", "#ffffff");
      root.style.setProperty("--destructive", "#ef4444");
      root.style.setProperty("--destructive-foreground", "#ffffff");
      root.style.setProperty("--border", "#3b3b3b");
      root.style.setProperty("--input", "#3b3b3b");
      root.style.setProperty("--ring", "#8b5cf6");
    } else {
      root.style.setProperty("--background", "#ffffff");
      root.style.setProperty("--foreground", "#0f172a");
      root.style.setProperty("--card", "#ffffff");
      root.style.setProperty("--card-foreground", "#0f172a");
      root.style.setProperty("--popover", "#ffffff");
      root.style.setProperty("--popover-foreground", "#0f172a");
      root.style.setProperty("--primary", "#8b5cf6");
      root.style.setProperty("--primary-foreground", "#ffffff");
      root.style.setProperty("--secondary", "#f1f5f9");
      root.style.setProperty("--secondary-foreground", "#0f172a");
      root.style.setProperty("--muted", "#f1f5f9");
      root.style.setProperty("--muted-foreground", "#64748b");
      root.style.setProperty("--accent", "#f1f5f9");
      root.style.setProperty("--accent-foreground", "#0f172a");
      root.style.setProperty("--destructive", "#ef4444");
      root.style.setProperty("--destructive-foreground", "#ffffff");
      root.style.setProperty("--border", "#e2e8f0");
      root.style.setProperty("--input", "#e2e8f0");
      root.style.setProperty("--ring", "#8b5cf6");
    }

    // Show notification only if explicitly requested
    if (showNotification) {
      showNotification(
        `${isDark ? "Dark" : "Light"} mode ${isDark ? "enabled" : "enabled"}!`,
        "info"
      );
    }
  }

  // Function to initialize theme
  function initializeTheme() {
    const savedTheme = localStorage.getItem("theme-preference");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
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

  // Tab switching functionality
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });

  // Form submission handling
  const forms = document.querySelectorAll(".settings-form");
  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }

      // Simulate API call
      console.log("Saving settings:", data);

      // Show success message
      showNotification("Settings saved successfully!", "success");
    });
  });

  // API key visibility toggle
  const showKeyButtons = document.querySelectorAll(".show-key-btn");
  showKeyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.className = "fas fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "fas fa-eye";
      }
    });
  });

  // API key regeneration
  const regenerateButtons = document.querySelectorAll(".regenerate-key-btn");
  regenerateButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const apiName =
        this.closest(".api-key-item").querySelector("h4").textContent;

      // Simulate API call
      console.log(`Regenerating ${apiName} key...`);

      // Show confirmation dialog
      if (
        confirm(
          `Are you sure you want to regenerate your ${apiName}? This will invalidate your current key.`
        )
      ) {
        // Simulate success
        showNotification(`${apiName} key regenerated successfully!`, "success");
      }
    });
  });

  // Avatar change
  const changeAvatarBtn = document.querySelector(".change-avatar-btn");
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener("click", function () {
      // Create a file input element
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.addEventListener("change", function (e) {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();

          reader.onload = function (e) {
            document.getElementById("profile-avatar").src = e.target.result;
            showNotification(
              "Profile picture updated successfully!",
              "success"
            );
          };

          reader.readAsDataURL(e.target.files[0]);
        }
      });

      fileInput.click();
    });
  }

  // Notification function
  function showNotification(message, type = "info") {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notif) => {
      notif.classList.remove("show");
      setTimeout(() => {
        if (notif.parentNode) notif.remove();
      }, 300);
    });

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

  // Load user data (simulated)
  function loadUserData() {
    // In a real application, this would be an API call
    const userData = {
      name: "John Doe",
      email: "john.doe@example.com",
      role: "Premium User",
      company: "Acme Inc.",
      timezone: "UTC",
      preferences: {
        defaultPlatform: "reddit",
        chartType: "line",
        timeRange: "24h",
        darkMode: localStorage.getItem("theme-preference") === "dark",
        autoRefresh: true,
      },
      notifications: {
        email: true,
        sentimentAlerts: true,
        trendAlerts: true,
        weeklyReports: false,
        frequency: "realtime",
      },
    };

    // Update UI with user data
    document.getElementById("profile-name").textContent = userData.name;
    document.getElementById("profile-email").textContent = userData.email;
    document.getElementById("profile-role").textContent = userData.role;

    document.getElementById("full-name").value = userData.name;
    document.getElementById("email").value = userData.email;
    document.getElementById("company").value = userData.company;
    document.getElementById("timezone").value = userData.timezone;

    document.getElementById("default-platform").value =
      userData.preferences.defaultPlatform;
    document.getElementById("chart-type").value =
      userData.preferences.chartType;
    document.getElementById("time-range").value =
      userData.preferences.timeRange;
    document.getElementById("dark-mode").checked =
      userData.preferences.darkMode;
    document.getElementById("auto-refresh").checked =
      userData.preferences.autoRefresh;

    document.getElementById("email-notifications").checked =
      userData.notifications.email;
    document.getElementById("sentiment-alerts").checked =
      userData.notifications.sentimentAlerts;
    document.getElementById("trend-alerts").checked =
      userData.notifications.trendAlerts;
    document.getElementById("weekly-reports").checked =
      userData.notifications.weeklyReports;
    document.getElementById("notification-frequency").value =
      userData.notifications.frequency;
  }

  // Load user data on page load
  loadUserData();
});
