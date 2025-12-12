# AniFocus 🎥

**AniFocus** is a lightweight, dark-themed web application designed to help users track their anime watching progress. It utilizes the [Jikan API](https://jikan.moe/) (Unofficial MyAnimeList API) to fetch data and uses **Local Storage** to save your library, meaning no login or backend server is required.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

* **Discover Anime:** Automatically fetches and displays Top Anime upon loading.
* **Search Functionality:** Search for any anime using the Jikan API.
* **Personal Library:** Organize anime into three categories:
    * 👀 Watching
    * ✅ Completed
    * 📅 Plan to Watch
* **Progress Tracking:** Update your episode count directly in the details modal.
* **Data Persistence:** Your list is saved automatically to your browser's Local Storage, so your data remains even after you refresh the page.
* **Responsive Design:** A clean, dark-themed UI that works on desktop and mobile.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **API:** [Jikan API v4](https://jikan.moe/)
* **Storage:** Browser `localStorage`
* **Fonts:** Google Fonts (Roboto)

## 📂 Project Structure

```text
.
├── index.html      # Main HTML structure
├── style.css       # Styling and Dark Mode theme
├── script.js       # API logic, DOM manipulation, and Local Storage management
└── README.md       # Project documentation
