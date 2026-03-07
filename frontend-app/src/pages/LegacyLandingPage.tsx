import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageFooter } from '../components/PageFooter';
import { CustomCursor } from '../components/CustomCursor';

export function LegacyLandingPage() {
    // Heavy spring physics config for bouncy hover and snap-back
    const springHover = {
        scale: 1.05,
        y: -10,
        transition: { type: 'spring' as const, stiffness: 300, damping: 15, mass: 1.2 }
    };

    const springTap = {
        scale: 0.95,
        transition: { type: 'spring' as const, stiffness: 400, damping: 10 }
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <CustomCursor />

            {/* Testing Product Warning Banner */}
            <div className="bg-amber-900/20 border-b border-amber-500/20 py-3 relative z-20 backdrop-blur-sm">
                <div className="container mx-auto px-6">
                    <p className="text-center text-amber-500/80 text-sm font-medium">
                        ⚠️ <strong>TESTING PRODUCT</strong>  This is an experimental product in development.
                        By using this service, you acknowledge that you may lose everything (including all assets and data)
                        and Rapha Protocol takes NO legal responsibility for any losses.
                    </p>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative pt-6 pb-20">
                {/* Header */}
                <header className="relative z-10 container mx-auto px-6 mb-20">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/rapha-logo.png" alt="Rapha Protocol" className="w-12 h-12 rounded-xl opacity-90" />
                            <div>
                                <span className="text-2xl font-black text-gradient">Rapha Protocol</span>
                                <p className="text-xs text-rapha-muted">Web3 Health Records</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/whitepaper" className="text-rapha-muted hover:text-white transition-colors">Whitepaper</Link>
                            <a href="https://polygonscan.com/address/0x5468B7d5F4A52d00b4192874598b620e53a0CcA6" target="_blank" rel="noopener noreferrer" className="text-rapha-muted hover:text-white transition-colors">Contract</a>
                        </div>
                    </nav>
                </header>

                {/* Hero Content */}
                <main className="relative z-10 container mx-auto px-6 text-center">
                    <div className="max-w-4xl mx-auto flex flex-col items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rapha-accent/5 border border-rapha-accent/10 text-rapha-muted text-sm font-medium mb-12"
                        >
                            <span className="w-2 h-2 bg-rapha-accent rounded-full animate-pulse opacity-50" />
                            Live on Polygon Mainnet
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
                            className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight tracking-tight"
                        >
                            Secure Data for Patients.
                            <br />
                            <span className="text-gradient">Sovereign Training for AI.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                            className="text-xl text-rapha-muted mb-16 max-w-2xl mx-auto font-light"
                        >
                            Store your medical records on the blockchain. Control who can access them.
                            Earn when AI researchers use your anonymized data.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 w-full"
                        >
                            <Link to="/patient" className="w-full sm:w-auto">
                                <motion.button whileHover={springHover} whileTap={springTap} className="btn-gradient text-lg px-8 py-4 w-full">
                                    Get Started
                                </motion.button>
                            </Link>
                            <Link to="/whitepaper" className="w-full sm:w-auto">
                                <motion.button whileHover={springHover} whileTap={springTap} className="px-8 py-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all w-full backdrop-blur-md">
                                    Read Whitepaper
                                </motion.button>
                            </Link>
                        </motion.div>

                        {/* Trust Badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                            className="flex flex-wrap items-center justify-center gap-8 text-sm text-rapha-muted/60 lowercase tracking-widest"
                        >
                            <span>Polygon</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span>E2E Encrypted</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span>HIPAA Compliant</span>
                        </motion.div>
                    </div>
                </main>
            </div>

            {/* Portal Cards Section */}
            <section className="relative z-10 container mx-auto px-6 py-24 border-t border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Access Portals</h2>
                    <p className="text-rapha-muted text-lg font-light">Select your point of entry</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                    {/* Patient Portal */}
                    <Link to="/patient">
                        <motion.div whileHover={springHover} whileTap={springTap} className="glass-card p-8 h-full group cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-white/10 transition-colors">
                                <span className="opacity-80 grayscale group-hover:grayscale-0 transition-all">🏥</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Patient</h3>
                            <p className="text-rapha-muted mb-8 font-light text-sm leading-relaxed">
                                Upload, manage, and share your medical records securely with healthcare providers.
                            </p>
                            <span className="text-white/60 font-medium flex items-center gap-2 group-hover:text-white group-hover:gap-4 transition-all uppercase tracking-wider text-xs">
                                Initialize <span>→</span>
                            </span>
                        </motion.div>
                    </Link>

                    {/* Hospital Portal */}
                    <Link to="/hospital">
                        <motion.div whileHover={springHover} whileTap={springTap} className="glass-card p-8 h-full group cursor-pointer flex flex-col justify-between">
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-white/10 transition-colors">
                                    <span className="opacity-80 grayscale group-hover:grayscale-0 transition-all">🩺</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Provider</h3>
                                <p className="text-rapha-muted mb-8 font-light text-sm leading-relaxed">
                                    Upload patient records with consent and request access to existing records.
                                </p>
                            </div>
                            <span className="text-white/60 font-medium flex items-center gap-2 group-hover:text-white group-hover:gap-4 transition-all uppercase tracking-wider text-xs">
                                Initialize <span>→</span>
                            </span>
                        </motion.div>
                    </Link>

                    {/* AI Research Portal */}
                    <Link to="/research">
                        <motion.div whileHover={springHover} whileTap={springTap} className="glass-card p-8 h-full group cursor-pointer flex flex-col justify-between">
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-white/10 transition-colors">
                                    <span className="opacity-80 grayscale group-hover:grayscale-0 transition-all">🧬</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Research</h3>
                                <p className="text-rapha-muted mb-8 font-light text-sm leading-relaxed">
                                    Access anonymized datasets for medical AI research with fair compensation.
                                </p>
                            </div>
                            <span className="text-white/60 font-medium flex items-center gap-2 group-hover:text-white group-hover:gap-4 transition-all uppercase tracking-wider text-xs">
                                Initialize <span>→</span>
                            </span>
                        </motion.div>
                    </Link>

                    {/* Keeper Portal */}
                    <Link to="/keeper">
                        <motion.div whileHover={springHover} whileTap={springTap} className="glass-card p-8 h-full group cursor-pointer relative flex flex-col justify-between">
                            <div>
                                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-bold tracking-widest backdrop-blur-md">
                                    BETA
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-white/10 transition-colors">
                                    <span className="opacity-80 grayscale group-hover:grayscale-0 transition-all">🛡️</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Keeper</h3>
                                <p className="text-rapha-muted mb-8 font-light text-sm leading-relaxed">
                                    Review, label, and quality-check ZK-TLS verified medical data as an expert.
                                </p>
                            </div>
                            <span className="text-white/60 font-medium flex items-center gap-2 group-hover:text-white group-hover:gap-4 transition-all uppercase tracking-wider text-xs">
                                Initialize <span>→</span>
                            </span>
                        </motion.div>
                    </Link>
                </div>
            </section>

            {/* 3-Column 'Why' Section */}
            <section className="relative z-10 container mx-auto px-6 py-24 border-t border-white/5 mb-20">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">The Protocol Difference</h2>
                    <p className="text-rapha-muted text-lg font-light max-w-2xl mx-auto">
                        A sovereign infrastructure standardizing the medical data economy through cryptographic guarantees.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                            <span className="text-3xl opacity-80">🔐</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-4">Zero-Trust Security</h4>
                        <p className="text-rapha-muted font-light leading-relaxed">
                            Every byte of health data is encrypted client-side. The network never sees the raw contents, ensuring complete privacy and HIPAA compliance from end to end.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                            <span className="text-3xl opacity-80">⛓️</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-4">Immutable Auditing</h4>
                        <p className="text-rapha-muted font-light leading-relaxed">
                            Access logs and permissions are written directly to the Polygon blockchain. Every interaction with your medical records is cryptographically verifiable and irreversible.
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                            <span className="text-3xl opacity-80">🪙</span>
                        </div>
                        <h4 className="text-xl font-bold text-white mb-4">Fair Monetization</h4>
                        <p className="text-rapha-muted font-light leading-relaxed">
                            By anonymously pooling your health data into verified datasets, you directly receive compensation from pharmaceutical and AI research entities without intermediaries.
                        </p>
                    </div>
                </div>
            </section>

            <PageFooter />
        </div>
    );
}

export default LandingPage;
