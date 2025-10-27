// backend/server.js
import express from "express";
import crypto from "crypto";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const app = express();
app.use(bodyParser.json());

// 🔹 Allow frontend calls (Vite dev server)
app.use(cors({
  origin: "http://localhost:5173", // <-- fixed port
  credentials: true,
}));

// 🔑 Load IBM public key from file
const PUBLIC_KEY_PATH = path.join(process.cwd(), "subgateway.pem");
const IBM_PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");

// Function to encrypt data using IBM public key (RSA PKCS#1)
function encryptWithIBMKey(plainText) {
  const buffer = Buffer.from(plainText, "utf-8");
  const encrypted = crypto.publicEncrypt(
    {
      key: IBM_PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString("base64");
}

// 🔒 Encrypt user+pin and call IBM API
app.post("/api/encrypt", async (req, res) => {
  try {
    const { number, pin } = req.body;
    if (!number || !pin) return res.status(400).json({ error: "number and pin required" });

    const payload = `${number}:${pin}`;
    const encryptedValue = encryptWithIBMKey(payload);

    console.log("Encrypted payload (Base64):", encryptedValue);

    // 🌐 Call IBM login API
    const ibmResponse = await fetch(
      "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/CorporateLogin/",
      {
        method: "POST",
        headers: {
          "X-IBM-Client-Id": "924726a273f72a75733787680810c4e4",
          "X-IBM-Client-Secret": "7154c95b3351d88cb31302f297eb5a9c",
          "X-Channel": "subgateway",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ LoginPayload: encryptedValue }),
      }
    );

    const result = await ibmResponse.json();
    console.log("IBM Response:", result);

    // 🔑 Create x-hash using User~Timestamp
    let xHash = null;
    if (result.ResponseCode === "0") {
      const userTimestamp = `${result.User}~${result.Timestamp}`;
      xHash = encryptWithIBMKey(userTimestamp);
      console.log("Generated x-hash:", xHash);
    }

    res.json({
      encryptedValue,
      ibmResult: result,
      xHash,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Encryption or IBM API call failed" });
  }
});

// 🔒 Optional local decrypt endpoint
app.post("/api/decrypt", (req, res) => {
  try {
    const { encryptedBase64, privateKeyPem } = req.body;
    if (!encryptedBase64 || !privateKeyPem)
      return res.status(400).json({ error: "Provide encryptedBase64 and privateKeyPem" });

    const decrypted = crypto.privateDecrypt(
      { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(encryptedBase64, "base64")
    );

    res.json({ decrypted: decrypted.toString("utf8") });
  } catch (e) {
    console.error("Decryption failed:", e.message);
    res.status(400).json({ error: "Decryption failed" });
  }
});

// 🔒 Example protected API using x-hash
app.post("/api/protected", (req, res) => {
  const xHash = req.headers["x-hash"];
  if (!xHash) return res.status(401).json({ error: "x-hash header missing" });

  res.json({ message: "Protected API accessed!", xHashReceived: xHash });
});

app.listen(5000, () => console.log("✅ Backend running at http://localhost:5000"));
