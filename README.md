# 🚀 BeauWise: Backend API

This repository contains the backend infrastructure for **BeauWise**, utilizing Express, Firebase Cloud Functions, and a containerized Typesense search engine.

> **BeauWise** is an AI-powered cosmetic ingredient analysis and suitability assessment system. It uses OCR and Large Language Models (LLMs) to scan product labels, evaluate ingredient safety,
> and recommend alternatives tailored to a user's specific facial skin and hair profile.
>
> Beauwise is implemented for everyday consumers to make safe, informed decisions by decoding complex ingredient lists.
> Grounded in verified dermatological science rather than brand marketing,
> it minimizes the trial and error of finding suitable cosmetics, acts as an educational tool for skincare professionals,
> and promotes industry transparency by highlighting FDA-compliant products.
>
> **Core Features**
>
> - **Ingredient Scanning (OCR):** Extracts text directly from physical product labels.
> - **AI-Assisted Analysis:** Leverages LLMs to evaluate the safety, suitability, and purpose of extracted ingredients.
> - **Personalized Recommendations:** Uses content-based filtering to suggest alternative active ingredients aligned with the user's personal skin and hair profile.
> - **FDA Product Verification:** Checks a cosmetic product's regulatory legitimacy and notification status.
> - **Batch Code Lookup:** Determines a product's freshness and safe usage period.
> - **Educational Module:** Debunks cosmetic myths and educates users on ingredient science.
>
> Learn More: **[BeauWise](https://beauwise.tech)**

<br/>

## 🌐 Project Ecosystem

This repository is part of a larger project. You can find the other components here:

- **[Backend Server Repo](https://github.com/navi-cc/beauwise-server) (You are here)** - The core API and database.
- [Web Client Repo](https://github.com/navi-cc/admin-beauwise) - The admin web app.
- [Mobile Client Repo](https://github.com/Shelsss/Group3-BeauWise) - The android app.

<br/>

## 🛠 Tech Stack

- **Runtime:** Node.js (v22.19.0)
- **Framework:** Express
- **Serverless:** Firebase Cloud Functions (`onCall` for mobile, `onRequest` for Express)
- **Search:** Typesense (v30.2) via Docker Compose
- **Local Dev:** Firebase Local Emulator Suite (requires Java v21.0.11)

<br/>

## 📋 Prerequisites

Before running the server locally, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v22.19.0)
- [Java JDK](https://www.oracle.com/java/technologies/downloads/) (v21.0.11) - _Required by the Firebase Emulator_
- [Docker](https://www.docker.com/) & Docker Compose - _Required for Typesense_

<br/>

## 🔐 Authentication & Service Account

This project uses a Google Cloud Service Account to authenticate the Firebase Admin SDK and the Google Cloud Vision API during local development.

1. Request the `service-account.json` file from the team lead.
2. Place the file in the root directory of this repository.
3. **CRITICAL:** Ensure `service-account.json` is listed in your `.gitignore`. Never commit this file.

Set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the file path of the JSON file that contains your service account key.
This variable only applies to your current shell session, so if you open a new session, set the variable again.

Linux

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-file.json"
```

Windows

```bash
$env:GOOGLE_APPLICATION_CREDENTIALS=".\service-account-file.json"
```

<br/>

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following keys. Reach out to the team lead for the secret values.

```ini
# API Keys
GEMINI_API_KEY=
GEMINI_API_KEY_TWO=
MAILER_SEND_API_KEY=
FB_WEB_API_KEY=

# Security
OTP_SECRET=

# Typesense Configuration
TYPESENSE_API_KEY=xyz
TYPESENSE_API_PORT=443
TYPESENSE_DATA_DIR=./typesense-data
```

<br/>

## 🚀 Local Development Setup

1. Install Dependencies

```bash
npm install
```

2. Start Typesense (Docker)
   Ensure your Docker daemon is running, then spin up the container

```bash
docker compose up -d
```

3. Start the Dev Server & Firebase Emulator
   Make sure you have exported your `GOOGLE_APPLICATION_CREDENTIALS` in your current terminal session first, then run

```bash
npm run dev
```
