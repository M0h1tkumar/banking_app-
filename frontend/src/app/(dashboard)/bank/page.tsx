"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BankOpsDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"KYC" | "AUDIT">("KYC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [pendingKycs, setPendingKycs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Fetch user to verify role
      const userRes = await fetch("http://localhost:4000/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userRes.json();
      
      if (userData.role !== 'BANK_OPERATIONS') {
        setError("Access Denied: You do not have permission to view this page.");
        setLoading(false);
        return;
      }

      // Fetch KYC and Audit data
      if (activeTab === "KYC") {
        const kycRes = await fetch("http://localhost:4000/api/bank/kyc/pending", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (kycRes.ok) {
          setPendingKycs(await kycRes.json());
        }
      } else {
        const auditRes = await fetch("http://localhost:4000/api/bank/audit", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (auditRes.ok) {
          setAuditLogs(await auditRes.json());
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleKycAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    const token = localStorage.getItem("token");
    
    try {
      let body = {};
      if (action === "reject") {
        const reason = prompt("Please provide a reason for rejection:");
        if (reason === null) return; // User cancelled
        body = { reason };
      }

      const res = await fetch(`http://localhost:4000/api/bank/kyc/${id}/${action}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) throw new Error(`Failed to ${action} KYC`);
      
      // Refresh list
      setPendingKycs(prev => prev.filter(k => k.id !== id));
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
          <button 
            onClick={() => router.push("/")}
            className="mt-4 bg-white/10 px-4 py-2 rounded-xl text-white hover:bg-white/20"
          >
            Return to Dashboard
          </button>
        </div>
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
          <h1 className="text-3xl font-bold text-white">Bank Operations</h1>
          <p className="text-brand text-sm mt-1 font-mono uppercase tracking-widest">Admin Dashboard</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab("KYC")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "KYC" ? 'bg-brand text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            KYC Reviews
          </button>
          <button 
            onClick={() => setActiveTab("AUDIT")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "AUDIT" ? 'bg-brand text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* KYC Tab */}
          {activeTab === "KYC" && (
            <div className="space-y-4">
              {pendingKycs.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-gray-400 text-lg">No pending KYC applications to review.</p>
                  <p className="text-brand text-sm mt-2">You're all caught up!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingKycs.map(kyc => (
                    <div key={kyc.id} className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2"></div>
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded font-bold">PENDING</span>
                        <span className="text-xs text-gray-500">{new Date(kyc.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mb-1 truncate" title={kyc.user.email}>
                        {kyc.user.email}
                      </h3>
                      
                      <div className="space-y-2 my-6">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Aadhaar (Masked)</p>
                          <p className="text-white font-mono bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                            XXXX-XXXX-{kyc.aadhaar.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">PAN (Masked)</p>
                          <p className="text-white font-mono bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                            {kyc.pan.slice(0, 2)}XXXXXX{kyc.pan.slice(-2)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleKycAction(kyc.id, "approve")}
                          disabled={processingId === kyc.id}
                          className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black font-bold py-2 rounded-xl transition-colors disabled:opacity-50 border border-green-500/30"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleKycAction(kyc.id, "reject")}
                          disabled={processingId === kyc.id}
                          className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold py-2 rounded-xl transition-colors disabled:opacity-50 border border-red-500/20"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === "AUDIT" && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-bold">System Audit Trail</h3>
                <p className="text-xs text-gray-400">Displaying the last 100 system events.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                      <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          No audit logs found.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log: any) => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-sm">
                            <span className="bg-brand/10 text-brand px-2 py-1 rounded-md font-mono text-xs font-bold border border-brand/20">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-white">
                            {log.entity} <span className="text-gray-500 text-xs">({log.entityId.slice(0, 8)}...)</span>
                          </td>
                          <td className="p-4 text-sm text-gray-400 font-mono text-xs">
                            {log.actor.slice(0, 8)}...
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
