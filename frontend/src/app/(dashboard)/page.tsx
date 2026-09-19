"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Account Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountType, setAccountType] = useState("SAVINGS");
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  // Transfer Modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ fromAccountId: "", toAccountNumber: "", amount: "", description: "" });
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState("");

  const fetchUserAndAccounts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setUserData(data);

      // Fetch all accounts
      const accountsRes = await fetch("http://localhost:4000/api/accounts", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (accountsRes.ok) {
        const accs = await accountsRes.json();
        setAccounts(accs);
        
        if (accs.length > 0) {
          setTransferData(prev => ({ ...prev, fromAccountId: accs[0].id }));
          
          // Fetch transactions for all accounts (simple implementation for dashboard)
          let allTxns: any[] = [];
          for (const acc of accs) {
            const accDetailRes = await fetch(`http://localhost:4000/api/accounts/${acc.id}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (accDetailRes.ok) {
              const accDetail = await accDetailRes.json();
              allTxns = [...allTxns, ...(accDetail.transactions || [])];
            }
          }
          
          // Sort by newest first
          allTxns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTransactions(allTxns.slice(0, 5)); // Keep top 5
        }
      }
    } catch (err) {
      localStorage.removeItem("token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndAccounts();
  }, [router]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAccount(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type: accountType })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchUserAndAccounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTransfer(true);
    setTransferError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fromAccountId: transferData.fromAccountId,
          toAccountNumber: transferData.toAccountNumber,
          amount: parseFloat(transferData.amount),
          description: transferData.description
        })
      });
      
      const responseData = await res.json();
      
      if (res.ok) {
        setIsTransferModalOpen(false);
        setTransferData({ ...transferData, toAccountNumber: "", amount: "", description: "" });
        fetchUserAndAccounts(); // refresh data
      } else {
        setTransferError(responseData.error || "Transfer failed");
      }
    } catch (err) {
      setTransferError("Network error occurred");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-brand/30 border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);
  const formattedBalance = totalBalance.toLocaleString('en-US', { style: 'currency', currency: accounts[0]?.currency || 'USD' });

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl md:col-span-2 relative overflow-hidden group hover:border-brand/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          
          <h3 className="text-gray-400 font-medium mb-1">Total Balance</h3>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{formattedBalance}</h1>
          
          <div className="flex gap-4 relative z-10">
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              className="bg-brand text-black font-semibold py-2.5 px-6 rounded-xl hover:bg-white transition-colors shadow-lg shadow-brand/20"
            >
              Transfer
            </button>
            <button className="bg-white/5 text-white font-semibold py-2.5 px-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
              Request
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-400 font-medium">Monthly Spending</h3>
              <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-md">-5%</span>
            </div>
            <h2 className="text-3xl font-bold text-white">$0.00</h2>
          </div>
          
          <div className="h-16 mt-6 flex items-end gap-2">
            {[40, 20, 15, 30, 25, 10, 0].map((h, i) => (
              <div key={i} className="flex-1 bg-brand/20 rounded-t-sm" style={{ height: `${(h / 110) * 100}%` }}>
                <div className="w-full bg-brand rounded-t-sm" style={{ height: '40%' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions & Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <button className="text-sm text-brand hover:text-white transition-colors">View All</button>
          </div>
          
          {transactions.length === 0 ? (
            <div className="space-y-4 text-center py-8">
              <p className="text-gray-400">No recent transactions.</p>
              <button className="text-brand text-sm hover:underline">Make a transfer to get started</button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((txn, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'TRANSFER_IN' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white'}`}>
                      {txn.type === 'TRANSFER_IN' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{txn.description}</p>
                      <p className="text-xs text-gray-500">{new Date(txn.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${txn.type === 'TRANSFER_IN' ? 'text-green-400' : 'text-white'}`}>
                    {txn.type === 'TRANSFER_IN' ? '+' : '-'}${parseFloat(txn.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col max-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">My Accounts</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-xl leading-none pb-1"
            >+</button>
          </div>

          <div className="overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {accounts.map(acc => (
              <div key={acc.id} className="w-full rounded-xl bg-gradient-to-br from-brand-dark to-brand p-5 flex flex-col justify-between shadow-lg shadow-brand/10 relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="flex justify-between items-start relative z-10 mb-6">
                  <span className="text-white/90 text-sm font-bold tracking-widest">{acc.type}</span>
                  <span className="text-xs bg-black/20 px-2 py-1 rounded text-white">{acc.status}</span>
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-white text-xl tracking-[0.2em] font-mono mb-2">**** {acc.accountNumber.slice(-4)}</h2>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/60 text-xs">Balance</p>
                      <p className="text-white font-medium">{parseFloat(acc.balance).toLocaleString('en-US', { style: 'currency', currency: acc.currency })}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Transfer Funds</h2>
            <p className="text-gray-400 text-sm mb-6">Send money instantly to any NeoBank account.</p>

            {transferError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">From Account</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  value={transferData.fromAccountId}
                  onChange={e => setTransferData({...transferData, fromAccountId: e.target.value})}
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-dark-bg text-white">
                      {acc.type} (****{acc.accountNumber.slice(-4)}) - ${parseFloat(acc.balance).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Destination Account Number</label>
                <input 
                  type="text"
                  placeholder="e.g. 1045930219"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  value={transferData.toAccountNumber}
                  onChange={e => setTransferData({...transferData, toAccountNumber: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Amount ($)</label>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  value={transferData.amount}
                  onChange={e => setTransferData({...transferData, amount: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Description (Optional)</label>
                <input 
                  type="text"
                  placeholder="Dinner, Rent, etc."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  value={transferData.description}
                  onChange={e => setTransferData({...transferData, description: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingTransfer}
                className="w-full bg-brand text-black font-bold py-3.5 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-brand/20 transition-all mt-4 disabled:opacity-50"
              >
                {isSubmittingTransfer ? "Processing..." : "Send Money"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Open New Account</h2>
            <p className="text-gray-400 text-sm mb-6">Select the type of account you'd like to open.</p>

            <form onSubmit={handleCreateAccount} className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="accountType" 
                      value="SAVINGS" 
                      checked={accountType === "SAVINGS"}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="text-brand focus:ring-brand"
                    />
                    <div>
                      <h4 className="text-white font-medium">Savings Account</h4>
                      <p className="text-xs text-gray-400">Earn 4.5% APY on your balance</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="accountType" 
                      value="CURRENT" 
                      checked={accountType === "CURRENT"}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="text-brand focus:ring-brand"
                    />
                    <div>
                      <h4 className="text-white font-medium">Checking Account</h4>
                      <p className="text-xs text-gray-400">Everyday spending with zero fees</p>
                    </div>
                  </div>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingAccount}
                className="w-full bg-brand text-black font-bold py-3.5 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-brand/20 transition-all disabled:opacity-50"
              >
                {isSubmittingAccount ? "Opening..." : "Confirm & Open Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
