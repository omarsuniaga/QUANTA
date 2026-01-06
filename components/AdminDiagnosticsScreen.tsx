import React, { useState, useEffect, useCallback } from 'react';
import {
    Activity, Database, Server, Smartphone, User, Terminal,
    FileJson, Download, RefreshCw, CheckCircle, XCircle, AlertTriangle,
    Search, Trash2, ArrowLeft, Shield, Clock, Wifi, Hash, Upload, FileText,
    Save, Key, Menu
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { backupService } from '../services/backupService';
import { reportService } from '../services/reportService';
import { logger, SystemLog } from '../services/loggerService';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, AppSettings, User as UserType } from '../types';

interface DiagnosticCheck {
    id: string;
    name: string;
    status: 'pending' | 'success' | 'error' | 'warning';
    message?: string;
    latency?: number;
}

export const AdminDiagnosticsScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'system' | 'user' | 'logs' | 'data'>('system');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [checks, setChecks] = useState<DiagnosticCheck[]>([
        { id: 'network', name: 'Network Connectivity', status: 'pending' },
        { id: 'storage', name: 'Local Storage Access', status: 'pending' },
        { id: 'firebase', name: 'Firebase Connection', status: 'pending' },
        { id: 'gemini', name: 'Gemini API Status', status: 'pending' },
    ]);
    const [userData, setUserData] = useState<{ profile: any, settings: any, stats: any } | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    // Load Logs
    useEffect(() => {
        setLogs(logger.getLogs());
        const unsubscribe = logger.subscribe((newLogs) => setLogs([...newLogs]));
        return unsubscribe;
    }, []);

    // Run Diagnostics
    const runDiagnostics = useCallback(async () => {
        setLoading(true);
        const newChecks = [...checks];
        const updateCheck = (id: string, status: DiagnosticCheck['status'], msg?: string, latency?: number) => {
            const idx = newChecks.findIndex(c => c.id === id);
            if (idx !== -1) {
                newChecks[idx] = { ...newChecks[idx], status, message: msg, latency };
                setChecks([...newChecks]);
            }
        };

        // 1. Network
        const startNet = performance.now();
        const isOnline = navigator.onLine;
        updateCheck('network', isOnline ? 'success' : 'error', isOnline ? 'Online' : 'Offline', performance.now() - startNet);

        // 2. Storage
        try {
            const startStore = performance.now();
            localStorage.setItem('diag_test', 'ok');
            const val = localStorage.getItem('diag_test');
            localStorage.removeItem('diag_test');
            if (val === 'ok') {
                updateCheck('storage', 'success', 'Read/Write OK', performance.now() - startStore);
            } else {
                throw new Error('Storage verification failed');
            }
        } catch (e: any) {
            updateCheck('storage', 'error', e.message);
        }

        // 3. Firebase (Mock check via Auth)
        if (user) {
            updateCheck('firebase', 'success', `Auth ID: ${user.uid.slice(0, 5)}...`);
        } else {
            updateCheck('firebase', 'warning', 'User not authenticated (Offline mode?)');
        }

        // 4. Gemini API
        try {
            const startGemini = performance.now();
            const hasKey = await geminiService.hasApiKey();
            if (hasKey) {
                // Can't easily ping without spending tokens, so just checking key presence
                updateCheck('gemini', 'success', 'API Key Present', performance.now() - startGemini);
            } else {
                updateCheck('gemini', 'warning', 'No API Key found');
            }
        } catch (e: any) {
            updateCheck('gemini', 'error', e.message);
        }

        setLoading(false);
        logger.info('system', 'Diagnostics run completed');
    }, [checks, user]);

    // Load User Data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            const settings = await storageService.getSettings();
            const txs = await storageService.getTransactions();
            const goals = await storageService.getGoals();
            const budgets = await storageService.getBudgets();

            setUserData({
                profile: user,
                settings,
                stats: {
                    transactionCount: txs.length,
                    goalCount: goals.length,
                    budgetCount: budgets.length,
                    dbSize: JSON.stringify(txs).length + JSON.stringify(goals).length
                }
            });
            setTransactions(txs);
        };
        fetchUserData();
    }, [user]);

    // Export Data
    const handleExportJSON = () => {
        const fullData = {
            user: userData?.profile,
            settings: userData?.settings,
            transactions,
            timestamp: new Date().toISOString(),
            logs
        };
        const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quanta_diagnostic_export_${Date.now()}.json`;
        a.click();
        logger.success('data', 'System data exported to JSON');
    };

    const handleExportCSV = () => {
        if (transactions.length === 0) return;
        const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'Method'];
        const rows = transactions.map(t => [
            t.date,
            t.type,
            t.amount,
            'USD', // Assuming base for simplicity, ideally from monetaryDetails
            t.category,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            t.paymentMethodType
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${Date.now()}.csv`;
        a.click();
        logger.success('data', 'Transactions exported to CSV');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'error': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'warning': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 text-slate-200 font-mono flex flex-col overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <h1 className="text-lg font-bold tracking-tight">MASTER DIAGNOSTIC SYSTEM <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">BETA</span></h1>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <XCircle className="w-6 h-6" />
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Mobile Hamburger Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Sidebar */}
                <nav className={`
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    fixed lg:relative inset-y-0 left-0 z-40
                    w-64 border-r border-slate-800 bg-slate-900/95 lg:bg-slate-900/30 
                    p-4 space-y-1 transition-transform duration-300 ease-in-out
                    backdrop-blur-md lg:backdrop-blur-none
                    top-16 lg:top-0
                `}>
                    {[
                        { id: 'system', icon: Server, label: 'System Health' },
                        { id: 'user', icon: User, label: 'User Inspector' },
                        { id: 'logs', icon: Terminal, label: 'Live Logs' },
                        { id: 'data', icon: Database, label: 'Data Explorer' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                setSidebarOpen(false); // Close on mobile tap
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}

                    <div className="mt-8 pt-4 border-t border-slate-800">
                        <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Actions</div>
                        <button
                            onClick={handleExportJSON}
                            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 transition-colors"
                        >
                            <Download className="w-4 h-4" /> Export Full JSON
                        </button>
                    </div>
                </nav>

                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden top-16"
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6 bg-slate-950 relative">

                    {/* SYSTEM TAB */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">System Health Checks</h2>
                                <button
                                    onClick={runDiagnostics}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Run Diagnostics
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {checks.map(check => (
                                    <div key={check.id} className={`p-4 rounded-xl border flex items-center justify-between ${getStatusColor(check.status)}`}>
                                        <div className="flex items-center gap-3">
                                            {check.status === 'pending' && <RefreshCw className="w-5 h-5 animate-spin opacity-50" />}
                                            {check.status === 'success' && <CheckCircle className="w-5 h-5" />}
                                            {check.status === 'error' && <XCircle className="w-5 h-5" />}
                                            {check.status === 'warning' && <AlertTriangle className="w-5 h-5" />}
                                            <div>
                                                <div className="font-bold">{check.name}</div>
                                                {check.message && <div className="text-xs opacity-80 mt-1">{check.message}</div>}
                                            </div>
                                        </div>
                                        {check.latency && (
                                            <div className="text-xs font-mono opacity-60">{check.latency.toFixed(0)}ms</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-slate-800">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Environment Info</h3>
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-500">User Agent</span>
                                        <span className="text-slate-300 max-w-xs truncate" title={navigator.userAgent}>{navigator.userAgent}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-500">Screen Resolution</span>
                                        <span className="text-slate-300">{window.innerWidth} x {window.innerHeight}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-500">Timezone</span>
                                        <span className="text-slate-300">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-500">Language</span>
                                        <span className="text-slate-300">{navigator.language}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USER TAB */}
                    {activeTab === 'user' && userData && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <h2 className="text-xl font-bold mb-4">User Inspector</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                                    <div className="text-slate-500 text-xs uppercase mb-1">Total Transactions</div>
                                    <div className="text-2xl font-bold text-white">{userData.stats.transactionCount}</div>
                                </div>
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                                    <div className="text-slate-500 text-xs uppercase mb-1">Active Budgets</div>
                                    <div className="text-2xl font-bold text-indigo-400">{userData.stats.budgetCount}</div>
                                </div>
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                                    <div className="text-slate-500 text-xs uppercase mb-1">Approx DB Size</div>
                                    <div className="text-2xl font-bold text-emerald-400">{(userData.stats.dbSize / 1024).toFixed(2)} KB</div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 font-medium">User Profile (Raw)</div>
                                <pre className="p-4 text-xs text-indigo-300 overflow-auto max-h-64">
                                    {JSON.stringify(userData.profile, null, 2)}
                                </pre>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 font-medium">App Settings (Raw)</div>
                                <pre className="p-4 text-xs text-amber-300 overflow-auto max-h-64">
                                    {JSON.stringify(userData.settings, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">Live System Logs</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => logger.clear()} className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 flex items-center gap-2">
                                        <Trash2 className="w-3 h-3" /> Clear
                                    </button>
                                    <span className="px-3 py-1.5 text-xs bg-slate-800 rounded-lg text-slate-400 border border-slate-700">
                                        {logs.length} events
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs flex flex-col">
                                <div className="flex items-center bg-slate-900 border-b border-slate-800 px-4 py-2 text-slate-500 font-bold uppercase text-[10px]">
                                    <div className="w-24">Time</div>
                                    <div className="w-20">Level</div>
                                    <div className="w-32">Category</div>
                                    <div className="flex-1">Message</div>
                                </div>
                                <div className="flex-1 overflow-auto p-0">
                                    {logs.length === 0 ? (
                                        <div className="p-8 text-center text-slate-600">No logs captured yet. Perform some actions in the app.</div>
                                    ) : (
                                        logs.map(log => (
                                            <div key={log.id} className="flex items-start border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                                                <div className="w-24 py-2 px-4 text-slate-500 whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleTimeString()}
                                                </div>
                                                <div className="w-20 py-2 px-4">
                                                    <span className={`px-1.5 py-0.5 rounded uppercase text-[10px] font-bold ${log.level === 'error' ? 'bg-rose-500/20 text-rose-400' :
                                                        log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                                                            log.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {log.level}
                                                    </span>
                                                </div>
                                                <div className="w-32 py-2 px-4 text-slate-400 font-medium truncate" title={log.category}>
                                                    {log.category}
                                                </div>
                                                <div className="flex-1 py-2 px-4 text-slate-300 break-all">
                                                    {log.message}
                                                    {log.details && (
                                                        <details className="mt-1">
                                                            <summary className="cursor-pointer text-slate-500 hover:text-slate-400">View Details</summary>
                                                            <pre className="mt-2 p-2 bg-black/30 rounded border border-slate-800 text-slate-400 overflow-auto max-h-40">
                                                                {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DATA TAB */}
                    {activeTab === 'data' && (
                        <div className="h-full flex flex-col max-w-6xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Data Management Center</h2>
                            </div>

                            {/* New Backup & Report Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* 1. BACKUP */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all group">
                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Save className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">Create Backup</h3>
                                    <p className="text-xs text-slate-500 mb-4 h-10">Export all system data to a JSON file for safekeeping.</p>
                                    <button
                                        onClick={() => backupService.downloadBackup()}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Download JSON
                                    </button>
                                </div>

                                {/* 2. RESTORE */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-all group relative overflow-hidden">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">Restore Data</h3>
                                    <p className="text-xs text-slate-500 mb-4 h-10">Import JSON to recover lost data. Smart verification prevents duplicates.</p>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    if (confirm('Are you sure? This will merge the backup into your current data.')) {
                                                        backupService.restoreBackup(e.target.files[0]);
                                                    }
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        />
                                        <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors">
                                            Select Backup File
                                        </button>
                                    </div>
                                </div>

                                {/* 3. REPORT */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-rose-500/50 transition-all group">
                                    <div className="w-12 h-12 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">CPA Report (PDF)</h3>
                                    <p className="text-xs text-slate-500 mb-4 h-10">Generate a professional financial status report.</p>
                                    <button
                                        onClick={() => reportService.generateFinancialReport()}
                                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold transition-colors"
                                    >
                                        Generate PDF
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-8 mb-4">
                                <h2 className="text-lg font-bold">Transaction Explorer</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors text-xs border border-slate-700">
                                        <FileJson className="w-3 h-3" /> Export to CSV (Excel)
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-950 text-slate-400 font-medium uppercase sticky top-0">
                                            <tr>
                                                <th className="p-3 border-b border-slate-800">Date</th>
                                                <th className="p-3 border-b border-slate-800">Type</th>
                                                <th className="p-3 border-b border-slate-800 text-right">Amount</th>
                                                <th className="p-3 border-b border-slate-800">Category</th>
                                                <th className="p-3 border-b border-slate-800">Description</th>
                                                <th className="p-3 border-b border-slate-800">Method</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {transactions.map(t => (
                                                <tr key={t.id} className="hover:bg-slate-800/30">
                                                    <td className="p-3 text-slate-400 whitespace-nowrap">{t.date.split('T')[0]}</td>
                                                    <td className="p-3">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                            }`}>
                                                            {t.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono text-slate-200">{t.amount.toFixed(2)}</td>
                                                    <td className="p-3 text-slate-400">{t.category}</td>
                                                    <td className="p-3 text-slate-300 max-w-xs truncate" title={t.description}>{t.description || '-'}</td>
                                                    <td className="p-3 text-slate-500">{t.paymentMethodType}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-3 border-t border-slate-800 bg-slate-950 text-slate-500 text-xs flex justify-between">
                                    <span>Showing {transactions.length} records</span>
                                    <span>Latest: {transactions[0]?.date || 'None'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};
