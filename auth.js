/**
 * JanVichar Authentication Module
 * Handles user authentication, sessions, and related utilities
 */

// Sample users for demo purposes
const DEMO_USERS = [
  {
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    password: "password123",
  },
  {
    id: 2,
    name: "Test Account",
    email: "test@example.com",
    password: "test123",
  },
];

// Authentication state
const AUTH = {
  isAuthenticated: false,
  currentUser: null,
  token: null,

  // Check if user is logged in based on localStorage
  initialize() {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        this.token = token;
        this.currentUser = JSON.parse(userData);
        this.isAuthenticated = true;
        this.updateUIForAuthenticatedUser();
        return true;
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        this.logout();
      }
    }
    return false;
  },

  // Demo login - in production this would call an API
  login(email, password) {
    // Simulate API request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = DEMO_USERS.find(
          (u) => u.email === email && u.password === password
        );

        if (user) {
          // Create a fake token
          const token = `demo_token_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 15)}`;

          // Remove password from user object before storing
          const { password, ...safeUserData } = user;

          // Store in localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("user_data", JSON.stringify(safeUserData));

          // Update auth state
          this.isAuthenticated = true;
          this.currentUser = safeUserData;
          this.token = token;

          this.updateUIForAuthenticatedUser();
          resolve(safeUserData);
        } else {
          reject(new Error("Invalid email or password"));
        }
      }, 800); // Simulate network delay
    });
  },

  // Demo signup - in production this would call an API
  signup(name, email, password) {
    // Simulate API request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if user already exists
        if (DEMO_USERS.some((u) => u.email === email)) {
          reject(new Error("User with this email already exists"));
          return;
        }

        // Create new user
        const newUser = {
          id: DEMO_USERS.length + 1,
          name,
          email,
          password, // In a real app, this would be hashed on the server
        };

        // Add to demo users
        DEMO_USERS.push(newUser);

        // Log in the new user
        this.login(email, password).then(resolve).catch(reject);
      }, 1000); // Simulate network delay
    });
  },

  // Logout user
  logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    this.isAuthenticated = false;
    this.currentUser = null;
    this.token = null;
    this.updateUIForUnauthenticatedUser();
  },

  // Update UI based on authentication status
  updateUIForAuthenticatedUser() {
    // Hide login/signup buttons
    const authButtons = document.querySelector(".auth-buttons");
    if (authButtons) {
      const loginBtn = authButtons.querySelector(".login-btn");
      const signupBtn = authButtons.querySelector(".signup-btn");

      if (loginBtn) loginBtn.style.display = "none";
      if (signupBtn) signupBtn.style.display = "none";

      // Add user info and logout button
      const userInfoEl = document.createElement("div");
      userInfoEl.classList.add("user-info");
      userInfoEl.innerHTML = `
        <span class="user-greeting">Hello, ${this.currentUser.name}</span>
        <a href="#" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;

      authButtons.appendChild(userInfoEl);

      // Add logout functionality
      const logoutBtn = userInfoEl.querySelector(".logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.logout();
          window.location.reload();
        });
      }
    }
  },

  // Update UI for logged out state
  updateUIForUnauthenticatedUser() {
    // Show login/signup buttons
    const authButtons = document.querySelector(".auth-buttons");
    if (authButtons) {
      const userInfo = authButtons.querySelector(".user-info");
      if (userInfo) {
        authButtons.removeChild(userInfo);
      }

      const loginBtn = authButtons.querySelector(".login-btn");
      const signupBtn = authButtons.querySelector(".signup-btn");

      if (loginBtn) loginBtn.style.display = "flex";
      if (signupBtn) signupBtn.style.display = "flex";
    }
  },
};

// Initialize auth state on page load
document.addEventListener("DOMContentLoaded", () => {
  AUTH.initialize();
});

// Form validation utility
function validateForm(form) {
  let isValid = true;

  // Basic email validation
  const emailInput = form.querySelector('input[type="email"]');
  if (emailInput && !isValidEmail(emailInput.value)) {
    showError(emailInput, "Please enter a valid email address");
    isValid = false;
  }

  // Password validation
  const passwordInput = form.querySelector('input[type="password"]');
  if (passwordInput && passwordInput.value.length < 6) {
    showError(passwordInput, "Password must be at least 6 characters");
    isValid = false;
  }

  // Password confirmation
  const confirmInput = form.querySelector("#confirm-password");
  if (
    confirmInput &&
    passwordInput &&
    confirmInput.value !== passwordInput.value
  ) {
    showError(confirmInput, "Passwords do not match");
    isValid = false;
  }

  return isValid;
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show error message for a form field
function showError(inputElement, message) {
  const formGroup = inputElement.closest(".form-group");

  // Remove any existing error message
  const existingError = formGroup.querySelector(".error-message");
  if (existingError) {
    formGroup.removeChild(existingError);
  }

  // Add new error message
  const errorDiv = document.createElement("div");
  errorDiv.classList.add("error-message");
  errorDiv.textContent = message;
  formGroup.appendChild(errorDiv);

  // Highlight the input
  inputElement.classList.add("error");

  // Remove error when input changes
  inputElement.addEventListener(
    "input",
    () => {
      inputElement.classList.remove("error");
      const error = formGroup.querySelector(".error-message");
      if (error) {
        formGroup.removeChild(error);
      }
    },
    { once: true }
  );
}

// Export auth module
window.AUTH = AUTH;
