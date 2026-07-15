<div align="center">
<h1>KEPLER 🚀</h1>

### An AI-Powered Autonomous Space Traffic Management Platform
</div>


<p align="center">
  <img src="https://img.shields.io/badge/Space-Tech-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Powered-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Active%20Development-red?style=for-the-badge" />
</p>

---

<!-- CONTRIBUTORS_START -->
<div align="center">
  
<h1>Contributors 👥</h1>

<a href="https://github.com/krishkhinchi"><img src="https://github.com/krishkhinchi.png" width="50px" style="border-radius:50%;margin:5px;" alt="krishkhinchi" /></a>
<a href="https://github.com/Diwakar-odds"><img src="https://github.com/Diwakar-odds.png" width="50px" style="border-radius:50%;margin:5px;" alt="Diwakar-odds" /></a>
<a href="https://github.com/KrupaShah20"><img src="https://github.com/KrupaShah20.png" width="50px" style="border-radius:50%;margin:5px;" alt="KrupaShah20" /></a>
<a href="https://github.com/Priteshsolanki12"><img src="https://github.com/Priteshsolanki12.png" width="50px" style="border-radius:50%;margin:5px;" alt="Priteshsolanki12" /></a>
<a href="https://github.com/deepmhatre13"><img src="https://github.com/deepmhatre13.png" width="50px" style="border-radius:50%;margin:5px;" alt="deepmhatre13" /></a>
<a href="https://github.com/zuveriyakhan05"><img src="https://github.com/zuveriyakhan05.png" width="50px" style="border-radius:50%;margin:5px;" alt="zuveriyakhan05" /></a>
<a href="https://github.com/Amayyas"><img src="https://github.com/Amayyas.png" width="50px" style="border-radius:50%;margin:5px;" alt="Amayyas" /></a>
<a href="https://github.com/tapheret2"><img src="https://github.com/tapheret2.png" width="50px" style="border-radius:50%;margin:5px;" alt="tapheret2" /></a>

</div>
<!-- CONTRIBUTORS_END -->

---

# 🌍 Overview

Kepler is an AI-powered Orbital Intelligence Platform designed to monitor satellites, track space debris, predict collision risks, and generate autonomous avoidance recommendations.

The project addresses one of the fastest-growing challenges in modern space operations:

> The increasing congestion of Earth's orbital environment.

As thousands of new satellites enter orbit and space debris continues to accumulate, the probability of orbital collisions rises dramatically.

Kepler provides:

* Real-time orbital visualization
* Satellite and debris tracking
* Collision prediction
* Conjunction analysis
* Orbital risk assessment
* Autonomous maneuver recommendations
* Space weather monitoring
* Orbital intelligence dashboards

The platform combines modern AI systems, orbital mechanics, data visualization, and predictive analytics into a unified operational command center.

---

## ✨ Features

* 🛰️ Live Satellite Tracking
* ☄️ Space Debris Monitoring
* ⚠️ AI-Based Collision Prediction
* 📊 Orbital Risk Assessment
* 🤖 Multi-Agent AI Decision System
* 🌍 Digital Twin Earth Visualization
* 🚀 Autonomous Collision Avoidance Recommendations
* 🌞 Space Weather Monitoring
* 📈 Interactive Dashboard & Analytics
* 🔄 Real-time Orbital Data Processing

---

## 🏗️ Tech Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* CesiumJS
* Redux Toolkit

### Backend

* FastAPI
* Python
* MongoDB
* Motor / PyMongo

### AI & Data Processing

* OpenAI API
* LangGraph
* NumPy
* Pandas
* Scikit-learn

### Space Data Sources

* Space-Track
* CelesTrak
* NASA DONKI
* NOAA SWPC

### DevOps

* Docker
* Docker Compose
* GitHub Actions

---

# 📂 Project Structure

