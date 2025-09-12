#  PromptGod

PromptGod is a powerful Chrome extension designed to elevate your prompt engineering skills on the fly. It intelligently analyzes the AI service you're using and enhances your prompts based on best practices, ensuring you get the best possible output every time.

---
## 🚀 Features

* **Automatic Site Analysis (Agent 1):** The first time you use PromptGod on a new AI website (like RunwayML, Midjourney, etc.), it analyzes the site to understand its generative AI capabilities and saves this "map" for future use.
* **Context-Aware Function Selection:** The UI dynamically displays the specific AI functions available on the current site, allowing you to choose the one you're using (e.g., "Text to Image", "Code Generation").
* **Expert Rule Generation (Agent 2):** For each function on a site, PromptGod researches and generates a master "system prompt" detailing the best practices, keywords, and structures for optimal results. This is cached for efficiency.
* **Intelligent Prompt Enhancement (Agent 3):** Your simple prompt is intelligently rewritten and optimized based on the expert rules, transforming it into a detailed, high-quality prompt.
* **Sleek, Modern UI:** A user-friendly, non-intrusive modal with a frosted glass effect and smooth animations makes the experience seamless.
* **Built-in History:** Automatically saves your original and enhanced prompts to your browser's local storage. Your history is fully searchable and filterable by function.

---
## 🛠️ Tech Stack

* **Frontend:** Chrome Extension (Manifest V3), HTML, CSS, JavaScript
* **Backend:** Python, Flask
* **Database:** Google Firestore
* **AI:** Google Gemini API (Pro / Flash models)
* **Deployment:** Google Cloud Run (recommended), Docker

---
## 📂 Project Structure
```
promptgod/
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
│   ├── setup.bat        
│   └── runlocal.bat      
└── chrome-extension/
├── icons/
├── background.js
├── content.js
├── manifest.json
├── modal.html
├── modal.css
├── modal.js
└── options.html
```

---
## ⚙️ Setup and Installation

### Prerequisites
* [Git](https://git-scm.com/)
* [Python 3.9+](https://www.python.org/)
* [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Part 1: Firebase Setup (The Database)
PromptGod uses Firestore for its database. The free "Spark Plan" is more than enough.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and select your existing Google Cloud Project (or create a new one).
3.  In the Firebase Console, navigate to **Build > Firestore Database**.
4.  Click **"Create database"**.
5.  Select **Start in production mode** and choose a region for your database.
6.  Click **Enable**. Your database is now ready.

### Part 2: Local Backend Setup (For Development)
These steps will get the Python backend running on your local machine.

1.  **Clone the repository:**
    ```sh
    git clone <your-repo-url>
    cd promptgod/backend
    ```

2.  **Get Service Account Credentials:**
    * To allow your local server to talk to Firestore, you need a service account key.
    * Follow the instructions in the [Google Cloud documentation](https://cloud.google.com/iam/docs/keys-create-delete#creating) to create a key for a service account.
    * Download the JSON file, rename it to `key.json`, and place it inside the `backend` folder.

3.  **Run the Setup Script:**
    * Double-click the `setup.bat` script.
    * This will automatically create a Python virtual environment and install all required dependencies.

4.  **Run the Local Server:**
    * Double-click the `runlocal.bat` script.
    * This will activate the environment and start the Flask server at `http://127.0.0.1:5000`.

### Part 3: Chrome Extension Setup (For Development)
1.  **Configure the URL:**
    * Open `chrome-extension/background.js`.
    * Make sure the `BACKEND_URL` constant is set to your local server: `const BACKEND_URL = 'http://127.0.0.1:5000';`.

2.  **Load the Extension:**
    * Open Chrome and navigate to `chrome://extensions`.
    * Enable **"Developer mode"** in the top-right corner.
    * Click **"Load unpacked"** and select the `chrome-extension` folder.

3.  **Set Your API Key:**
    * Find the PromptGod extension in your extensions list and click on its "Options".
    * Enter your Google Gemini API Key and select your preferred model.

---
## ☁️ Deployment to Google Cloud Run

### Part 1: Prepare the Backend Code
For deployment, your code authenticates automatically and doesn't need the `key.json` file. Ensure your `main.py` uses the standard, environment-aware client initialization.

* Open `backend/main.py` and make sure the Firestore initialization block looks like this:
    ```python
    # Environment-aware client for production
    try:
        db = firestore.Client()
        print("✅ Firestore client initialized successfully!")
    except Exception as e:
        print(f"❌ FATAL ERROR: Could not initialize Firestore client: {e}")
        db = None
    ```

### Part 2: Deploy
1.  Open a terminal and navigate to the `backend` directory.
2.  Set your gcloud project:
    ```sh
    gcloud config set project YOUR_PROJECT_ID
    ```
3.  Run the deployment command:
    ```sh
    gcloud run deploy promptgod-service --source . --platform managed --region us-central1 --allow-unauthenticated
    ```
    * This command builds your container, pushes it to the registry, and deploys it to Cloud Run.
    * When finished, it will give you a **Service URL**. Copy this URL.

### Part 3: Configure the Deployed Extension
1.  Go back to `chrome-extension/background.js`.
2.  Change the `BACKEND_URL` constant to your new Cloud Run **Service URL**.
    ```javascript
    const BACKEND_URL = '[https://promptgod-service-xxxxxxxxxx-uc.a.run.app](https://promptgod-service-xxxxxxxxxx-uc.a.run.app)';
    ```
3.  Go to `chrome://extensions` and click the "Reload" button for your PromptGod extension.

Your extension is now fully deployed and running in the clou
