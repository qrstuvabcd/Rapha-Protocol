
import { useState } from 'react';
import {
    Cpu,
    Zap,
    Activity,
    Heart,
    Moon,
    TrendingUp,
    ShieldCheck,
    Wallet,
    ChevronRight,
    ArrowUpRight,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PatientPortal() {
    const [isClaiming, setIsClaiming] = useState(false);
    const [balance, setBalance] = useState(142.50);
    const [toggles, setToggles] = useState({
        heartRate: true,
        sleep: true,
        hrv: false
    });

    const toggleHealth = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleClaim = () => {
        setIsClaiming(true);
        setTimeout(() => {
            setBalance(0);
            setIsClaiming(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans pb-24">
            {/* Mobile-First Header */}
            <div className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-lg border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Cpu size={18} className="text-purple-400" />
                    </div>
                    <span className="font-bold text-white tracking-tight">Edge Node v0.4</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 pt-8 space-y-8">

                {/* NPU Activity Graph Simulation */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Zap size={14} className="text-yellow-400" />
                            NPU Activity (On-Device)
                        </h2>
                        <span className="text-[10px] font-mono text-zinc-600">42% Load</span>
                    </div>

                    <div className="h-32 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-end justify-between p-4 gap-1 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent"></div>
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 10 }}
                                animate={{ height: [10, 40 + Math.random() * 60, 20 + Math.random() * 40, 10] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5 + Math.random(),
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                }}
                                className="w-full bg-gradient-to-t from-purple-600/40 to-purple-400 rounded-t-sm"
                            />
                        ))}
                    </div>
                    <p className="text-[10px] text-center text-zinc-500 font-medium">Training Local Llama-3 (Edge Adaptor) while device is charging.</p>
                </section>

                {/* Gradient Ledger */}
                <section className="rounded-3xl bg-zinc-900/30 border border-zinc-800 p-6 space-y-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-cyan-400" />
                        <h2 className="font-bold text-white">The Gradient Ledger</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                    <Activity size={18} className="text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Alzheimer's Study</p>
                                    <p className="text-[10px] text-zinc-500">Oxford Neurological</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono font-bold text-cyan-400">+0.042 Gradient</p>
                                <p className="text-[10px] text-zinc-600">2h ago</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    <Heart size={18} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Cardio-Mapping</p>
                                    <p className="text-[10px] text-zinc-500">Mayo Clinic Research</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono font-bold text-purple-400">+0.108 Gradient</p>
                                <p className="text-[10px] text-zinc-600">6h ago</p>
                            </div>
                        </div>
                    </div>

                    <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-800/50 text-xs font-bold hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700">
                        View Contribution History
                        <ChevronRight size={14} />
                    </button>
                </section>

                {/* HealthKit Toggles */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        Edge Compute Access
                    </h2>

                    <div className="space-y-3">
                        {[
                            { id: 'heartRate' as const, label: 'Heart Rate Records', icon: Heart, sub: 'Real-time telemetry' },
                            { id: 'sleep' as const, label: 'Sleep Analysis', icon: Moon, sub: 'Circadian sync data' },
                            { id: 'hrv' as const, label: 'HRV Variability', icon: Activity, sub: 'Stress biomarker mapping' }
                        ].map(({ id, label, icon: Icon, sub }) => (
                            <div key={id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toggles[id] ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{label}</h3>
                                        <p className="text-[10px] text-zinc-500">{sub}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleHealth(id)}
                                    className={`w-12 h-6 rounded-full relative transition-colors p-1 ${toggles[id] ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                                >
                                    <motion.div
                                        animate={{ x: toggles[id] ? 24 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Rewards Section */}
                <section className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 shadow-xl shadow-purple-500/20">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Wallet size={20} className="text-white" />
                        </div>
                        <div className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                            Mainnet Rewards
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-zinc-200 text-xs font-semibold mb-1">Available to Claim</p>
                        <h3 className="text-4xl font-black text-white tracking-tighter">${balance.toFixed(2)} <span className="text-lg opacity-60">USDC</span></h3>
                    </div>

                    <button
                        onClick={handleClaim}
                        disabled={balance === 0 || isClaiming}
                        className="w-full py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isClaiming ? (
                            <>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap size={18} /></motion.div>
                                Confirming Transaction...
                            </>
                        ) : (
                            <>
                                Claim to Polygon Wallet
                                <ArrowUpRight size={18} />
                            </>
                        )}
                    </button>
                </section>

                <p className="text-center text-[10px] text-zinc-600 pb-12 flex items-center justify-center gap-2">
                    <Clock size={10} /> Last network sync: {new Date().toLocaleTimeString()}
                </p>
            </div>

            {/* Navigation Padding Spacer */}
            <div className="h-24"></div>

            {/* Mobile Back Button */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <Link to="/" className="px-6 py-3 rounded-full bg-zinc-900/90 border border-zinc-700 text-white font-bold text-sm shadow-2xl backdrop-blur-md hover:bg-zinc-800 transition-all flex items-center gap-2">
                    Home Portal
                </Link>
            </div>
        </div>
    );
}
