
import { useState, useEffect, useRef } from 'react';
import {
    Shield,
    Terminal,
    Activity,
    Database,
    Key,
    // FolderOpen,
    Plus,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LOG_MESSAGES = [
    "[SYS] Initializing Docker Node environment...",
    "[SYS] Connecting to local Docker Node at 127.0.0.1:8000...",
    "[SYS] Handshake successful. Protocol v2.1.0-TEE",
    "[SEC] Verifying Intel SGX Enclave integrity...",
    "[SEC] Memory Isolation: Active (AES-NI enabled)",
    "[SEC] Disk Leakage Protection: Verified.",
    "[NET] Syncing with Rapha Network (Polygon)...",
    "[NET] Node Status: Healthy. Awaiting compute jobs."
];

export default function HospitalPortal() {
    const [logs, setLogs] = useState<string[]>([]);
    const [pairingKey, setPairingKey] = useState<string | null>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < LOG_MESSAGES.length) {
                setLogs(prev => [...prev, LOG_MESSAGES[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const generateKey = () => {
        const key = "RAPHA-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now().toString().slice(-4);
        setPairingKey(key);
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Building2 size={18} />
                            <span className="text-xs font-mono font-bold tracking-widest uppercase">Enterprise TEE Node</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Hospital Command Center</h1>
                    </div>
                    <Link to="/" className="text-sm border border-zinc-800 px-4 py-2 rounded-md hover:bg-zinc-900 transition-colors">
                        Back to Home
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Handshake & Security */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Firewall Handshake UI */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-zinc-800 bg-black overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                                    <Terminal size={14} />
                                    Firewall Handshake Log
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                                </div>
                            </div>
                            <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-2 scrollbar-hide">
                                {logs.map((log, idx) => (
                                    <div key={idx} className={`${log.includes('SUCCESS') || log.includes('Verified') ? 'text-green-400' : log.includes('SEC') ? 'text-blue-400' : 'text-zinc-500'}`}>
                                        <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                        {log}
                                    </div>
                                ))}
                                <div ref={logEndRef} />
                            </div>
                        </motion.div>

                        {/* Database Mapping Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Database className="text-zinc-400" size={20} />
                                    <h2 className="text-lg font-bold text-white">Local Database Mapping</h2>
                                </div>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md text-xs font-semibold hover:bg-blue-500 hover:text-white transition-all">
                                    <Plus size={14} /> Map Directory
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                                        <tr>
                                            <th className="pb-3 px-2">Local Path</th>
                                            <th className="pb-3 px-2">Virtual Node ID</th>
                                            <th className="pb-3 px-2">Access Type</th>
                                            <th className="pb-3 px-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        <tr className="group">
                                            <td className="py-4 px-2 font-mono text-zinc-400">/mnt/pacs/mri_scans_2024</td>
                                            <td className="py-4 px-2 font-mono text-blue-400">v-node-01-mri</td>
                                            <td className="py-4 px-2 text-xs">Read-Only (TEE-Env)</td>
                                            <td className="py-4 px-2">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">
                                                    Mounted
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-4 px-2 font-mono text-zinc-400">/data/ehr/patient_records</td>
                                            <td className="py-4 px-2 font-mono text-blue-400">v-node-02-ehr</td>
                                            <td className="py-4 px-2 text-xs">ZK-Query Restricted</td>
                                            <td className="py-4 px-2">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">
                                                    Mounted
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Security monitor & Key Gen */}
                    <div className="space-y-8">

                        {/* TEE Security Monitor */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-6 space-y-6"
                        >
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                                <Shield className="text-blue-500" size={20} />
                                <h2 className="text-lg font-bold text-white">Security Monitor</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-emerald-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">Leakage Protection</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">Disk Encrypted</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-500">VERIFIED</span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                                            <Activity size={16} className="text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-400">ZK-TLS Audit</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">Next Sync: 4m</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-500">PENDING</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Generate Key */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 space-y-6"
                        >
                            <div className="flex items-center gap-2">
                                <Key className="text-blue-400" size={20} />
                                <h2 className="text-lg font-bold text-white">Node Pairing</h2>
                            </div>
                            <p className="text-sm text-zinc-400">Generate a one-time pairing key to secure a new edge device connection.</p>

                            {!pairingKey ? (
                                <button
                                    onClick={generateKey}
                                    className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    Generate Node Pairing Key
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-black rounded-lg border border-blue-500/50 flex items-center justify-between group">
                                        <span className="font-mono text-blue-400 font-bold tracking-wider">{pairingKey}</span>
                                        <button className="text-zinc-500 hover:text-white"><Terminal size={16} /></button>
                                    </div>
                                    <button
                                        onClick={() => setPairingKey(null)}
                                        className="w-full py-2 text-zinc-500 text-xs font-semibold hover:text-zinc-300"
                                    >
                                        Reset Key
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Missing icon used in code
function Building2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}
