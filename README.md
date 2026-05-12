# ☁️ Lightweight Lakehouse Logging System

### CE408L — Cloud Computing Lab Final Examination Project
**Student Name:** Mian Arqam  
**Registration No:** 2022294  
**Academic Suffix:** `294` (Appended to all active resources)  
**Deployment Host:** Amazon Web Services (AWS EC2) — Public IP: `54.80.245.15`

---

## 📌 Project Overview
This repository contains the complete implementation, orchestration files, cloud bootstrapping scripts, and evaluation walkthrough for the **Lightweight Lakehouse Logging System** developed for the CE408L final examination. 

The architecture consists of a modern, containerized, event-driven microservices setup designed to separate transaction processing from analytical ingestion (simulating a lightweight Lakehouse platform). All system components are decoupled and communicate asynchronously via a message broker.

---

## 🏗️ System Architecture Topology

The network is split across five active services running inside an isolated Docker bridge network:

```mermaid
graph TD
    Client[PowerShell / Client] -->|HTTP Register/Login| Auth[Auth Service :5001]
    Client -->|HTTP Create Event + JWT| Event[Event Service :5002]
    Auth -->|Credentials Check| DB[(PostgreSQL DB :5432)]
    Event -->|Store Transaction| DB
    Event -->|Publish Event| Broker{RabbitMQ Broker :5672}
    Broker -->|Asynchronous Consume| Notification[Notification Worker]
    Notification -->|Append Logs| Lakehouse[lakehouse_logs_294.json]
```

### 📦 Services Directory
1. **`postgres_294`** (PostgreSQL 15): Persistent relational backend. Automatically bootstrapped via `/postgres/init_294.sql` to hold the `users_294` and `events_294` schemas.
2. **`rabbitmq_294`** (RabbitMQ 3): Lightweight enterprise-grade message broker isolating transaction life cycles from analytic indexing tasks.
3. **`auth_service_294`** (Node.js/Express): Manages authentication on port `5001`. Secures operations using bcrypt password hashing and JWT issuance.
4. **`event_service_294`** (Node.js/Express): Runs on port `5002`. Allows authenticated creation and listing of events, logs records to PostgreSQL, and broadcasts asynchronous updates to the broker.
5. **`notification_service_294`** (Node.js): Detached background worker listening to `queue_294`. Appends structured log payloads to `/logs/lakehouse_logs_294.json` upon successful delivery.

---

## 🐳 Running Locally via Docker Compose

### Prerequisite Setup
1. Clone this repository:
   ```bash
   git clone https://github.com/MianArqam/cloud_final.git
   cd cloud_final
   ```
2. Create your `.env` configuration:
   ```env
   PORT_AUTH=5001
   PORT_EVENT=5002
   DATABASE_URL=postgres://user_294:pass_294@postgres_294:5432/db_294
   RABBITMQ_URL=amqp://guest:guest@rabbitmq_294:5672
   JWT_SECRET=supersecret_294
   ```
3. Start the system:
   ```bash
   docker-compose up --build -d
   ```

---

## 🚀 Production Cloud Deployment (AWS)
The microservices infrastructure has been deployed to **Amazon Web Services (AWS)** using the following specifications:
* **EC2 Compute:** Ubuntu Server 22.04 LTS (`t3.micro`) named `ec2_294`.
* **VPC Layer:** Clean network partition `vpc-058872053be4726e3` utilizing internet gateways and routing boundaries.
* **Security Group (`sg_294`):** Inbound firewall rules open for public endpoint queries:
  * `22` (SSH Access)
  * `5001` (Auth Microservice)
  * `5002` (Event Microservice)
  * `15672` (RabbitMQ Management dashboard)

---

## 🧪 Comprehensive API Walkthrough (PowerShell)

### Step 1: User Registration
```powershell
Invoke-RestMethod -Uri http://54.80.245.15:5001/api/auth/register -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username": "student_294", "password": "password123"}'
```

### Step 2: Session Login & JWT Generation
```powershell
$response = Invoke-RestMethod -Uri http://54.80.245.15:5001/api/auth/login -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username": "student_294", "password": "password123"}'
$token = $response.token
```

### Step 3: Secure Event Creation
```powershell
Invoke-RestMethod -Uri http://54.80.245.15:5002/api/events -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer $token"} -Body '{"title": "Cloud Tech Talk", "description": "Discussing Lakehouse Architecture", "location": "GIKI Main Hall"}'
```

### Step 4: Live Services Health Verification
```powershell
Invoke-RestMethod -Uri http://54.80.245.15:5001/health
Invoke-RestMethod -Uri http://54.80.245.15:5002/health
```

---

## 📊 Evaluation PDF Report
The complete 12-page academic project report containing detailed descriptions, execution schemas, and screenshots of every single step is available in the repository as **[Final_Report_2022294.pdf](Final_Report_2022294.pdf)**. 

### Key Highlights from the Report
* Fully explained local docker compilation routines and Docker Desktop groups.
* Isolated network traces demonstrating PostgreSQL transactions and RabbitMQ consumer daemons.
* Live cloud verification showing running console environments and active firewall filters.
