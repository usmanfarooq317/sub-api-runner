import React, { useState } from "react";
// Tailwind is assumed to be available
const App = () => {
  const [number, setNumber] = useState("923319154345");
  const [pin, setPin] = useState("");
  const [encrypted, setEncrypted] = useState("");
  const [ibmLogin, setIbmLogin] = useState(null);
  const [xHash, setXHash] = useState("");
  const [additionalApis, setAdditionalApis] = useState({});
  
  // 🟢 New states for Transaction Status Inquiry
  const [transactionIdInput, setTransactionIdInput] = useState("6317713"); // Default ID from curl example
  const [transactionStatusResult, setTransactionStatusResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEncrypt = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, pin }),
      });
      const data = await res.json();
      if(data.error) {
         throw new Error(data.error);
      }
      setEncrypted(data.encryptedValue);
      setIbmLogin(data.ibmLoginResult);
      setXHash(data.xHash || "");
      setAdditionalApis(data.additionalApis || {});
      setTransactionStatusResult(null); // Clear previous status result on new login
    } catch (err) {
      console.error("Encrypt/IBM call failed:", err);
      // Use a custom message box instead of alert()
      alert("Encrypt/IBM call failed: " + err.message);
    } finally {
        setIsLoading(false);
    }
  };
  
  // 🟢 Handler for Transaction Status Inquiry
  const handleTransactionStatusInquiry = async () => {
    if (!xHash) {
        alert("Please perform the Encrypt & Send (Login) step first to generate the X-Hash.");
        return;
    }
    if (!transactionIdInput) {
        alert("Please enter a Transaction ID.");
        return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/inquire-transaction-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionID: transactionIdInput }),
      });
      const data = await res.json();
      if(data.error) {
         throw new Error(data.error);
      }
      setTransactionStatusResult(data.transactionStatusResult);
    } catch (err) {
      console.error("Transaction Status Inquiry failed:", err);
      alert("Transaction Status Inquiry failed: " + err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const renderApiResponse = (name, data) => (
    <div className="bg-gray-100 p-4 rounded-lg shadow-inner mt-4">
      <h4 className="font-semibold text-lg text-indigo-600 mb-2">{name}</h4>
      <pre className="bg-white p-3 rounded-md text-xs overflow-x-auto border border-gray-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  // List of all expected API results for display in order
  const apiOrder = [
    "MaToMATransfer", "MaToMAInquiry",
    "SubscriberIBFTTransfer", "SubscriberIBFTInquiry",
    "MAtoCNICTransfer", "MAtoCNICInquiry",
    "MaToMerchantTransfer", "MaToMerchantInquiry",
    "SubscriberUBPTransfer", "SubscriberUBPInquiry",
    "AccountLimitKYC", "AccountBalance",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-start font-sans">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
          🔐 IBM/RSA API Tester
        </h2>
        
        {/* Input Form for Login */}
        <div className="space-y-4 mb-8 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h3 className="text-xl font-bold text-indigo-700">1. Login & Generate X-Hash</h3>
            <div className="flex space-x-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                    <select 
                        value={number} 
                        onChange={(e) => setNumber(e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    >
                        <option value="923319154345">923319154345</option>
                        <option value="923481565391">923481565391</option>
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
                    <input
                        type="password"
                        placeholder="Enter PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                </div>
            </div>

            <button 
                className={`w-full py-2 px-4 rounded-lg font-semibold shadow-lg transition duration-300 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                onClick={handleEncrypt}
                disabled={isLoading}
            >
                {isLoading ? 'Processing...' : 'Encrypt & Send (Login + All APIs)'}
            </button>
        </div>

        {/* Login Results */}
        {encrypted && (
          <div className="space-y-4 mb-6">
            <div className="result bg-white p-4 border border-green-300 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-green-700">Encrypted Value</span>
                <button 
                    onClick={() => navigator.clipboard.writeText(encrypted)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 p-1 rounded-md transition"
                >
                    📋 Copy
                </button>
              </div>
              <textarea rows={4} readOnly value={encrypted} className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-md"></textarea>
            </div>
            
            {xHash && (
              <div className="result bg-white p-4 border border-blue-300 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-blue-700">X-Hash (Generated Token)</span>
                  <button 
                      onClick={() => navigator.clipboard.writeText(xHash)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 p-1 rounded-md transition"
                  >
                      📋 Copy
                  </button>
                </div>
                <textarea rows={2} readOnly value={xHash} className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-md"></textarea>
              </div>
            )}
          </div>
        )}
        
        {/* Transaction Status Inquiry Section */}
        {xHash && (
            <div className="space-y-4 mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <h3 className="text-xl font-bold text-yellow-800">2. Transaction Status Inquiry</h3>
                <div className="flex space-x-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                        <input
                            type="text"
                            placeholder="e.g. 6317713"
                            value={transactionIdInput}
                            onChange={(e) => setTransactionIdInput(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                        />
                    </div>
                    <button 
                        className={`py-2 px-4 rounded-lg font-semibold shadow-lg transition duration-300 ${isLoading ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
                        onClick={handleTransactionStatusInquiry}
                        disabled={isLoading}
                    >
                        Check Status
                    </button>
                </div>
            </div>
        )}

        {/* API Responses Section */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">API Responses</h3>
        
        {/* Transaction Status result is displayed first for immediate feedback */}
        {transactionStatusResult && renderApiResponse("Transaction Status Inquiry", transactionStatusResult)}

        {ibmLogin && renderApiResponse("IBM Login Response", ibmLogin)}
        
        {/* Render all additional API results in a defined order */}
        {additionalApis && apiOrder.map((key) =>
          additionalApis[key] ? renderApiResponse(key, additionalApis[key]) : null
        )}
      </div>
    </div>
  );
};

export default App;
