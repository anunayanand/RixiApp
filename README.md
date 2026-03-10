<div align="center">
  <img src="./public/img/Rixi%20Lab%20New%20Logo%20PNG.png" alt="RixiLab Logo" width="200" />

  # 🚀 RixiApp - Internship Management Platform
  
  **A comprehensive, scalable, and secure platform designed to streamline the entire internship lifecycle.**

  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![EJS](https://img.shields.io/badge/EJS-B4CA65?style=for-the-badge&logo=ejs&logoColor=black)
  ![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white)
</div>

<br />

RixiApp is an advanced Internship Management ecosystem built for **RixiLab Tech**. It efficiently manages everything from intern onboarding, assignment, and project tracking to live proctored quizzes and automated certificate generation. Our platform caters smoothly and securely to multiple administrative layers and user roles.

---

## ✨ Key Features

- **🔐 Multi-Role Auth & Authorization:** Seamless, hierarchical access control for **SuperAdmins**, **Admins**, **Ambassadors**, and **Interns**.
- **📊 Interactive Dashboards:** Specialized, role-specific portals displaying real-time statistics, active tasks, submissions, and alerts.
- **📅 End-to-End Project Management:** Complete workflow spanning project assignment, intern submissions, and admin reviews (Approval/Rejection).
- **📝 Live Proctored Quizzes:** Secure, time-bound testing environments equipped with cheating-prevention measures like blocking desktop browsers and full-screen constraints.
- **🎓 Automated Document Generation:** Let the system effortlessly validate and generate QR-coded `pdfkit` completion certificates and personalized offer letters.
- **📧 Intelligent Email Notifications:** Instant automated communications using `nodemailer` for welcome emails, onboarding steps, and completion success.
- **☁️ Cloud Asset Storage:** Integrated with `Cloudinary` to provide robust, fast, and secure media uploads and hosting.
- **🟢 Real-Time Status Tracking:** Pulse and heartbeat systems monitor user activity to provide responsive 'Online/Offline' statuses across chat and management interfaces.

---

## 🛠️ Technology Stack

| Architecture   | Technologies & Tools |
| -------------- | -------------------- |
| **Backend**    | Node.js, Express.js (v5) |
| **Database**   | MongoDB, Mongoose ODM |
| **Frontend**   | EJS Templating, Vanilla CSS, Bootstrap 5 |
| **Auth**       | `bcrypt`, `express-session` |
| **File Sync**  | `multer`, `cloudinary` |
| **Services**   | `pdfkit`, `qrcode`, `nodemailer`, `speakeasy`, Cashfree SDK |

---

## 👥 User Roles & Capabilities

| Role | Details & System Permissions |
| :-: | :--- |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Crown.png" alt="Crown" width="25" /> **SuperAdmin** | Full system oversight and architecture control. Capable of managing all Admins, Ambassadors, and Interns globally, triggering systemic migrations, and system notice broadcasts. |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Office%20Building.png" alt="Office Building" width="25" /> **Admin** | Manages assigned localized Intern cohorts. Controls the lifecycle of projects, handles 1-on-1 virtual meetings, and verifies test grade integrity. |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Handshake.png" alt="Handshake" width="25" /> **Ambassador** | Authorized partners/reps capable of managing their localized communities and tracking insights and stats regarding referred candidates. |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People%20with%20professions/Student.png" alt="Student" width="25" /> **Intern** | The primary audience. Interacts with dashboards to log attendance, take verified quizzes, submit required deliverables, chat with admins, and download final credential tokens. |

---

## 🚀 Getting Started

Follow these instructions to safely set up and deploy the project locally for development.

### 1️⃣ Prerequisites

Ensure you have the following ready on your core machine:
* **Node.js** (v16.x or newer strongly recommended)
* **MongoDB** (Local instance installed or cloud-based MongoDB Atlas Cluster)
* **Cloudinary Account** (for file uploads)

### 2️⃣ Installation & Setup

Clone the repository and jump right in:

```bash
git clone <https://github.com/anunayanand/RixiApp.git>
cd RixiApp
npm install
```

### 3️⃣ Environment & Configuration

Create a `.env` file at the root level of your directory. Add your specific credentials dynamically. 

> **Warning:** Do not commit your true `.env` file to version control. The repository relies strictly on hidden variables for all confidential layers.

```env
# Database Credentials
MONGO_URI=your_db_uri

# API Core Protocols
SESSION_SECRET=your_super_secret_session_key
PORT=8080

# Cloudinary Integration
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Automatic Mailing Operations
EMAIL_HOST=smtp.your_email_host.com
EMAIL_PORT=465
EMAIL_USER=your_secure_email@domain.com
EMAIL_PASS=your_app_specific_password
```

### 4️⃣ Booting the Server

Run the development instance locally, powered by nodemon for hot-reloads:

```bash
npm start
```
Once up and running, traverse to: `http://localhost:8080`

---

## 📂 Detailed Folder Architecture

```text
RixiApp
├── 📁 .git                 # Core version control system
├── 📁 middleware/          # Security checkpoints
│   ├── authRole.js         # Evaluates user clearances (Admin, Intern, etc.)
│   ├── errorHandler.js     # Unified error response handler
│   └── rateLimiter.js      # Express firewall to halt brute-force attacks
├── 📁 models/              # Strict MongoDB Data Schemas
│   ├── User.js, Admin.js, SuperAdmin.js, Ambassador.js
│   └── Project.js, Quiz.js, ChatTicket.js, ChatMessage.js, NewRegistration.js
├── 📁 public/              # Exposed static configurations and styles
│   ├── 📁 css/             # Specialized view stylesheets
│   ├── 📁 fonts/           # Local UI Typography
│   ├── 📁 img/             # Raw asset imagery (Logos, Success GIFs)
│   └── 📁 js/              # Client-side dynamic Javascript triggers
├── 📁 routes/              # Highly modularized backend network paths
│   ├── adminRoute.js, internRoute.js, superAdminRoute.js, ambassadorRoute.js
│   ├── chatRoute.js, loginRoute.js, notificationRoute.js
│   └── ... (total of 51 explicit micro-routes handling isolation logic)
├── 📁 services/            # Tertiary 3rd party service connections
├── 📁 utilities/           # Helper scripts
├── 📁 views/               # EJS Frontend Render Engines
│   ├── 📁 partials/        # Repeating visual blocks (Header, Navbar, Modals)
│   ├── index.ejs, login.ejs, register.ejs, superAdmin.ejs
│   └── intern.ejs, admin.ejs, ambassador.ejs, quiz.ejs
├── 📄 app.js               # Application Entrypoint & Middleware mounting
├── 📄 db.js                # Core Database Connective layer via Mongoose
├── 📄 package.json         # Dependency tree mapping
└── 📄 README.md            # The very document you are reading!
```

---

---

## 🛡️ Security Posture

We prioritize integrity and confidentiality:
1. **Hardened Credentials:** Strictly enforced password encryption architectures via `bcrypt`.
2. **Impenetrable Sessions:** Encrypted and HTTP-only cookies managed thoroughly through `express-session` & `connect-mongo`.
3. **Advanced Rate-Limiting:** `express-rate-limit` mitigates potential overflow and spam activities targeting our endpoints.
4. **Environment Isolation:** Zero reliance on hardcoded secrets, depending completely on isolated `.env` constructs logic flows.

---

## 📝 Legal & Licensing

This software framework is proprietary architecture forged exclusively for **RixiLab Tech**. Unauthorised replication, cloning, or distribution is severely restricted.

<p align="center">
  <i>Designed with ❤️ by the RixiLab Team</i>
</p>