```text
Kepler/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── store/
│   ├── services/
│   ├── utils/
│   ├── assets/
│   └── styles/
│
├── backend/
│   ├── app/
│   ├── api/
│   ├── services/
│   ├── ai/
│   ├── orbital/
│   ├── database/
│   ├── models/
│   ├── schemas/
│   ├── middleware/
│   └── utils/
│
├── docs/
├── datasets/
├── scripts/
├── docker/
├── tests/
│
├── .env
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

# 🚀 Getting Started

## 1. Fork the Repository

Click the **Fork** button at the top-right of this repository.

---

## 2. Clone Your Fork

```bash
git clone https://github.com/<your-username>/Kepler.git
```

---

## 3. Navigate to the Project

```bash
cd Kepler
```

---

## 4. Add the Original Repository as Upstream

```bash
git remote add upstream https://github.com/7-Blocks/Kepler.git
```

Verify:

```bash
git remote -v
```

---

## 5. Install Backend Dependencies

```bash
cd backend

pip install -r ../requirements.txt
```

---

## 6. Install Frontend Dependencies

```bash
cd ../frontend

npm install
```

---

## 7. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
MONGODB_URI=your_mongodb_uri
DATABASE_NAME=kepler

SPACETRACK_USERNAME=your_username
SPACETRACK_PASSWORD=your_password

OPENAI_API_KEY=your_api_key
```

---

## 8. Start MongoDB

Run your local MongoDB instance or connect to MongoDB Atlas.

---

## 9. Run the Backend

```bash
cd backend

uvicorn app.main:app --reload
```

Backend:

```
http://localhost:8000
```

Swagger:

```
http://localhost:8000/docs
```

---

## 10. Run the Frontend

```bash
cd frontend

npm run dev
```

Frontend:

```
http://localhost:5173
```

---

# 🧪 Running Tests

Backend

```bash
pytest
```

Frontend

```bash
npm test
```

---

# 🤝 Contributing

We welcome contributions from developers of all experience levels. Whether you're fixing bugs, improving documentation, or adding new features, your contributions are appreciated.

## Step 1: Sync Your Fork

Before starting new work, sync your fork with the latest changes.

```bash
git checkout main

git fetch upstream

git merge upstream/main
```

---

## Step 2: Create a New Branch

Use a descriptive branch name.

```bash
git checkout -b feature/add-health-endpoint
```

Examples:

```
feature/add-authentication
bugfix/fix-mongodb-sync
docs/update-readme
refactor/improve-api
```

---

## Step 3: Make Your Changes

Implement your feature or bug fix following the project's coding standards.

---

## Step 4: Commit Your Changes

Write clear and meaningful commit messages.

```bash
git add .

git commit -m "feat: add satellite synchronization endpoint"
```

Examples:

```
feat:
fix:
docs:
refactor:
test:
style:
```

---

## Step 5: Push Your Branch

```bash
git push origin feature/add-health-endpoint
```

---

## Step 6: Open a Pull Request

Go to your fork on GitHub and click **New Pull Request**.

Please include:

* A clear description of the changes
* Screenshots (if UI changes)
* Related issue number (if applicable)
* Testing details

---

# 📋 Contribution Guidelines

Please ensure that:

* Your code follows the existing project structure.
* Keep pull requests focused on one feature or fix.
* Write clean and maintainable code.
* Update documentation when necessary.
* Add tests for new functionality whenever possible.
* Run the project locally before submitting a PR.
* Resolve merge conflicts before requesting a review.

---

# 🐞 Reporting Bugs

When reporting a bug, please include:

* Operating System
* Browser (if frontend)
* Python version
* Node.js version
* Steps to reproduce
* Expected behavior
* Actual behavior
* Screenshots or logs (if available)

---

# 💡 Feature Requests

We encourage new ideas.

Before opening a feature request:

* Check existing issues.
* Clearly explain the problem.
* Describe the proposed solution.
* Explain the expected impact.

---

# 📜 Code Style

### Python

* Follow PEP 8
* Use type hints
* Write descriptive function names

### JavaScript / TypeScript

