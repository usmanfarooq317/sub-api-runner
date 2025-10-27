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

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Load IBM public key
const PUBLIC_KEY_PATH = path.join(process.cwd(), "subgateway.pem");
const IBM_PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");

// Encrypt helper
function encryptWithIBMKey(plainText) {
  const buffer = Buffer.from(plainText, "utf-8");
  const encrypted = crypto.publicEncrypt(
    { key: IBM_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
    buffer
  );
  return encrypted.toString("base64");
}

// Call IBM API helper
async function callIbmApi(url, xHash, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Hash-Value": xHash,
      "X-IBM-Client-Id": "924726a273f72a75733787680810c4e4",
      "X-IBM-Client-Secret": "7154c95b3351d88cb31302f297eb5a9c",
      "X-Channel": "subgateway",
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Global variable to store the xHash after successful login
let globalXHash = null;

// Encrypt + IBM login + call all APIs
app.post("/api/encrypt", async (req, res) => {
  try {
    const { number, pin } = req.body;
    if (!number || !pin) return res.status(400).json({ error: "number and pin required" });

    const payload = `${number}:${pin}`;
    const encryptedValue = encryptWithIBMKey(payload);

    // IBM Login API
    const ibmLogin = await fetch(
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
    const loginResult = await ibmLogin.json();

    let additionalApis = {};

    if (loginResult.ResponseCode === "0") {
      const userTimestamp = `${loginResult.User}~${loginResult.Timestamp}`;
      globalXHash = encryptWithIBMKey(userTimestamp); // Store xHash globally

      // 🌐 Start all general API calls
      const xHash = globalXHash; // Use the newly generated hash

      additionalApis.MaToMATransfer = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/MaToMA/Transfer",
        xHash,
        { Amount: "10", MSISDN: number, ReceiverMSISDN: "923355923388" }
      );

      additionalApis.MaToMAInquiry = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/MaToMA/Inquiry",
        xHash,
        { Amount: "20", MSISDN: number, ReceiverMSISDN: "923355923388", cnic: "3700448243372" }
      );

      additionalApis.SubscriberIBFTTransfer = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/SubscriberIBFT/Transfer",
        xHash,
        {
          Amount: "47",
          BankShortName: "MOD",
          BankTitle: "MOD",
          Branch: "00",
          AccountNumber: "00020000011005325",
          MSISDN: number,
          ReceiverMSISDN: "923332810960",
          ReceiverIBAN: "",
          SenderName: "ZEESHAN AHMED",
          TransactionPurpose: "0350",
          Username: "ZEESHAN AHMED"
        }
      );

      additionalApis.SubscriberIBFTInquiry = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/SubscriberIBFT/Inquiry",
        xHash,
        {
          Amount: "47",
          BankShortName: "MOD",
          BankTitle: "MOD",
          AccountNumber: "00020000011005325",
          MSISDN: number,
          ReceiverMSISDN: "923332810960",
          ReceiverIBAN: "923332810960",
          TransactionPurpose: "0350"
        }
      );

      additionalApis.MAtoCNICTransfer = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/MAtoCNIC/Transfer",
        xHash,
        { Amount: "15", MSISDN: number, ReceiverMSISDN: "923482665224", ReceiverCNIC: "3520207345019" }
      );

      additionalApis.MAtoCNICInquiry = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/MAtoCNIC/Inquiry",
        xHash,
        { Amount: "15", MSISDN: number, ReceiverMSISDN: number, ReceiverCNIC: "3520207345019" }
      );
      
      additionalApis.MaToMerchantTransfer = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/matomerchant/transfer",
        xHash,
        {
          "Amount": "10.00",
          "QuoteId":"1438964",
          "MSISDN": number,
          "MPOS": "923482665224",
          "ReceiverMsisdn": "923482665224"
        }
      );

      additionalApis.MaToMerchantInquiry = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/matomerchant/inquiry",
        xHash,
        {
          "Amount": "10.00",
          "MSISDN": number,
          "MPOS": "923482665224",
          "ReceiverMsisdn": "923482665224"
        }
      );

      additionalApis.SubscriberUBPTransfer = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/SubscriberUtilityBill/Payment",
        xHash,
        {
          "Amount": "100.00",
          "ConsumerNumber": "01261110004080",
          "MSISDN": number,
          "Company": "PESCO"
        }
      );

      additionalApis.SubscriberUBPInquiry = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/SubscriberUtilityBill/Inquiry",
        xHash,
        {
          "ConsumerNumber": "01261110004080",
          "MSISDN": number,
          "Company": "PESCO"
        }
      );
      
      additionalApis.AccountLimitKYC = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/accountlimit_kyc/AccountLimitKYC",
        xHash,
        {
          "msisdn": number,
          "basicinfo": "true",
          "additionalinfo": "true",
          "personalinfo": "true",
          "address": "true",
          "cnic": "true",
          "account": "true",
          "email": "true",
          "aml": "true",
          "expirydate": "true"
        }
      );

      additionalApis.AccountBalance = await callIbmApi(
        "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/account-balance/account-bal",
        xHash,
        {
          "msisdn": number
        }
      );
    }

    res.json({ encryptedValue, ibmLoginResult: loginResult, xHash: globalXHash, additionalApis });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Encryption or IBM API call failed" });
  }
});

// 🟢 New dedicated route for Transaction Status Inquiry
app.post("/api/inquire-transaction-status", async (req, res) => {
  try {
    const { transactionID } = req.body;
    
    if (!globalXHash) {
      return res.status(401).json({ error: "X-Hash not available. Please perform login first." });
    }

    if (!transactionID) {
      return res.status(400).json({ error: "transactionID is required." });
    }

    const transactionStatusResult = await callIbmApi(
      "https://rgw.8798-f464fa20.eu-de.ri1.apiconnect.appdomain.cloud/tmfb/dev-catalog/transaction-status-inquiry/TransactionStatusInquiry",
      globalXHash, // Use the stored global hash
      { transactionID }
    );

    res.json({ transactionStatusResult });

  } catch (err) {
    console.error("❌ Error during Transaction Status Inquiry:", err);
    res.status(500).json({ error: "Transaction Status Inquiry failed" });
  }
});

app.listen(5000, () => console.log("✅ Backend running at http://localhost:5000"));
