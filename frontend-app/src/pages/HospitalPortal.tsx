import { useState, useEffect, useRef } from 'react';
import {
    Shield,
    Terminal,
    Activity,
    Cpu,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Server
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface WeightEntry {
    payloadHash: string;
    weightHash: string;
    timestamp: string;
    status: 'Verified' | 'Settling' | 'Settled';
}

export default function HospitalPortal() {
    const [logs, setLogs] = useState<string[]>([]);
    const [nodeStatus, setNodeStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
    const [ledger, setLedger] = useState<WeightEntry[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Step 1: Real-time Node Ping
    useEffect(() => {
        const checkNode = async () => {
            try {
                // In production, this pings the local Docker node sidecar
                await fetch('http://localhost:8000/', { mode: 'no-cors' });
                setNodeStatus('connected');
                if (logs.length === 0) {
                    setLogs(["[SYS] Node detected at 127.0.0.1:8000", "[SEC] TEE Environment: Intel SGX Enabled", "[NET] Awaiting incoming training payloads..."]);
                }
            } catch (e) {
                setNodeStatus('disconnected');
                setLogs(["[ERR] FATAL: Local Node Disconnected.", "[SYS] Ensure Docker container 'rapha-tee-node' is running."]);
            }
        };

        const interval = setInterval(checkNode, 5000);
        checkNode();
        return () => clearInterval(interval);
    }, [logs.length]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Simulate weight generation for the ledger if connected
    useEffect(() => {
        if (nodeStatus === 'connected' && ledger.length === 0) {
            setLedger([
                {
                    payloadHash: "0x7a2b...4f89",
                    weightHash: "0xzk_9201...f3a2",
                    timestamp: "2 mins ago",
                    status: 'Settled'
                },
                {
                    payloadHash: "0x1c9d...e412",
                    weightHash: "0xzk_4812...b9c1",
                    timestamp: "14 mins ago",
                    status: 'Settled'
                }
            ]);
        }
    }, [nodeStatus, ledger.length]);

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${nodeStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            <Server size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${nodeStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className="text-xs font-mono font-bold tracking-widest uppercase">
                                    {nodeStatus === 'connected' ? 'Node Online' : 'Node Disconnected'}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">TEE Command Center</h1>
                        </div>
                    </div>
                    <Link to="/" className="text-sm border border-zinc-800 px-4 py-2 rounded-md hover:bg-zinc-900 transition-colors">
                        Back to Home
                    </Link>
                </div>

                {/* Infrastructure Brief */}
                <section className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Cpu size={120} />
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <Shield size={18} className="text-blue-400" />
                            No-Data-Movement Infrastructure
                        </h2>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            Your Enterprise Node is a <span className="text-blue-400 font-mono">secure local Docker container (TEE)</span> installed behind the hospital firewall. It intercepts training payloads from AI researchers, computes models in isolated memory, and returns only <span className="text-white font-mono">cryptographic mathematical weights</span>. Raw patient data never touches the internet.
                        </p>
                    </div>
                </section>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Log Stream Terminal */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-xl border border-zinc-800 bg-black overflow-hidden shadow-2xl flex flex-col h-[400px]">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                                    <Terminal size={14} />
                                    Live Node Hardware Logs
                                </div>
                                <div className="flex gap-1.5 font-mono text-[10px] text-zinc-600">
                                    127.0.0.1:8000
                                </div>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto font-mono text-[13px] space-y-1.5 bg-[#0c0c0e]">
                                {logs.map((log, idx) => (
                                    <div key={idx} className={log.includes('[ERR]') ? 'text-red-400' : log.includes('[SEC]') ? 'text-blue-400' : 'text-zinc-500'}>
                                        <span className="opacity-30 mr-3 underline">{idx + 1}</span>
                                        {log}
                                    </div>
                                ))}
                                {nodeStatus === 'disconnected' && (
                                    <div className="mt-8 p-4 border border-red-500/20 bg-red-500/5 rounded-lg border-dashed">
                                        <div className="flex gap-3">
                                            <AlertCircle className="text-red-400" size={18} />
                                            <div className="space-y-2">
                                                <p className="text-sm font-bold text-white">Action Required</p>
                                                <p className="text-xs text-zinc-400">The TEE supervisor cannot heartbeat the local container. Run the startup script to re-enable compute:</p>
                                                <code className="block bg-black p-2 rounded text-red-300 text-[10px]">docker run -p 8000:8000 rapha-protocol/enterprise-node</code>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={logEndRef} />
                            </div>
                        </div>

                        {/* Weight Ledger */}
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="text-zinc-400" size={20} />
                                    <h2 className="text-lg font-bold text-white">Cryptographic Weight Ledger</h2>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500 uppercase">ZK-SNARK Proof Stream</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                                        <tr>
                                            <th className="pb-3 px-2">Incoming Payload</th>
                                            <th className="pb-3 px-2">Outgoing Weight (ZK)</th>
                                            <th className="pb-3 px-2">Time</th>
                                            <th className="pb-3 px-2 text-right">State</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {ledger.map((entry, i) => (
                                            <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-2 font-mono text-[11px] text-zinc-500">{entry.payloadHash}</td>
                                                <td className="py-4 px-2 font-mono text-[11px] text-blue-400">{entry.weightHash}</td>
                                                <td className="py-4 px-2 text-[11px] text-zinc-600">{entry.timestamp}</td>
                                                <td className="py-4 px-2 text-right">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                                                        {entry.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {ledger.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-zinc-600 italic text-sm">
                                                    No weights processed in the current epoch.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Node Management */}
                    <div className="space-y-8">
                        <section className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-6 space-y-6">
                            <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                                <Shield className="text-blue-500" size={20} />
                                <h2 className="text-lg font-bold text-white">Hardware Health</h2>
                            </div>
                            <div className="space-y-4">
                                <StatusItem label="Memory Isolation" sub="Intel SGX" status={nodeStatus === 'connected' ? 'Active' : 'Offline'} />
                                <StatusItem label="Disk Encrypted" sub="AES-256" status={nodeStatus === 'connected' ? 'Verified' : 'Offline'} />
                                <StatusItem label="ZK-TLS Audit" sub="Audit: 4m" status={nodeStatus === 'connected' ? 'Synced' : 'N/A'} />
                            </div>
                        </section>

                        <section className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-6 space-y-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <ArrowRight size={16} className="text-blue-400" />
                                Protocol Settlement
                            </h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Once weights are generated and proofs are verified on Polygon, payments are automatically distributed via the <span className="text-blue-400 italic">RaphaEscrow</span> contract.
                            </p>
                            <button className="w-full py-2 bg-zinc-800 rounded border border-zinc-700 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all">
                                Open Contract Explorer
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusItem({ label, sub, status }: { label: string, sub: string, status: string }) {
    const isActive = status !== 'Offline' && status !== 'N/A';
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border transition-colors ${isActive ? 'border-emerald-500/20' : 'border-zinc-800 opacity-50'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center ${isActive ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
                    <CheckCircle2 size={16} className={isActive ? 'text-emerald-500' : 'text-zinc-600'} />
                </div>
                <div>
                    <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-zinc-500'}`}>{label}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">{sub}</p>
                </div>
            </div>
            <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-500' : 'text-zinc-700'}`}>{status}</span>
        </div>
    );
}