* Use ESLint formatting
* Prefer functional components
* Keep components modular

---

# 🛣️ Roadmap

* Satellite synchronization
* AI collision prediction improvements
* Multi-agent planning
* Digital Twin enhancements
* Space weather analytics
* Orbital maneuver optimization
* Real-time alert system
* Production deployment

---

# 🌟 Support the Project

If you find Kepler useful:

⭐ Star the repository

🍴 Fork the project

🐛 Report issues

💡 Suggest new ideas

🤝 Contribute code

---

# 🏷️ Automatic Labeling System

Kepler uses an automated labeling system powered by GitHub Actions to triage and organize issues and pull requests automatically. This simplifies contribution tracking, prioritizes maintenance work, and streamlines reviews.

## How it Works

The workflow (`.github/workflows/auto-labeler.yml`) triggers on various GitHub events and applies rules defined in the configuration file [.github/labeler-config.js](.github/labeler-config.js).

### 1. Issues
- **Assignment Tracking:** Automatically adds the `assigned` label when an issue is assigned to a contributor. When unassigned, the label is removed *only* if no assignees remain, preventing race conditions.
- **Form Parsing:** Automatically extracts values from issue form dropdown fields:
  - **Priority:** Maps selection to `priority:low`, `priority:medium`, `priority:high`, or `priority:critical`.
  - **Platform:** Maps selection to `website`, `frontend`, `backend`, `api`, or `mobile` (including their respective `type:*` prefixes).
  - **Difficulty:** Maps selection to `level:beginner`, `level:intermediate`, `level:advanced`, and assigns appropriate initial `size:*` labels (e.g. `size:S` for beginner, `size:M` for intermediate).
- **Keyword Matching:** Scans the title and body for key terms to apply labels like `bug`, `documentation`, `enhancement`, `AI`, `database`, `GitHub Actions`, etc.

### 2. Pull Requests
- **Scope Detection:** Scans modified files to automatically apply scope labels:
  - Changes in `frontend/**` -> `frontend`
  - Changes in `backend/**` -> `backend`
  - Changes in `.github/workflows/**` -> `github-actions`
  - Changes in `tests/**` -> `testing`
  - Docker changes -> `docker`
  - Database-related files -> `database`
- **Documentation-Only Changes:** If a pull request modifies *only* documentation paths (e.g., `docs/**`, `README.md`, `*.md`), it will receive the `documentation` label, and other code/scope labels will be bypassed.
- **PR Size Calculation:** Measures the total lines changed (additions + deletions) and applies a size label:
  - `size:XS` (≤ 10 lines)
  - `size:S` (≤ 50 lines)
  - `size:M` (≤ 200 lines)
  - `size:L` (≤ 500 lines)
  - `size/XL` (> 500 lines)
- **Keyword Matching:** Scans PR title and description for keywords.

## How to Configure Rules

All labeling configurations are centralized in [.github/labeler-config.js](.github/labeler-config.js). 

To update or add a new label:
1. Open `.github/labeler-config.js`.
2. Add the label metadata (name, color, description) under the `labels` object (the workflow will automatically create this label in the repository if it doesn't already exist!).
3. Add/edit rules:
   - For issues, add patterns under `issueRules.keywords` or map a new form option under `issueRules.formMappings`.
   - For pull requests, add file glob paths under `prRules.filePatterns` or modify keywords under `prRules.keywords`.

## Troubleshooting

- **Label not added:** Check the GitHub Actions logs for `Automatic Labeler`. It prints detailed information on which rules matched, which labels already existed, and which labels were added.
- **Fork security:** The workflow runs under `pull_request_target` to securely label pull requests from external forks. It checks out the trusted base branch to prevent execution of untrusted code.

---

# 📄 License

This project is licensed under the **MIT License**.

---

## 👥 Maintainers

Developed and maintained by **7-Blocks**.

We appreciate every contribution that helps make Kepler a better open-source platform for autonomous space traffic management.
