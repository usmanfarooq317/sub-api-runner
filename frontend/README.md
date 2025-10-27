🔐 IBM/RSA Login & API Tester (Client-Server Demo)
This project demonstrates a React frontend interacting with a Node/Express backend to perform a simulated RSA-encrypted corporate login, generate an X-Hash token, and execute a suite of downstream financial and account APIs. It also includes a dedicated interface for checking Transaction Status Inquiry.

🚀 Setup and Installation
Prerequisites
Node.js: Ensure you have Node.js (v14+) installed.

subgateway.pem: You must have the IBM public key file named subgateway.pem in the root directory of your backend project. This is essential for the RSA encryption.

1. Project Structure
Create the following files in your project directory:

/rsa-api-tester
├── subgateway.pem      <-- 🚨 REQUIRED IBM Public Key File
├── server.js           <-- Backend logic (Node/Express)
└── App.jsx             <-- Frontend logic (React)

2. Install Dependencies
Since this is a client-server application, you need to install dependencies for both the frontend (implied by the environment) and the backend.

For the backend (where server.js resides), you'll need express, cors, body-parser, node-fetch, and crypto (which is built-in).

# Install backend dependencies (in the directory containing server.js)
npm install express cors body-parser node-fetch

3. Running the Application
Start the Backend:

node server.js
# You should see: "✅ Backend running at http://localhost:5000"

Run the Frontend:
You will need a typical React environment (like Vite or Create React App) to run App.jsx, which usually starts on port 5173 or 3000. Ensure the frontend is running, as the App.jsx connects to http://localhost:5000.

⚙️ Code
1. server.js (Backend)
This Express server handles:

Login & Bulk APIs (/api/encrypt): Encrypts the number:pin payload, performs the corporate login, generates the X-Hash, and immediately executes 12 other APIs using the generated hash.

Transaction Status Inquiry (/api/inquire-transaction-status): A dedicated endpoint that uses the globally stored X-Hash to check the status of a specific transactionID.