import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [number, setNumber] = useState("");
  const [pin, setPin] = useState("");
  const [encrypted, setEncrypted] = useState("");
  const [ibmResponse, setIbmResponse] = useState(null);

  const handleEncrypt = async () => {
    const res = await fetch("http://localhost:5000/api/encrypt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, pin }),
    });
    const data = await res.json();
    setEncrypted(data.encryptedValue);
    setIbmResponse(data.ibmResult);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(encrypted);
    alert("Encrypted value copied!");
  };

  return (
    <div className="container">
      <h2>🔐 RSA Login Payload Demo</h2>

      <input
        placeholder="Enter Number"
        value={number}
        onChange={(e) => setNumber(e.target.value)}
      />
      <input
        placeholder="Enter PIN"
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />
      <button onClick={handleEncrypt}>Encrypt & Send</button>

      {encrypted && (
        <div className="result">
          <div className="result-header">
            <span>Encrypted Value</span>
            <button onClick={copyToClipboard}>📋 Copy</button>
          </div>
          <textarea rows={4} readOnly value={encrypted}></textarea>
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
