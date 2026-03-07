import { useState, useEffect } from 'react';
import { Network, Server, DollarSign, Activity, Cpu, Clock, CheckCircle, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setUptime((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    const activeJobs = [
        { id: 'JOB-9482', model: 'CardioNet-V4', status: 'Training', progress: 78, type: 'Enterprise Compute' },
        { id: 'JOB-9483', model: 'SleepGen-Alpha', status: 'Training', progress: 42, type: 'Edge Compute' },
        { id: 'JOB-9484', model: 'NeuroVision-X', status: 'Queued', progress: 0, type: 'Enterprise Compute' },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex isolate">
            {/* Background Effect */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 -z-10" />

            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-950/50 backdrop-blur-md hidden md:flex flex-col">
                <div className="p-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Rapha Node</span>
                    </div>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-100 transition-colors">
                        <Server className="w-4 h-4" />
                        <span className="text-sm font-medium">My Nodes</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/50 rounded-lg transition-colors">
                        <Network className="w-4 h-4" />
                        <span className="text-sm font-medium">Network Overview</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/50 rounded-lg transition-colors">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm font-medium">Earnings</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/50 rounded-lg transition-colors">
                        <Cpu className="w-4 h-4" />
                        <span className="text-sm font-medium">Active Jobs</span>
                    </a>
                </nav>
                <div className="p-4 border-t border-neutral-800">
                    <div className="px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                        <p className="text-xs text-neutral-500 mb-1">Total Earned</p>
                        <p className="text-lg font-mono font-bold text-emerald-400">2,491.50 RPHA</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-8">

                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Node Management</h1>
                            <p className="text-neutral-400 mt-1">Monitor and manage your decentralised compute nodes.</p>
                        </div>
                        <button className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors">
                            Deploy New Node
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Enterprise Node Card */}
                        <div className="col-span-1 lg:col-span-2 bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                            <div className="flex justify-between items-start mb-6 relative">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-neutral-800 rounded-lg border border-neutral-700">
                                        <Server className="w-5 h-5 text-neutral-300" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Enterprise Node (Docker)</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Online & Syncing</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-neutral-500 mb-1 flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> Uptime (Simulated)</p>
                                    <p className="font-mono text-lg">{formatUptime(86400 + uptime)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 relative">
                                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                                    <p className="text-xs text-neutral-500 mb-1">Compute Power</p>
                                    <p className="font-mono font-medium">12.4 TFLOPS</p>
                                </div>
                                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                                    <p className="text-xs text-neutral-500 mb-1">Bandwidth Usage</p>
                                    <p className="font-mono font-medium">4.2 TB / mo</p>
                                </div>
                                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                                    <p className="text-xs text-neutral-500 mb-1">Epochs Processed</p>
                                    <p className="font-mono font-medium">9,482</p>
                                </div>
                            </div>
                        </div>

                        {/* Edge Node Card (iOS) */}
                        <div className="col-span-1 bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
                            <div className="flex flex-col h-full justify-between relative">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-neutral-800 rounded-lg border border-neutral-700">
                                            <Cpu className="w-5 h-5 text-neutral-300" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">Edge Node (iOS)</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                                                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">Standby</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                                        Awaiting local biometric compute triggers. Connect HealthKit to participate in federated sleep studies.
                                    </p>
                                </div>
                                <button className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm font-medium transition-colors">
                                    Authorize Edge Compute
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Job Table */}
                    <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden mt-8">
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Active AI Models Training</h2>
                            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-700">{activeJobs.length} Jobs</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-950/50">
                                        <th className="p-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Job ID</th>
                                        <th className="p-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Model Name</th>
                                        <th className="p-4 text-xs font-medium text-neutral-500 uppercase tracking-wider">Compute Type</th>
                                        <th className="p-4 text-xs font-medium text-neutral-500 uppercase tracking-wider w-1/3">Compute Progress</th>
                                        <th className="p-4 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {activeJobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-neutral-800/20 transition-colors">
                                            <td className="p-4 font-mono text-sm text-neutral-400">{job.id}</td>
                                            <td className="p-4 text-sm font-medium text-neutral-100">{job.model}</td>
                                            <td className="p-4 text-sm text-neutral-400">{job.type}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 relative"
                                                            style={{ width: `${job.progress}%` }}
                                                        >
                                                            {job.progress > 0 && job.progress < 100 && (
                                                                <div className="absolute inset-0 bg-white/20 w-full animate-[pulse_2s_ease-in-out_infinite]" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-mono text-neutral-400 w-8">{job.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                {job.status === 'Training' ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        {job.status}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" />
                                                        {job.status}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
