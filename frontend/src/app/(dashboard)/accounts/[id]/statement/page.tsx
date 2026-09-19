"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StatementPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Default date range: Last 30 days to today
  const defaultToDate = new Date();
  const defaultFromDate = new Date();
  defaultFromDate.setDate(defaultToDate.getDate() - 30);
  
  const [fromDate, setFromDate] = useState(defaultFromDate.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(defaultToDate.toISOString().split("T")[0]);

  const fetchStatement = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`http://localhost:4000/api/statements/${accountId}?from=${fromDate}&to=${toDate}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch statement");
      
      setStatement(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [accountId]); // Initial fetch

  const handleDownloadCsv = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:4000/api/statements/${accountId}/download?from=${fromDate}&to=${toDate}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to download statement");
      
      // Create a blob from the CSV string and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Statement_${statement.accountNumber}_${fromDate}_to_${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && !statement) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-brand/30 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button 
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 text-sm"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Account Statement</h1>
          {statement && (
            <p className="text-gray-400 font-mono mt-1">**** {statement.accountNumber.slice(-4)}</p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            />
          </div>
          <button 
            onClick={fetchStatement}
            className="bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:bg-white/20 transition-colors text-sm font-semibold whitespace-nowrap"
          >
            Apply Range
          </button>
          <button 
            onClick={handleDownloadCsv}
            disabled={!statement || statement.transactions.length === 0}
            className="bg-brand text-black px-4 py-2 rounded-xl hover:bg-white transition-colors text-sm font-bold shadow-lg shadow-brand/20 disabled:opacity-50 whitespace-nowrap"
          >
            Download CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {statement && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <p className="text-sm text-gray-400 mb-1">Opening Balance</p>
              <h3 className="text-xl font-bold text-white">${statement.openingBalance.toFixed(2)}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <p className="text-sm text-gray-400 mb-1">Total Inflow</p>
              <h3 className="text-xl font-bold text-green-400">+${statement.totalInflow.toFixed(2)}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <p className="text-sm text-gray-400 mb-1">Total Outflow</p>
              <h3 className="text-xl font-bold text-white">-${statement.totalOutflow.toFixed(2)}</h3>
            </div>
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 p-4 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <p className="text-sm text-gray-400 mb-1">Closing Balance</p>
              <h3 className="text-xl font-bold text-brand">${statement.closingBalance.toFixed(2)}</h3>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-4 text-sm font-semibold text-gray-400">Date</th>
                    <th className="p-4 text-sm font-semibold text-gray-400">Description</th>
                    <th className="p-4 text-sm font-semibold text-gray-400 text-right">Amount</th>
                    <th className="p-4 text-sm font-semibold text-gray-400 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        No transactions found in this date range.
                      </td>
                    </tr>
                  ) : (
                    statement.transactions.map((txn: any) => (
                      <tr key={txn.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-sm text-gray-300">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-white font-medium">
                          {txn.description}
                        </td>
                        <td className={`p-4 text-sm font-bold text-right ${txn.type === 'TRANSFER_IN' ? 'text-green-400' : 'text-white'}`}>
                          {txn.type === 'TRANSFER_IN' ? '+' : '-'}${parseFloat(txn.amount).toFixed(2)}
                        </td>
                        <td className="p-4 text-sm text-gray-300 text-right font-mono">
                          ${parseFloat(txn.balanceAfter).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
