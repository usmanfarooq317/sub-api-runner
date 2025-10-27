import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [number, setNumber] = useState("923319154345");
  const [pin, setPin] = useState("");
  const [encrypted, setEncrypted] = useState("");
  const [ibmLogin, setIbmLogin] = useState(null);
  const [xHash, setXHash] = useState("");
  const [additionalApis, setAdditionalApis] = useState({});

  const handleEncrypt = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, pin }),
      });
      const data = await res.json();
      setEncrypted(data.encryptedValue);
      setIbmLogin(data.ibmLoginResult);
      setXHash(data.xHash || "");
      setAdditionalApis(data.additionalApis || {});
    } catch (err) {
      alert("Encrypt/IBM call failed: " + err.message);
    }
  };

  const renderApiResponse = (name, data) => (
    <div className="api-response" key={name}>
      <h4>{name}</h4>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );

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
            <button onClick={() => navigator.clipboard.writeText(encrypted)}>📋 Copy</button>
          </div>
          <textarea rows={4} readOnly value={encrypted}></textarea>
        </div>
      )}

      {xHash && (
        <div className="result">
          <div className="result-header">
            <span>xHash</span>
            <button onClick={() => navigator.clipboard.writeText(xHash)}>📋 Copy</button>
          </div>
          <textarea rows={2} readOnly value={xHash}></textarea>
        </div>
      )}

      {ibmLogin && renderApiResponse("IBM Login Response", ibmLogin)}

      {additionalApis &&
        Object.keys(additionalApis).map((key) =>
          renderApiResponse(key, additionalApis[key])
        )}
    </div>
  );
}
