# 🏛️ Kerala MLA Request Management & Summarization WebApp

A secure, multi-user web application that helps Members of Legislative Assembly (MLAs) and their staff manage incoming citizen requests, letters, emails, and voice messages. It features automatic translation, voice message transcription, and AI-powered summarization & classification.

---

## 🌟 Core Features

1. **User Roles & Auth**: Separated role-based access with JWT authentication (MLA vs. Staff vs. Citizen).
2. **Citizen Submissions & Verification**:
   - Public form supporting text description, document file uploads, and audio microphone recordings.
   - Built-in spam prevention requiring **Submitter Name, Email, Phone, Home Address / Ward**, and **Aadhaar Card (Last 4 digits)** verification.
3. **AI Transcription & Translation**:
   - Automatic transcription of citizen voice recordings to text.
   - Multi-language support that auto-translates Malayalam or other regional languages to English for administration.
4. **AI Summarization & Classification**: Analyzes issues to extract category (e.g. Roads, Water, Electricity, Education, Health), urgency (Low, Medium, High), and the place/constituency ward.
5. **Workflow Management**: Status indicators (`Pending`, `In Progress`, `Resolved`, `Escalated`) with comments/history logging.
6. **Two-Step Calendar Slot Booking**:
   - Interactive booking flow for citizens: First pick a day on the calendar (coded **Green** if slots are available or **Red** if fully booked/closed), then select an available hourly session slot (10:00 to 16:00).
   - Collects and validates booking details (editable name and phone number).
7. **Appointment Scheduler (MLA/Staff Dashboard)**:
   - **Custom Slot Generator**: Prompts the user for the number of scheduling days and builds default hourly slots (10:00 to 16:00, skipping Sundays) at a default capacity of 4 bookings per hour.
   - **Collapsible Slots Config**: Toggleable sidebar to hide/show available slots configuration to save screen space.
   - **Archived Reservations History**: Automatically separates active reservations from past sessions or cancelled appointment logs.
8. **Constituency Analytics & Audits**:
   - High-contrast visual dashboard mapping complaint category counts, urgency percentages, and location distributions.
   - State-wide Kerala districts/constituencies ward filtering on detailed analytics.
   - Request ledger pagination displaying 5 entries by default with a "Show More" expansion trigger.

---

## 🚀 Getting Started

### Method 1: Running with Docker Compose (Recommended)
Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

1. **Add AI Credentials (Optional)**:
   Open `docker-compose.yml` and add your Gemini API Key:
   ```yaml
   GEMINI_API_KEY: "your_gemini_api_key_here"
   ```
   *If empty, the app runs using rule-based local fallbacks, so no internet/key is required for testing!*

2. **Start the containers**:
   Run the following command in the workspace root:
   ```bash
   docker compose up --build
   ```

3. **Access the applications**:
   - **Citizen Grievance Form & Public Portal**: `http://localhost:3000`
   - **MLA & Staff Dashboard Portal**: `http://localhost:3000/login`
   - **Django API Endpoint Backend**: `http://localhost:8000/api/`

---

### Method 2: Running Locally (Development Mode)

#### 1. Backend (Django)
1. Navigate to the backend directory and activate the virtual environment:
   ```bash
   # On Windows
   .\venv\Scripts\activate
   ```
2. Apply migrations and seed data:
   ```bash
   python backend/manage.py migrate
   python backend/manage.py seed_data
   ```
3. Run the development server:
   ```bash
   python backend/manage.py runserver
   ```
   *The backend will run on `http://127.0.0.1:8000`.*

#### 2. Frontend (React)
*(Requires Node.js to be installed locally if running without Docker)*
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000`.*

---

## 🔑 Default Test Credentials
The system comes seeded with default accounts for testing:

| Role | Username | Password | Constituency |
|---|---|---|---|
| **MLA** | `mla` | `Password123` | Aluva |
| **Staff** | `staff` | `Password123` | Aluva |

*To create additional Staff accounts, log in as the **MLA** (`mla`) and navigate to the **Staff Management** tab.*

---

## 🛠️ Tech Stack & Directory Structure

```
├── backend/                  # Django backend
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   ├── mla_requests/         # Main settings
│   └── requests_app/         # Custom Django App (Models, Views, Serializers)
├── frontend/                 # React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── components/       # Layouts, Charts, Forms, Mic Recorder
│       ├── pages/            # Citizen Form, Login, Dashboard
│       └── services/         # Axios API connection
├── docker-compose.yml        # Multi-container orchestration
└── README.md                 # Setup Guide
```

---

## ☁️ AWS Production Deployment Guide

To deploy this containerized application on AWS, follow this production architecture:

### 1. Database (Amazon RDS)
- Launch a PostgreSQL instance on Amazon RDS.
- Update the environment variables in `docker-compose.yml` (or AWS ECS Task Definition) to point to the RDS endpoint instead of the local container:
  `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`.

### 2. Audio & Document Storage (Amazon S3)
- To store citizen voice recordings and document attachments, integrate Django with `django-storages` and Amazon S3:
  1. Add `django-storages[boto3]` to backend requirements.
  2. Configure `settings.py` for S3 storage classes:
     ```python
     STORAGES = {
         "default": {
             "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
         },
         "staticfiles": {
             "BACKEND": "storages.backends.s3boto3.S3StaticStorage",
         },
     }
     ```

### 3. Hosting & Security (ECS + Fargate + ALB)
- **AWS ECS (Elastic Container Service)**: Run the backend and frontend Docker containers as tasks using AWS Fargate (serverless containers).
- **Application Load Balancer (ALB)**: Route traffic from `http://yourconstituency.in` to the frontend container on port 80, and `http://api.yourconstituency.in` to the backend container on port 8000.
- **SSL Certificates (AWS Certificate Manager)**: Attach HTTPS certificates to the ALB to secure all data transmissions.
