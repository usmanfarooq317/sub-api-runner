import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [number, setNumber] = useState("923319154345"); // default
  const [pin, setPin] = useState("");
  const [encrypted, setEncrypted] = useState("");
  const [ibmResponse, setIbmResponse] = useState(null);
  const [xHash, setXHash] = useState("");

  const handleEncrypt = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, pin }),
      });
      const data = await res.json();
      setEncrypted(data.encryptedValue);
      setIbmResponse(data.ibmResult);
      setXHash(data.xHash || "");
    } catch (err) {
      alert("Encrypt/IBM call failed: " + err.message);
    }
  };

  return (
    <div className="app-container">
      <h2>🔐 RSA Login Payload Demo</h2>

      <div className="form-group">
        <label>Number</label>
        <select value={number} onChange={(e) => setNumber(e.target.value)}>
          <option value="923319154345">923319154345</option>
          <option value="923481565391">923481565391</option>
        </select>
      </div>

      <div className="form-group">
        <label>PIN</label>
        <input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
      </div>

      <button className="encrypt-btn" onClick={handleEncrypt}>
        Encrypt & Send
      </button>

      {encrypted && (
        <div className="result">
          <div className="result-header">
            <span>Encrypted Value</span>
            <button onClick={() => navigator.clipboard.writeText(encrypted)}>
              📋 Copy
            </button>
          </div>
          <textarea rows={4} readOnly value={encrypted}></textarea>
        </div>
      )}

      {xHash && (
        <div className="result">
          <div className="result-header">
            <span>xHash</span>
            <button onClick={() => navigator.clipboard.writeText(xHash)}>
              📋 Copy
            </button>
          </div>
          <textarea rows={2} readOnly value={xHash}></textarea>
        </div>
      )}

      {ibmResponse && (
        <div className="api-response">
          <h4>IBM Response</h4>
          <pre>{JSON.stringify(ibmResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
