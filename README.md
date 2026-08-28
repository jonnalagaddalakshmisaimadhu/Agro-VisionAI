# Agro-VisionAI (FarmIQ AI Agro) 🌾🤖
### *Next-Generation AI & IoT Powered Smart Agriculture & Aquaculture Platform*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/Frontend-React%2018.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205.8-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Bundler-Vite%205.4-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PyTorch](https://img.shields.io/badge/Deep%20Learning-PyTorch%202.5-EE4C2C.svg?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn%201.4-F7931E.svg?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Capacitor](https://img.shields.io/badge/Mobile-Capacitor%208-119EFF.svg?style=flat&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![Groq](https://img.shields.io/badge/LLM-Groq%20LLaMA%203.3-F55036.svg?style=flat)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)

---

## 📖 Table of Contents

1. [Project Introduction](#-project-introduction)
2. [Problem Statement](#-problem-statement)
3. [System Architecture](#-system-architecture)
4. [Technology Stack Matrix](#-technology-stack-matrix)
5. [Comprehensive Feature Requirements](#-comprehensive-feature-requirements)
   - [5.1 AI Plant Disease Detection & Botanical Diagnostics](#51-ai-plant-disease-detection--botanical-diagnostics)
   - [5.2 Intelligent Crop & Soil Recommendation Engine](#52-intelligent-crop--soil-recommendation-engine)
   - [5.3 Real-Time Mandi Market Prices & Trend Analytics](#53-real-time-mandi-market-prices--trend-analytics)
   - [5.4 Peer-to-Peer Farm Machinery & Equipment Rental Hub](#54-peer-to-peer-farm-machinery--equipment-rental-hub)
   - [5.5 Farmer-to-Consumer & B2B Produce Marketplace](#55-farmer-to-consumer--b2b-produce-marketplace)
   - [5.6 Government Subsidy & Scheme Aggregator](#56-government-subsidy--scheme-aggregator)
   - [5.7 Hyper-Local Weather Forecasts & Agro-Advisories](#57-hyper-local-weather-forecasts--agro-advisories)
   - [5.8 Aquaculture & Fisheries Management Subsystem (AquaSession)](#58-aquaculture--fisheries-management-subsystem-aquasession)
   - [5.9 Voice-Enabled Multilingual AI Agronomist Chatbot](#59-voice-enabled-multilingual-ai-agronomist-chatbot)
   - [5.10 Tele-Agronomy & Video Expert Consultation](#510-tele-agronomy--video-expert-consultation)
   - [5.11 Real-Time Farmer Community Hub](#511-real-time-farmer-community-hub)
   - [5.12 Profit & Yield ROI Calculator](#512-profit--yield-roi-calculator)
6. [Repository & Directory Structure](#-repository--directory-structure)
7. [Installation & Local Setup Guide](#-installation--local-setup-guide)
8. [Environment Configuration Reference](#-environment-configuration-reference)
9. [REST & WebSocket API Reference](#-rest--websocket-api-reference)
10. [Testing & Quality Assurance](#-testing--quality-assurance)
11. [Future Roadmap](#-future-roadmap)
12. [License & Acknowledgments](#-license--acknowledgments)

---

## 🌟 Project Introduction

**Agro-VisionAI (branded in-app as "FarmIQ AI Agro")** is an enterprise-grade, full-stack smart agriculture and aquaculture intelligence platform. Engineered to transform traditional farming practices through modern artificial intelligence, deep learning, IoT meteorological telemetry, and peer-to-peer digital commerce, Agro-VisionAI provides an all-in-one ecosystem for farmers, agronomists, aquaculture cultivators, equipment owners, and agricultural buyers.

### 🎯 Vision & Mission
- **Democratize Precision Agronomy**: Bring computer vision and deep learning diagnostics directly to the field on low-cost smartphones and web browsers.
- **Eliminate Asymmetric Information**: Provide real-time mandi prices, localized weather advisories, and direct access to government schemes.
- **Boost Farm Profitability**: Maximize yields through machine learning soil-crop matching and reduce operational expenses through equipment-sharing networks and direct-to-buyer marketplaces.
- **Bridge Inland Aquaculture**: Provide specialized telemetry, biomass calculators, and feed optimization for fish and shrimp cultivators.

### 👥 Target Audience & Stakeholders
| User Persona | Key Platform Benefits |
| :--- | :--- |
| **Smallholder & Marginal Farmers** | Instant leaf disease diagnosis, localized crop recommendations, weather alerts, equipment rental on demand. |
| **Commercial Growers & Agri-Enterprises** | Mandi price arbitrage tracking, B2B wholesale marketplace, profit & loss yield estimation. |
| **Aquaculture & Fishery Cultivators** | Water quality telemetry (pH, DO, Salinity), FCR calculators, seed/feed supply trading. |
| **Farm Machinery Owners** | Monetize idle tractors, harvesters, tillers, and sprayers via peer-to-peer bookings. |
| **Agricultural Extension Officers & Experts** | Conduct remote tele-consultations, verify field diagnoses, and guide local farming communities. |

---

## 🛑 Problem Statement

Agriculture forms the backbone of food security and global livelihoods, yet millions of farmers face severe socio-economic and technological bottlenecks:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   THE MODERN FARMING CRISIS                                     │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────┤
│ 🍂 Unidentified Crop Diseases │ 📉 Information Asymmetry        │ 🚜 High Mechanization Costs   │
│ 20% to 40% of global crop     │ Farmers lack real-time mandi    │ Smallholders cannot afford    │
│ yields are lost annually to   │ price transparency and get      │ ₹5L-₹15L tractors &           │
│ pests and preventable fungal/ │ exploited by predatory          │ harvesters, leading to low    │
│ bacterial/viral leaf diseases.│ middlemen.                      │ productivity.                 │
├───────────────────────────────┼─────────────────────────────────┼───────────────────────────────┤
│ 🧪 Inefficient Soil & NPK Use │ 🏛️ Fragmented Subsidies         │ 🐟 Underserved Aquaculture    │
│ Arbitrary fertilizer usage    │ Millions in government grants   │ Aquaculture lacks digital     │
│ degrades soil health, wastes  │ go unclaimed due to opaque      │ tools for water telemetry,    │
│ capital, and lowers yields.   │ eligibility and complex filing. │ feeding rates & seed trade.   │
└───────────────────────────────┴─────────────────────────────────┴───────────────────────────────┘
```

### 💡 How Agro-VisionAI Bridges the Gap
1. **Multi-Model Computer Vision**: Instant 39-class disease detection using a localized 4-stage PyTorch CNN paired with cloud vision fallbacks (Google Gemini 1.5 Flash) and Groq LLaMA 3.3 botanical remedy generators.
2. **Data-Driven Crop & Soil Matching**: Geo-spatial K-Nearest Neighbors (KNN) algorithms mapping coordinates across 700+ Indian districts with real-time Open-Meteo soil moisture/temperature telemetry.
3. **Transparent Price Discovery**: Automated live scraping and ingestion of official Agmarknet and eNAM mandi rates with trend forecasting and custom price alerts.
4. **Shared Equipment Economy**: Uber-style equipment rental matching tractor and machinery owners with local farmers.
5. **Unified Marketplace & Scheme Directory**: Direct farm produce commerce and a curated, auto-synchronized government scheme portal.
6. **Dedicated Aquaculture Suite**: Real-time water parameter monitoring, feed conversion ratio (FCR) calculators, and specialized seafood buyer networks.

---

## 🏛️ System Architecture

Agro-VisionAI is built on a decoupled, asynchronous, service-oriented architecture:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        CLIENT LAYER (FRONTEND)                                    │
│                                                                                                   │
│   React 18.3 (TypeScript) │ Vite 5.4 SPA │ Tailwind CSS 3.4 │ Radix UI / shadcn/ui                │
│   Recharts Visualizations │ TanStack Query │ Web Speech Voice Recognition                         │
│   Capacitor 8 Mobile Container (Android / iOS Native Camera & Geolocation)                       │
└─────────────────────────────────┬───────────────────────────────┬─────────────────────────────────┘
                                  │ HTTP / REST APIs (JSON)       │ WebSocket Streams (WS)
                                  │                               │
┌─────────────────────────────────▼───────────────────────────────▼─────────────────────────────────┐
│                                       SERVER LAYER (BACKEND)                                      │
│                                                                                                   │
│   FastAPI Engine (Python 3.10+) │ Uvicorn Server │ Pydantic v2 DTOs │ JWT (HS256) Security        │
│   15+ Modular Routers │ Async Background Schedulers (2h Mandi Ingestion, 24h Scheme Sync)         │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                      AI & ML INFERENCE ENGINES                                    │
│                                                                                                   │
│   ┌────────────────────────┐    ┌────────────────────────┐    ┌─────────────────────────────────┐ │
│   │  Local Deep Learning   │    │   Geospatial ML (KNN)  │    │     Cloud LLM & Vision APIs     │ │
│   │  • PyTorch 2.5 CNN     │    │  • Scikit-Learn Radian │    │  • Groq LLaMA-3.3-70B Diagnostic│ │
│   │    (39 Leaf Classes)   │    │    District Soil KNN   │    │  • Groq LLaMA-3.1-8B InstantChat│ │
│   │  • Torchvision Engine  │    │  • Haversine Fallback  │    │  • Google Gemini 1.5 Flash Vision││
│   └────────────────────────┘    └────────────────────────┘    └─────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                         PERSISTENCE LAYER                                         │
│                                                                                                   │
│   ┌───────────────────────────────────────────────┐   ┌─────────────────────────────────────────┐ │
│   │  SQLAlchemy Relational ORM                    │   │  Motor Async MongoDB (NoSQL)            │ │
│   │  • SQLite (`farmiq.db`) / PostgreSQL          │   │  • Telemetry Streams & Unstructured Data│ │
│   │  • Users, Products, Equipment, Schemes, Dets  │   │  • IoT Sensor Logs & Chat History       │ │
│   └───────────────────────────────────────────────┘   └─────────────────────────────────────────┘ │
│                                                                                                   │
│   ┌───────────────────────────────────────────────┐   ┌─────────────────────────────────────────┐ │
│   │  Local File Storage (/uploads)                │   │  External Integrations                  │ │
│   │  • Leaf Scans, Equipment Photos, Receipts     │   │  • OpenWeatherMap, Open-Meteo, Agmarknet│ │
│   └───────────────────────────────────────────────┘   └─────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack Matrix

| Category | Technology | Version | Purpose & Implementation Details |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `18.3.1` | Declarative, component-based Single Page Application (SPA). |
| **Programming Language** | TypeScript | `5.8.3` | Type-safe development with strict interfaces for all API payloads. |
| **Build & Tooling** | Vite | `5.4.19` | High-performance build tool with SWC compiler and fast HMR. |
| **Styling & UI Kit** | Tailwind CSS + shadcn/ui | `3.4.17` | High-contrast emerald/slate agritech design system with Radix UI. |
| **Data Visualization** | Recharts | `3.1.2` | Interactive Area, Line, and Bar charts for market trends & telemetry. |
| **Mobile Compilation** | Ionic Capacitor | `8.0.1` | Native Android/iOS runtime packaging with Camera & GPS plugins. |
| **Backend Framework** | FastAPI | `0.110+` | High-speed, async REST & WebSocket web framework for Python. |
| **ASGI Server** | Uvicorn | `0.29+` | Lightning-fast ASGI web server implementation. |
| **Relational Database** | SQLite / PostgreSQL | `SQLAlchemy 2.0+` | User profiles, marketplace listings, equipment rentals, schemes. |
| **Document Database** | MongoDB | `Motor 3.3+` | Async NoSQL storage for sensor telemetry and multi-turn conversations. |
| **Deep Learning** | PyTorch & Torchvision | `2.5.0` / `0.20.0` | Custom 4-stage CNN classifier for 39 plant leaf disease categories. |
| **Machine Learning** | Scikit-Learn | `1.4.0+` | Geospatial K-Nearest Neighbors (KNN) model for district soil prediction. |
| **Generative AI & LLMs**| Groq Cloud API | LLaMA 3.3 / 3.1 | Sub-second agricultural diagnostic structuring & conversational bot. |
| **Multimodal Vision** | Google Gemini 1.5 Flash| `0.24.1` | Zero-shot visual disease classification and server fallback engine. |
| **Weather & IoT Data** | OpenWeather & Open-Meteo| REST | 5-day weather forecasts, soil moisture, and soil temperature at depth. |
| **Market Data Ingestion**| Agmarknet (Data.gov.in)| REST | Official live government mandi prices across Indian states. |
| **Speech Recognition** | Web Speech API | Native | In-browser voice-to-text input in Indian regional languages. |

---

## 🚀 Comprehensive Feature Requirements

Agro-VisionAI comprises 12 distinct functional modules, each engineered to address specific agricultural workflows:

---

### 5.1 AI Plant Disease Detection & Botanical Diagnostics
Provides rapid on-field diagnosis of leaf infections with structured remediation guides.

```
[Leaf Image: Camera / Upload] ──► [Preprocess: 224x224 RGB] ──► [PyTorch CNN (39 Classes)]
                                                                          │
       ┌───────────────────────────◄ (Confidence < 60% or Error) ─────────┘
       ▼
[Google Gemini 1.5 Flash Vision] ──► [Disease Label + Confidence %]
                                                │
                                                ▼
                                   [Groq LLaMA 3.3 70B Engine]
                                                │
       ┌────────────────────────────────────────┴────────────────────────────────────────┐
       ▼                                                 ▼                               ▼
[5 Specific Symptoms]                        [5 Curative Treatments]           [5 Preventive Actions]
```

- **Functional Requirements**:
  - Accept leaf photographs via drag-and-drop, file upload, or real-time camera/webcam capture.
  - Preprocess input to `224x224` RGB tensor with ImageNet normalization.
  - Execute inference against a local **210 MB PyTorch CNN model** (`plant_disease_model_1_latest.pt`) supporting **39 disease categories** across Apple, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Strawberry, Tomato, etc.
  - Implement an **automatic cloud vision fallback** (`gemini-1.5-flash-latest`) if the local model fails or encounters unseen plant species.
  - Feed the detected label to **Groq LLaMA-3.3-70B** in JSON mode to synthesize an **exact 5-point botanical report**:
    - **5 Symptoms**: Observable physiological signs (lesions, chlorosis, wilting).
    - **5 Treatments**: Specific organic/chemical fungicides, bactericides, and curative dosages.
    - **5 Preventions**: Long-term crop rotation, resistant cultivars, and soil aeration practices.
  - Embedded Context-Aware AI Chatbot (`EmbeddedAIChat.tsx`) allowing farmers to ask immediate follow-up questions pre-loaded with the current diagnosis.
  - Scan history storage with timestamps and severity ratings (Low / Medium / High).

---

### 5.2 Intelligent Crop & Soil Recommendation Engine
Matches farm topography, soil chemistry, and micro-climates with high-yield, high-profit crops.

- **Functional Requirements**:
  - Collect farm parameters: Geolocation/District, Farm Size (in Acres), Season (*Kharif*, *Rabi*, *Zaid*), Budget (in INR), and Previous Crop.
  - **Geospatial Soil Classifier (`soil_knn.py`)**: Uses a trained Scikit-learn KNN model (`soil_knn_model.pkl`) mapping latitude/longitude (converted to radians) against an all-India database of 700+ districts to determine dominant soil types (*Alluvial, Black, Red, Laterite, Desert, Mountainous*) and estimated Nitrogen (N), Phosphorus (P), and Potassium (K) levels.
  - **Live Meteorological Sync (`open_meteo.py`)**: Pulls real-time ambient temperature, relative humidity, soil temperature, and volumetric soil moisture from Open-Meteo.
  - **Recommendation Generation**: Evaluates agronomic suitability and outputs **6 ranked crop options** with:
    - Expected Yield (Quintals/Acre)
    - Cultivation Duration (Days)
    - Required Capital Investment (₹)
    - 6-Month Mandi Price Trend Direction
    - **Calculated Net ROI**: $\text{Estimated Profit} = (\text{Yield} \times \text{Mandi Price}) - \text{Investment}$.

---

### 5.3 Real-Time Mandi Market Prices & Trend Analytics
Delivers market price transparency to prevent distress selling and middlemen exploitation.

- **Functional Requirements**:
  - Ingest live price data from the **Government of India Agmarknet API** and eNAM repositories across major agricultural states.
  - Filter and search by State, District, Commodity Category (*Grains, Pulses, Vegetables, Fruits, Oilseeds*), and Quality Grade (*FAQ, Medium, Superior*).
  - Compute price movement indicators: Daily price delta (₹), percentage change (%), and market trend status (*Bullish, Bearish, Stable*).
  - Render interactive **6-month historical price charts** using Recharts (Area and Line charts).
  - **Custom Price Alert Subsystem**: Allows farmers to set price triggers (e.g., *"Notify me when Tomato exceeds ₹35/kg in Kolar Mandi"*).
  - **Automated Background Ingestion**: An asynchronous scheduler (`app/services/scheduler.py`) refreshes mandi data every **2 hours**.

---

### 5.4 Peer-to-Peer Farm Machinery & Equipment Rental Hub
Creates a shared mechanization economy enabling smallholders to access heavy machinery affordably.

- **Functional Requirements**:
  - **Machinery Catalog**: Listings for Tractors, Combine Harvesters, Power Tillers, Rotavators, Solar Water Pumps, and Drone Sprayers.
  - Filter by machinery type, price per hour/day, distance/location, and operator availability.
  - **Booking & Calendar Engine**: Date-range picker with automatic computation of rental duration, total rental cost, security deposit, and booking status workflow (*Pending ➔ Approved ➔ Active ➔ Completed ➔ Cancelled*).
  - **Owner Listing Portal**: Allows equipment owners to list idle machinery with photos, hourly/daily rates, power ratings (HP), and availability status.

---

### 5.5 Farmer-to-Consumer & B2B Produce Marketplace
Direct commerce platform connecting farmers directly with retail consumers, retailers, and wholesale buyers.

- **Functional Requirements**:
  - Produce listing creation with category tags, pricing per kg/quintal, available stock quantity, organic certification badges, and farm location.
  - Buyer discovery catalog with multi-facet filters (Organic, Price Range, Distance).
  - **Direct Inquiry & Chat Modal (`MarketplaceChatModal.tsx`)**: In-app buyer-to-seller negotiation interface.
  - Secure stock deduction and order status management.

---

### 5.6 Government Subsidy & Scheme Aggregator
Demystifies central and state agricultural support programs to maximize subsidy claims.

- **Functional Requirements**:
  - Curated database of major schemes: *PM-KISAN, Pradhan Mantri Fasal Bima Yojana (PMFBY), Sub-Mission on Agricultural Mechanization (SMAM), Soil Health Card Scheme, PM Krishi Sinchayee Yojana (PMKSY), etc.*
  - Filter by category (*Direct Benefit Transfer, Farm Mechanization, Crop Insurance, Irrigation, Solar Subsidies*), State, and eligible crops.
  - Clear breakdown of **Eligibility Criteria**, **Required Documents Checklist**, **Subsidy Percentage (up to 50-80%)**, and direct 1-click links to official application portals.
  - In-app assistance application workflow for guided paperwork submission.
  - Automated background synchronizer refreshing scheme registries every **24 hours**.

---

### 5.7 Hyper-Local Weather Forecasts & Agro-Advisories
Mitigates climate risks through actionable, agriculture-focused meteorological intelligence.

- **Functional Requirements**:
  - Current weather telemetry: Temperature, humidity, barometric pressure, wind speed, precipitation probability, and UV index via OpenWeatherMap.
  - **5-Day / 3-Hour Granular Forecast**: Visualized with temperature and rainfall probability graphs.
  - **Operational Agro-Advisory Index**: Real-time operational feasibility scoring:
    - 🚜 *Field Spraying Suitability* (checks wind speed < 15 km/h and rain probability < 20%)
    - 🌾 *Sowing & Harvesting Windows* (evaluates soil moisture and upcoming precipitation)
    - 💧 *Irrigation Recommendations* (prevents over-irrigation before rain events).

---

### 5.8 Aquaculture & Fisheries Management Subsystem (AquaSession)
A dedicated operations hub tailored for inland fish farms, shrimp hatcheries, and coastal cultivators.

- **Functional Requirements**:
  - **Water Quality Telemetry Monitor (`AquaFarmersView.tsx`)**: Real-time tracking of critical parameters:
    - **pH Level**: Optimal range `7.5 - 8.5` with automated alert triggers.
    - **Dissolved Oxygen (DO)**: Alert threshold `< 5.0 mg/L`.
    - **Salinity & Temperature**: Hourly historical trend charts.
  - **Aquaculture Calculators (`AquaToolsView.tsx`)**:
    - **Feed Conversion Ratio (FCR)**: $\text{FCR} = \frac{\text{Total Feed Given (kg)}}{\text{Total Weight Gained (kg)}}$.
    - **Pond Biomass Estimator**: Computes current total pond biomass from average body weight (ABW) and survival rate.
    - **Daily Feeding Rate & Chemical Dosing**: Calculates optimal daily feed rations and probiotic/lime dosages based on biomass.
  - **Aqua Seed & Feed Marketplace (`AquaMarketplaceView.tsx`)**: Buy and sell fish fingerlings, shrimp post-larvae (PL-10), and specialized formulated feed.
  - **B2B Seafood Buyer Portal (`AquaMarketBuyersView.tsx`)**: Bulk purchasing and export contract matching for harvested fish and shrimp.

---

### 5.9 Voice-Enabled Multilingual AI Agronomist Chatbot
A 24/7 conversational agronomist accessible via text and natural voice commands.

- **Functional Requirements**:
  - Floating global Assistant Widget (`FarmIQAssistance.tsx`) available on every screen.
  - **Voice-to-Text Input**: Integrated Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) supporting natural voice queries.
  - **Sub-Second LLM Inference**: Powered by **Groq Cloud LLaMA-3.1-8B-instant** with tailored agronomic system prompts.
  - Multi-turn context memory retaining conversation context across questions.
  - **Multilingual Localization**: Integrated with Google Translate supporting Indian regional languages (Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Punjabi, Gujarati, Malayalam, etc.).

---

### 5.10 Tele-Agronomy & Video Expert Consultation
Connects farmers with certified agricultural scientists, entomologists, and soil experts.

- **Functional Requirements**:
  - Expert directory with verified credentials, specialty areas (*Plant Pathology, Soil Science, Horticulture, Aquaculture*), and farmer ratings.
  - Scheduled appointment booking system with date and time slot pickers.
  - **Integrated Video Consultation Interface (`VideoSession.tsx`)**: Peer-to-peer video streaming for live leaf and field inspection.

---

### 5.11 Real-Time Farmer Community Hub
Enables localized peer-to-peer farmer collaboration and community pest alerts.

- **Functional Requirements**:
  - Multi-channel **WebSocket broadcast gateway** (`/api/community/ws/{community_id}`).
  - Low-latency message broadcasting across active connected farmer sessions.
  - Community channels for regional farming, localized pest alerts, weather discussions, and equipment sharing.

---

### 5.12 Profit & Yield ROI Calculator
Interactive financial modeling tool for pre-season budgeting and revenue forecasting.

- **Functional Requirements**:
  - Dynamic user input: Crop Type, Land Area (Acres/Hectares), Expected Yield, Seed Cost, Fertilizer/Pesticide Costs, Machinery Rental Costs, and Labor Expenses.
  - Automatic ingestion of current mandi rates for projected gross revenue.
  - Instant calculation of **Gross Revenue**, **Total Production Cost**, **Break-Even Price**, and **Net Profit Margin (%)**.

---

## 📁 Repository & Directory Structure

```
Agro-VisionAI/
├── Frontend/                           # React 18 + TypeScript + Vite Web Application
│   ├── src/
│   │   ├── assets/                     # Platform logos, badges, and SVG illustrations
│   │   ├── components/                 # UI Components and Feature Modules
│   │   │   ├── chatbot/
│   │   │   │   └── FarmIQAssistance.tsx# Floating voice-enabled AI agronomist assistant
│   │   │   ├── common/                 # Shared UI components (GoogleTranslate, ProtectedRoute)
│   │   │   ├── dashboard/              # Main dashboard shell (Header, Sidebar, Content, Footer)
│   │   │   │   ├── DashboardHeader.tsx # Top navigation bar (Location, Notifications, Profile)
│   │   │   │   ├── DashboardSidebar.tsx# Collapsible sidebar with module navigation
│   │   │   │   ├── DashboardMainContent.tsx # Overview statistics, quick metrics, Recharts
│   │   │   │   └── BottomNavigation.tsx# Mobile-responsive bottom navigation bar
│   │   │   ├── modules/                # 12 Core Feature Module Views
│   │   │   │   ├── DiseaseDetection.tsx   # Leaf scanner, camera capture, 5-point diagnosis
│   │   │   │   ├── EmbeddedAIChat.tsx     # Context-aware follow-up diagnostic chatbot
│   │   │   │   ├── CropRecommendation.tsx # IoT & NPK-driven crop advisory system
│   │   │   │   ├── EnhancedMarketPrices.tsx # Live mandi prices, category filters & trends
│   │   │   │   ├── Marketplace.tsx        # Produce marketplace and buy flow
│   │   │   │   ├── FarmMarket.tsx         # Direct farmer produce listing portal
│   │   │   │   ├── EquipmentRental.tsx    # Farm machinery rental catalog & booking
│   │   │   │   ├── GovernmentSchemes.tsx  # Central & State subsidy aggregator
│   │   │   │   ├── WeatherAlerts.tsx      # 5-day weather forecasts & spray advisories
│   │   │   │   ├── ExpertConsultation.tsx # Agronomist directory & appointment booking
│   │   │   │   ├── VideoSession.tsx       # Video consultation interface with specialists
│   │   │   │   ├── AccuracyTest.tsx       # Disease model validation benchmark suite
│   │   │   │   ├── LocationMaps.tsx       # Interactive mandi and agricultural store locator
│   │   │   │   ├── HelpPage.tsx           # Comprehensive user documentation & FAQ
│   │   │   │   └── aqua/                  # Aquaculture & Fisheries Subsystem
│   │   │   │       ├── AquaFarmersView.tsx    # Water telemetry monitor (pH, DO, Temp)
│   │   │   │       ├── AquaMarketplaceView.tsx# Fish seed, shrimp larvae & feed market
│   │   │   │       ├── AquaMarketBuyersView.tsx# Bulk seafood exporter portal
│   │   │   │       ├── AquaToolsView.tsx      # Biomass, FCR & chemical calculators
│   │   │   │       └── AquaExpertsView.tsx    # Fisheries science consultants
│   │   │   ├── ui/                     # 30+ atomic shadcn/ui Radix primitives
│   │   │   ├── Dashboard.tsx           # Authenticated master dashboard orchestrator
│   │   │   ├── LandingPage.tsx         # Public marketing landing page
│   │   │   └── ProfitPredictor.tsx     # Interactive financial ROI calculator widget
│   │   ├── context/                    # React Contexts (AuthContext, LocationContext)
│   │   ├── hooks/                      # Custom hooks (use-toast, use-mobile)
│   │   ├── lib/                        # Firebase auth, styling utilities (clsx/tailwind-merge)
│   │   ├── pages/                      # Page routes (Index, Auth, Profile, Settings, AquaSession)
│   │   ├── services/                   # Typed API service clients for backend REST communication
│   │   ├── types/                      # TypeScript data contracts & model interfaces
│   │   ├── App.tsx                     # Top-level Router & Provider wrapper
│   │   └── main.tsx                    # React DOM root entrypoint
│   ├── public/                         # Static media, equipment photos, aquaculture assets
│   ├── capacitor.config.ts             # Capacitor mobile configuration
│   ├── package.json                    # Frontend dependencies & npm scripts
│   └── vite.config.ts                  # Vite build configuration, chunk splitting & proxy
│
├── Backend/                            # FastAPI Python Backend Application
│   ├── app/
│   │   ├── core/                       # App configuration, environment, JWT security
│   │   │   ├── config.py               # Pydantic BaseSettings, API keys, CORS origins
│   │   │   └── security.py             # JWT token creation/verification, bcrypt hashing
│   │   ├── database.py                 # SQLAlchemy relational database connection & session
│   │   ├── database_mongo.py           # Motor Async MongoDB client connection lifecycle
│   │   ├── models/                     # SQLAlchemy Database Entities (Users, Crops, Equipment, etc.)
│   │   ├── schemas/                    # Pydantic Request & Response Data Transfer Objects (DTOs)
│   │   ├── routers/                    # 15+ REST & WebSocket Route Controllers
│   │   │   ├── auth.py                 # /api/auth (Register, Login, Me, Profile)
│   │   │   ├── disease_detection.py    # /api/disease (Predict, Scan History, Verification)
│   │   │   ├── crop_recommendation.py  # /api/crops (LLaMA 3 + Open-Meteo crop advisory)
│   │   │   ├── weather.py              # /api/weather (OpenWeather forecast, farming tips)
│   │   │   ├── market_prices.py        # /api/market-prices (Agmarknet data, trends, alerts)
│   │   │   ├── farm_market.py          # /api/farm-market (Produce listings)
│   │   │   ├── marketplace.py          # /api/marketplace (Product CRUD & filter)
│   │   │   ├── equipment.py            # /api/equipment (Machinery rental & booking)
│   │   │   ├── government_schemes.py   # /api/schemes (Subsidy search, application)
│   │   │   ├── profit.py               # /api/profit (Crop ROI & yield calculator)
│   │   │   ├── soil_knn.py             # /api/predict-soil (KNN coordinate soil classifier)
│   │   │   ├── soil_district.py        # /api/soil (District CSV soil lookup)
│   │   │   ├── chatbot.py              # /api/chat (Groq LLaMA 3.1 8B instant chat)
│   │   │   ├── community_chat.py       # /api/community/ws/{id} (WebSocket broadcast hub)
│   │   │   └── recommendations.py      # /api/recommendations general router
│   │   ├── services/                   # Business logic, ML models, scrapers & LLMs
│   │   │   ├── disease_detection.py    # PyTorch CNN loader + Gemini vision fallback
│   │   │   ├── groq_service.py         # Groq 5-point botanical diagnostic extraction
│   │   │   ├── chatbot.py              # Async Groq agricultural conversation service
│   │   │   ├── weather.py              # OpenWeatherMap client & agro-advisory index
│   │   │   ├── open_meteo.py           # Open-Meteo IoT sensor & soil moisture client
│   │   │   ├── market_prices.py        # Mandi price ingestion & trend analyzer
│   │   │   ├── agmarknet.py            # Agmarknet Government API integration
│   │   │   ├── government_schemes.py   # Scheme scraper, synchronizer & search
│   │   │   ├── scheduler.py            # Background refresh scheduler (2h / 24h loops)
│   │   │   ├── soil_lookup.py          # Soil district data queries
│   │   │   ├── nlp_service.py          # Rule-based intent & entity parser
│   │   │   └── context_manager.py      # Multi-turn conversation state manager
│   │   └── utils/                      # Profiling and performance utilities
│   ├── data/                           # Geo-referenced datasets & trained KNN models
│   │   └── all_india_csv/
│   │       ├── india_district_soil_with_npk.csv # Geo-referenced India district soil database
│   │       └── soil_knn_model.pkl      # Trained Scikit-Learn Soil KNN Classifier
│   ├── models/                         # PyTorch Deep Learning Models
│   │   ├── CNN.py                      # 4-stage PyTorch CNN architecture class
│   │   ├── Final ML Model/
│   │   │   └── plant_disease_model_1_latest.pt # 210 MB trained PyTorch weights (39 classes)
│   │   ├── disease_info.csv            # Botanical disease knowledge base
│   │   └── supplement_info.csv         # Fertilizer & pesticide recommendations
│   ├── uploads/                        # Uploaded user leaf scans & product photos
│   ├── main.py                         # FastAPI server entrypoint
│   ├── requirements.txt                # Python backend dependencies
│   └── farmiq.db                       # Local SQLite database file
│
├── docs/                               # Developer Guides & Documentation
│   ├── ARCHITECTURE.md                 # System Architecture & Flowchart
│   ├── PRESENTATION_GUIDE.md           # Live Presentation & Demonstration Guide
│   ├── QUICKSTART.md                   # Quick Developer Onboarding
│   ├── Developer_Report.txt            # Full Developer Report & Audit
│   └── FOSS_Solutions_Guide.txt        # Free & Open-Source Software Guide
│
├── start-project.bat                   # 1-Click Startup for Windows (Dual Server Launch)
├── package.json                        # Root package scripts
└── README.md                           # Master Project Documentation
```

---

## ⚡ Installation & Local Setup Guide

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **Python**: `3.10.x` or `3.11.x` ([Download Python](https://www.python.org/))
- **Git**: ([Download Git](https://git-scm.com/))
- *(Optional)* **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas.

---

### Option 1: 1-Click Automated Startup (Windows)
Double-click or execute from PowerShell / Command Prompt:
```cmd
start-project.bat
```
*This launches both the FastAPI backend (port 8000) and the Vite frontend (port 8080) in separate terminal windows.*

---

### Option 2: Step-by-Step Manual Setup

#### Step 1: Clone Repository
```bash
git clone https://github.com/jonnalagaddalakshmisaimadhu/Agro-VisionAI.git
cd Agro-VisionAI
```

#### Step 2: Backend Setup (FastAPI & PyTorch)
```bash
cd Backend

# 1. Create and activate Python virtual environment
python -m venv venv

# Windows (Command Prompt / PowerShell)
.\venv\Scripts\activate
# macOS / Linux
# source venv/bin/activate

# 2. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Create .env file (configure API keys as shown in Environment Reference)
# (Optional: defaults work for offline/demo modes)

# 4. Start FastAPI server
python main.py
```
*Backend API will run at `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.*

#### Step 3: Frontend Setup (React 18 & Vite)
Open a new terminal window:
```bash
cd Frontend

# 1. Install NPM packages
npm install

# 2. Start Vite development server
npm run dev
```
*Frontend Web Application will run at `http://localhost:8080`.*

---

### Option 3: Mobile Native Build (Android via Capacitor)
```bash
cd Frontend

# 1. Build optimized web distribution
npm run build

# 2. Synchronize assets with native Android project
npx cap sync android

# 3. Launch in Android Studio for APK compilation
npx cap open android
```

---

## 🔑 Environment Configuration Reference

### Backend Configuration (`Backend/.env`)
| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `SECRET_KEY` | JWT signing secret key for authentication | `farmiq-secret-key-super-secure-change-in-production` |
| `DATABASE_URL` | Relational database connection string | `sqlite:///./farmiq.db` *(or PostgreSQL URI)* |
| `MONGO_URI` | MongoDB connection string for telemetry | `mongodb://localhost:27017/` |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API Key | `your_openweather_api_key` |
| `GEMINI_API_KEY` | Google Generative AI API Key | `your_google_gemini_api_key` |
| `GROQ_API_KEY` | Groq Cloud API Key (LLaMA 3.3/3.1) | `your_groq_api_key` |
| `AGMARKNET_RESOURCE_ID`| Agmarknet dataset resource identifier | `9ef84268-d588-465a-a308-a864a43d0070` |

### Frontend Configuration (`Frontend/.env.local`)
| Variable | Description | Default / Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend REST/WS API base endpoint | `http://localhost:8000` |
| `VITE_GEMINI_API_KEY` | Google Gemini API key for client calls | `your_gemini_client_api_key` |
| `VITE_GEMINI_MODEL` | Client Gemini vision model name | `gemini-1.5-flash-latest` |
| `VITE_FIREBASE_API_KEY` | Firebase Auth API Key | `your_firebase_api_key` |
| `VITE_FIREBASE_PROJECT_ID`| Firebase Project ID | `your_firebase_project_id` |

---

## 📡 REST & WebSocket API Reference

The backend exposes interactive OpenAPI documentation accessible at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Summary of Core Endpoints

| Router | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/auth/register` | Register new farmer/user account with hashed password. |
| | `POST` | `/api/auth/login` | Authenticate user and return JWT Bearer access token. |
| | `GET` | `/api/auth/me` | Fetch authenticated user profile and farm parameters. |
| | `PUT` | `/api/auth/me` | Update user profile, location, phone, and farm size. |
| **Disease Detection**| `POST` | `/api/disease/predict` | Upload leaf image (base64/file) for PyTorch CNN + Groq 5-point report. |
| | `GET` | `/api/disease/detections` | Fetch historical disease scans for authenticated user. |
| | `GET` | `/api/disease/detections/{id}`| Retrieve specific disease diagnosis details. |
| **Crop Advisory** | `POST` | `/api/crops/recommend` | Submit farm parameters + IoT data to receive 6 ranked crop advisories. |
| **Weather** | `GET` | `/api/weather/current` | Retrieve real-time ambient temperature, humidity, and wind. |
| | `GET` | `/api/weather/forecast` | Retrieve 5-day / 3-hour granular meteorological forecast. |
| | `GET` | `/api/weather/advice` | Get operational farming suitability ratings (spraying, sowing). |
| **Market Prices** | `GET` | `/api/market-prices/prices` | Query active mandi commodity prices by state, district, category. |
| | `GET` | `/api/market-prices/prices/trends`| Retrieve 7-day to 30-day commodity price trends. |
| | `POST` | `/api/market-prices/alerts` | Create custom price threshold alerts. |
| | `POST` | `/api/market-prices/refresh` | Trigger manual refresh from Agmarknet API. |
| **Produce Market** | `GET` | `/api/marketplace/products` | Browse produce listings with organic & location filters. |
| | `POST` | `/api/marketplace/products` | Create a new produce listing for sale. |
| **Equipment Rental**| `GET` | `/api/equipment/equipment` | Browse available farm machinery (tractors, harvesters, tillers). |
| | `POST` | `/api/equipment/rentals` | Initiate equipment rental booking with date range. |
| | `GET` | `/api/equipment/rentals/my-rentals`| View active and past equipment bookings. |
| **Schemes** | `GET` | `/api/schemes/` | Search government subsidies by category, state, and crop. |
| | `GET` | `/api/schemes/schemes/{id}` | Detailed scheme eligibility, required documents, and apply URL. |
| | `POST` | `/api/schemes/apply` | Submit in-app scheme assistance application. |
| **Soil & Geocoding**| `POST` | `/api/predict-soil` | Predict district soil type and NPK levels via coordinates (KNN). |
| **Conversational AI**| `POST` | `/api/chat` | Multi-turn agricultural Q&A powered by Groq LLaMA 3.1 8B. |
| **Community WS** | `WS` | `/api/community/ws/{id}` | Real-time WebSocket multi-farmer discussion hub. |

---

## 🧪 Testing & Quality Assurance

### 1. In-App Model Accuracy Benchmark (`AccuracyTest.tsx`)
The platform includes an interactive validation suite allowing agronomists and developers to benchmark the PyTorch CNN against test datasets:
- Evaluates Top-1 and Top-5 prediction confidence.
- Computes latency benchmarks (average inference time < 120 ms).

### 2. End-to-End Test Suite
Run comprehensive frontend and backend integration tests:
```bash
cd Frontend
npm run test:e2e
```

### 3. TypeScript Type-Checking & Linting
```bash
cd Frontend
npm run type-check
npm run lint
```

---

## 🗺️ Future Roadmap

- [ ] **Edge AI Micro-Controllers**: Deploy quantized ONNX / TensorFlow Lite models to ESP32 / Raspberry Pi IoT field gateways.
- [ ] **Satellite & Drone NDVI Analytics**: Ingest Sentinel-2 and Landsat multispectral imagery for automated field vegetation health mapping.
- [ ] **Offline-First PWA & IndexedDB**: Complete offline sync allowing farmers to record data and run diagnostics in zero-connectivity remote regions.
- [ ] **Automated Smart Contract Escrow**: Web3/blockchain-backed escrow for high-value machinery rentals and cross-border seafood exports.
- [ ] **Multimodal Voice Agent**: Direct audio-to-audio conversational agronomist using Whisper and Kokoro TTS.

---

## 📄 License & Acknowledgments

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### Acknowledgments & Data Sources
- **Ministry of Agriculture & Farmers Welfare (Government of India)**: Agmarknet and eNAM open data portals.
- **Open-Meteo & OpenWeatherMap**: Meteorological and soil telemetry APIs.
- **PlantVillage Dataset**: Botanical image corpus for training convolutional neural network architectures.
- **Groq Cloud & Meta AI**: LLaMA 3.3 & 3.1 ultra-low latency inference engines.
- **Google DeepMind**: Gemini 1.5 Flash multimodal vision intelligence.

---

<p align="center">
  <b>Built with ❤️ to empower farmers and revolutionize sustainable agriculture.</b><br>
  <sub>Agro-VisionAI © 2026. All rights reserved.</sub>
</p>
