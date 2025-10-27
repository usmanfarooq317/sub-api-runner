import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// 🗝 IBM Credentials
const IBM_CLIENT_ID = "924726a273f72a75733787680810c4e4";
const IBM_CLIENT_SECRET = "7154c95b3351d88cb31302f297eb5a9c";

const __dirname = path.resolve();

// 📁 Read PEM key directly
const publicKey = fs.readFileSync(path.join(__dirname, "subgateway.pem"), "utf8");

// 🔒 Encrypt and call IBM API
app.post("/api/encrypt", async (req, res) => {
  try {
    const { number, pin } = req.body;
    if (!number || !pin) {
      return res.status(400).json({ error: "number and pin required" });
    }

    const payload = `${number}:${pin}`;
    console.log("Encrypting:", payload);

    // Encrypt with RSA public key
    const encryptedBuffer = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(payload)
    );

    const encryptedValue = encryptedBuffer.toString("base64");
    console.log("Encrypted value:", encryptedValue);

    // 🌐 Send to IBM API
    const ibmResponse = await fetch(
      "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/CorporateLogin/",
      {
        method: "POST",
        headers: {
          "X-IBM-Client-Id": IBM_CLIENT_ID,
          "X-IBM-Client-Secret": IBM_CLIENT_SECRET,
          "X-Channel": "subgateway",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ LoginPayload: encryptedValue }),
      }
    );

    const result = await ibmResponse.json();
    console.log("IBM Response:", result);

    res.json({ encryptedValue, ibmResult: result });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Encryption or IBM call failed" });
  }
});

// 🧩 Local decrypt test (optional)
app.post("/api/decrypt", (req, res) => {
  try {
    const { encryptedBase64 } = req.body;

    if (!fs.existsSync(path.join(__dirname, "private.pem"))) {
      return res.status(400).json({ error: "private.pem not found" });
    }

    const privateKey = fs.readFileSync(path.join(__dirname, "private.pem"), "utf8");

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(encryptedBase64, "base64")
    );

    res.json({ decrypted: decrypted.toString("utf8") });
  } catch (e) {
    console.error("Decrypt failed:", e.message);
    res.status(400).json({ error: "Decryption failed" });
  }
});

app.listen(5000, () =>
  console.log("✅ Backend running at http://localhost:5000")
);
