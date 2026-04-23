# F1 Strategy Analytics Dashboard

An end-to-end data analytics web application designed to explore, analyze, and visualize Formula 1 race performance and strategy.

This project transforms raw race data into actionable insights by combining data processing, metric engineering, and interactive visualizations.

---

## 🚀 Project Overview

The F1 Strategy Analytics Dashboard enables users to:
- Explore Formula 1 race sessions by season
- Compare driver performance across key metrics
- Analyze race strategies through tyre usage and stint patterns
- Visualize position changes and race progression

The application is built to simulate a real-world analytics workflow — from data ingestion to insight delivery — in an interactive dashboard format.

Link to access: https://f1-strategy-app-steel.vercel.app/

---

## 📊 Data Source

Data is retrieved from the **OpenF1 API**, which provides real-time and historical Formula 1 telemetry data.

### Key datasets used:
- **Sessions** → race events, session types, timestamps
- **Drivers** → driver identity and team information
- **Laps** → lap times used for pace and consistency analysis
- **Positions** → race positions over time for trend analysis
- **Stints** → tyre usage data for strategy breakdown

> ⚠️ Note: Data availability is limited to API coverage (primarily 2023 onwards)

---

## 🧠 Analytical Approach

### 1. Performance Metrics
- **Average Pace**  
  Mean lap time per driver to measure overall speed

- **Consistency (Standard Deviation)**  
  Measures lap-to-lap variation to evaluate driving stability

- **Position Change**  
  Difference between starting and finishing position

---

### 2. Strategy Analysis
- **Tyre Stint Segmentation**
  - Identifies tyre phases per driver
  - Calculates stint length and compound usage

- **Strategy Summary**
  - Converts raw stint data into readable race strategy insights

---

### 3. Race Insights Engine
Custom logic generates insights such as:
- Fastest driver in session
- Most consistent driver
- Biggest position gain
- Key race observations based on combined metrics

---

## 📈 Features

- 🔎 Session exploration by year, country, and session type  
- 👥 Driver comparison (up to 3 drivers)  
- ⚡ Performance metrics (pace & consistency)  
- 🏁 Position change analysis  
- 🛞 Tyre strategy visualization (stint timelines)  
- 📉 Position trend charts over race duration  
- 🧾 Automated race insights generation  
- 🧭 Guided user flow with smooth UI navigation  
- ⚠️ Smart handling of missing/unsupported data  

---

## 🖥️ Tech Stack

**Frontend**
- Next.js (App Router)
- TypeScript
- Tailwind CSS

**Data & Visualization**
- OpenF1 API
- Recharts

**Architecture**
- REST API routes (Next.js)
- Client-side data fetching
- Modular analytics functions (`lib/analytics.ts`)

---

## ⚙️ System Design

```

User Interaction → API Routes → OpenF1 API
↓
Data Processing Layer
↓
Analytics Functions
↓
Visualization Components

```

---

## 🔄 Workflow

1. User selects a year and loads available sessions  
2. Sessions are filtered by country and session type  
3. User selects a session → driver data is fetched  
4. User selects up to 3 drivers  
5. Application computes:
   - pace
   - consistency
   - position changes
   - tyre strategies  
6. Insights and charts are rendered dynamically  

---

## 📌 Key Highlights

- Implements **real-world analytics concepts**:
  - feature engineering
  - statistical analysis
  - data transformation

- Demonstrates **end-to-end data pipeline thinking**
- Focuses on **user-friendly insight delivery**, not just raw data

---

## 🚧 Limitations

- Data coverage depends on OpenF1 API (mainly 2023+)
- Some sessions may not have complete telemetry data
- No caching layer implemented (real-time fetching)

---

## 👤 Author

**Danish Aiman**

---

## ⭐ Future Improvements

- Add caching for faster performance
- Include qualifying & sprint session analysis
- Expand metrics (sector times, pit stop analysis)
- Add machine learning for race outcome prediction
- Improve mobile responsiveness
```
