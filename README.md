# 🛡️ Aegis — AI-Powered Digital Twin Cybersecurity Scanner

![Python](https://img.shields.io/badge/Python-3.13-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Flask](https://img.shields.io/badge/Flask-3.1-black?style=flat-square&logo=flask)
![ML](https://img.shields.io/badge/ML-scikit--learn-orange?style=flat-square&logo=scikit-learn)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> A full-stack network vulnerability scanner that creates a **digital twin** of your real network — discovering assets, scanning ports with nmap, fetching real CVEs from the US Government NVD database, and using Machine Learning to prioritize which vulnerabilities to fix first.

---

## 🚀 What It Does

Most networks have unknown vulnerabilities. Aegis automates the complete security audit pipeline:
```
Discover Assets → Scan Ports (nmap) → Fetch CVEs (NVD API) → ML Risk Scoring → AI Prioritization → PDF Report
```

The same workflow used by enterprise tools like **Nessus** and **Qualys** — but free and open source.

---

## ✨ Features

- 🔍 **Real Network Scanning** — nmap scans up to 65,535 ports per host
- 🌐 **CVE Enrichment** — fetches real vulnerability data from the US Government NVD API
- 🤖 **ML Risk Scoring** — scikit-learn Random Forest model (95.6% accuracy) trained on 12 security features
- 📊 **AI Prioritization** — scores vulnerabilities 0–100 for fix-first recommendations
- 🕸️ **Attack Path Simulation** — graph-based attack path modeling using NetworkX
- ⚡ **Real-time Updates** — live scan progress via WebSocket (Socket.IO)
- 📄 **PDF Reports** — auto-generated professional security reports
- 🔐 **JWT Authentication** — secure login with token revocation
- 🖥️ **Modern Dashboard** — React.js frontend with live risk scores

---

## 🗂️ Project Structure
```
digital_twin_project/
├── backend/
│   ├── ai/                  # Attack graph, prioritization, network risk
│   ├── api/                 # REST API routes (scans, VMs, insights)
│   ├── ml/                  # Random Forest model + training data
│   ├── scanner/             # nmap runner, XML parser, CVE parser
│   ├── reporting/           # PDF report generation
│   ├── app.py               # Flask app entry point
│   ├── auth.py              # JWT authentication
│   ├── models.py            # SQLAlchemy database models
│   └── scheduler.py         # Automated scan scheduler
│
├── frontend-ui/             # ✅ THIS IS THE ACTUAL FRONTEND (React.js)
│   └── src/
│       ├── components/      # Dashboard, Scans, Assets, Reports, Settings
│       ├── context/         # Auth context (JWT)
│       └── services/        # API, auth, socket services
│
└── frontend/                # ⚠️ IGNORE THIS FOLDER (empty, not used)
```

---

## 🧠 How the ML Model Works

The Random Forest model is trained on **12 security features**:

| Feature | Description |
|---|---|
| CVSS Score | Base severity rating |
| Exploit Available | Public exploit exists? |
| Internet Exposed | Port accessible from internet? |
| Patch Age | Days since last update |
| CVE Count | Number of known CVEs |
| Is Misconfigured | Default settings/passwords? |
| Service Risk Level | Database > Web > Other |
| Network Depth | Edge vs internal asset |
| Critical Service | Is it a critical system? |
| Authentication Required | Login protected? |
| Port Number | Known high-risk ports |
| Service Popularity | How commonly targeted |

**Output:** Risk Score 0–20 per vulnerability → combined into Priority Score 0–100

**Accuracy: 95.6%** on test data

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.13+
- Node.js 18+
- nmap installed → https://nmap.org/download.html

### Backend
```bash
cd backend
py -3.13 -m pip install flask flask-sqlalchemy flask-jwt-extended flask-socketio flask-cors flask-migrate flask-mail fpdf2 python-nmap apscheduler networkx slack_sdk bcrypt scikit-learn pandas numpy
py -3.13 -m flask db init
py -3.13 -m flask db migrate -m "init"
py -3.13 -m flask db upgrade
py -3.13 create_admin.py
py -3.13 ml/train_model.py
py -3.13 app.py
```

### Frontend
```bash
cd frontend-ui
npm install
npm start
```

Open browser at http://localhost:3000 and login with admin credentials.

---

## 🔬 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, CSS, Socket.IO client |
| Backend | Python Flask, Flask-SocketIO |
| Scanner | nmap + python-nmap |
| CVE Data | NVD API v2.0 (US Government) |
| ML Model | scikit-learn Random Forest |
| Graph AI | NetworkX |
| Database | SQLite via SQLAlchemy |
| Auth | JWT + bcrypt |
| Reports | fpdf2 |
| Real-time | WebSocket (Socket.IO) |

---

## 🔭 Future Improvements

- [ ] Deploy on Linux server with PostgreSQL
- [ ] Add NVD API key for faster CVE lookup
- [ ] Implement 2FA authentication
- [ ] HTTPS/SSL support
- [ ] Email/Slack alerts on critical findings
- [ ] Attack simulation API endpoint

---

## 👨‍💻 Author

**Jeet Avinash Mhatre**
B.Tech CSE (IoT & Cybersecurity) — VIT Pune

- GitHub: https://github.com/JeetM64
- LinkedIn: https://linkedin.com/in/jeet-mhatre-a708b1249
