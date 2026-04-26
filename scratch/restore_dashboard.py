
import sys

file_path = r'c:\Users\ADMIN\cerebro\frontend\src\components\DoctorDashboard.jsx'

clean_component = """const UtilityDashboardOverlay = ({ 
    type, isOpen, onClose, 
    inventoryItems, setInventoryItems, 
    broadcastHistory, setBroadcastHistory, 
    analyticsRange, setAnalyticsRange 
}) => {
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [selectedNode, setSelectedNode] = useState('All Staff');
    const [ordering, setOrdering] = useState(false);

    if (!isOpen) return null;

    const handleUpdateStock = (id, delta) => {
        setInventoryItems(prev => prev.map(item => 
            item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
        ));
    };

    const handleOrderMore = () => {
        setOrdering(true);
        setTimeout(() => {
            setInventoryItems(prev => prev.map(item => ({ ...item, stock: item.stock + 20 })));
            setOrdering(false);
        }, 3000);
    };

    const handleSendBroadcast = () => {
        if (!broadcastMsg.trim()) return;
        setIsSending(true);
        setTimeout(() => {
            const newBroadcast = {
                id: Date.now(),
                message: broadcastMsg,
                target: selectedNode,
                timestamp: new Date().toISOString()
            };
            setBroadcastHistory(prev => [newBroadcast, ...prev]);
            setIsSending(false);
            setSent(true);
            setBroadcastMsg('');
            setTimeout(() => setSent(false), 2000);
        }, 1500);
    };

    const getInventoryStatus = (stock) => {
        if (stock < 5) return { label: 'CRITICAL', color: 'text-rose-400', pip: 'bg-rose-500', glow: 'shadow-[0_0_15px_rgba(225,29,72,0.4)]' };
        if (stock < 20) return { label: 'LOW', color: 'text-amber-400', pip: 'bg-amber-500', glow: '' };
        return { label: 'STABLE', color: 'text-emerald-400', pip: 'bg-emerald-500', glow: '' };
    };

    const getAnalyticsData = () => {
        switch (analyticsRange) {
            case '24h': return {
                stats: [
                    { label: 'Patient Volume', value: '24', trend: '+4%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '8.5m', trend: '-2m', color: 'text-emerald-400' },
                    { label: 'Revenue Pulse', value: '$2.1k', trend: '+12%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '98%', trend: '+1%', color: 'text-amber-400' }
                ],
                points: [80, 60, 40, 55, 75, 50, 45]
            };
            case '30d': return {
                stats: [
                    { label: 'Patient Volume', value: '648', trend: '+18%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '18.4m', trend: '+2m', color: 'text-rose-400' },
                    { label: 'Revenue Pulse', value: '$54.2k', trend: '+5%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '91%', trend: '-2%', color: 'text-rose-400' }
                ],
                points: [20, 15, 30, 45, 10, 5, 25]
            };
            default: return { // 7d
                stats: [
                    { label: 'Patient Volume', value: '142', trend: '+12%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '14.2m', trend: '-4m', color: 'text-emerald-400' },
                    { label: 'Revenue Pulse', value: '$12.4k', trend: '+8%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '94%', trend: '+2%', color: 'text-amber-400' }
                ],
                points: [60, 30, 55, 10, 35, 20, 50]
            };
        }
    };

    const renderPulseChart = (points) => {
        const width = 460;
        const height = 100;
        const spacing = width / (points.length - 1);
        
        let areaPath = f"M 0,{height} "
        for i, p in enumerate(points):
            areaPath += f"L {i * spacing},{p} "
        areaPath += f"L {width},{height} Z"

        let linePath = f"M 0,{points[0]} "
        for i, p in enumerate(points):
            if i == 0: continue
            prevX = (i - 1) * spacing
            prevY = points[i-1]
            currX = i * spacing
            currY = p
            cp1x = prevX + spacing / 2
            cp2x = currX - spacing / 2
            linePath += f"C {cp1x},{prevY} {cp2x},{currY} {currX},{currY} "

        return (
            <div className="relative h-28 w-full mt-2 overflow-hidden bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={areaPath} fill="url(#chartGradient)" />
                    <motion.path 
                        initial={{ pathLength: 0, opacity: 0 }} 
                        animate={{ pathLength: 1, opacity: 1 }} 
                        transition={{ duration: 1.5, ease: "easeInOut" }} 
                        d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
                    />
                    {points.map((p, i) => (
                        <motion.circle key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} cx={i * spacing} cy={p} r="3" fill="#3b82f6" />
                    ))}
                </svg>
                <div className="absolute inset-x-0 bottom-2 px-4 flex justify-between text-[8px] font-black text-blue-500/40 uppercase tracking-[0.2em] pointer-events-none">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (type) {
            case 'reports':
                const data = getAnalyticsData();
                return (
                    <div className="space-y-6">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-2">
                            {['24h', '7d', '30d'].map((range) => (
                                <button key={range} onClick={() => setAnalyticsRange(range)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${analyticsRange === range ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-white'}`}>{range}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {data.stats.map((stat, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group overflow-hidden relative">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${stat.trend.startsWith('+') ? stat.color.replace('text-', 'bg-') : 'bg-rose-500'} opacity-20`} />
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-end justify-between">
                                        <h4 className="text-2xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stat.value}</h4>
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} border border-current opacity-70`}>{stat.trend}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                            <h4 className="text-white font-black text-[10px] mb-4 uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><TrendingUp size={12} className="text-blue-500" /> Pulse Density Monitor</h4>
                            {renderPulseChart(data.points)}
                        </div>
                    </div>
                );
            case 'broadcast':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest pl-1">Target Personnel Node</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[{ id: 'All Staff', icon: Users, color: 'text-purple-400' }, { id: 'Nursing Node', icon: Activity, color: 'text-blue-400' }, { id: 'Diagnostic Lab', icon: Microscope, color: 'text-emerald-400' }].map(node => (
                                        <button key={node.id} onClick={() => setSelectedNode(node.id)} className={`p-3 border rounded-2xl text-[10px] font-black transition-all flex flex-col items-center gap-2 ${selectedNode === node.id ? `bg-white/10 border-purple-500/50 ${node.color} shadow-[0_0_20px_rgba(168,85,247,0.15)]` : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'}`}><node.icon size={16} /><br/>{node.id}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest pl-1">Secure Terminal Header</label>
                                <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Enter encrypted clinic-wide broadcast..." className="w-full h-32 bg-black/40 border border-white/10 rounded-[2rem] p-5 text-sm font-medium text-blue-100 placeholder-blue-900/30 focus:outline-none focus:border-purple-500/50 transition-all resize-none custom-scrollbar shadow-inner" />
                                <div className="absolute bottom-4 right-4 text-[10px] font-black text-purple-500/30 uppercase tracking-widest">AES-256 Secured</div>
                            </div>
                        </div>
                        <button onClick={handleSendBroadcast} disabled={isSending || sent || !broadcastMsg.trim()} className={`w-full py-5 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${sent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : isSending ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95'}`}>
                            {sent ? <><CheckCircle2 size={20} /> DISPATCH SUCCESSFUL</> : isSending ? <>SYNCING WITH NODES...</> : <><Plus size={20} /> SEND BROADCAST</>}
                        </button>
                        {broadcastHistory.length > 0 && (
                            <div className="pt-6 border-t border-white/5 mt-4">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2 justify-center"><Clock size={12} /> SECURE BROADCAST LOG</h4>
                                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-3">
                                    <AnimatePresence>
                                        {broadcastHistory.map((log) => (
                                            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="group relative pl-4 border-l-2 border-purple-500/20 py-1">
                                                <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-purple-500 group-hover:animate-ping" />
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="flex items-center gap-2 px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-md text-[9px] font-black text-purple-400 uppercase tracking-widest shadow-sm">{log.target}</span>
                                                    <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-[13px] text-gray-300 leading-relaxed font-medium pl-1">{log.message}</p>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'inventory':
                return (
                    <div className="space-y-4 pt-2">
                        {inventoryItems.map((item) => {
                            const status = getInventoryStatus(item.stock);
                            return (
                                <div key={item.id} className="relative group">
                                    <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all overflow-hidden">
                                        <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500 opacity-10" />
                                        <div className="flex items-center gap-5">
                                            <div className={`w-3 h-3 rounded-full ${status.pip} ${status.glow}`} />
                                            <div>
                                                <p className="text-white font-extrabold text-sm tracking-tight">{item.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">{item.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-black/40 p-1 rounded-2xl border border-white/10 flex items-center gap-1">
                                                <button onClick={() => handleUpdateStock(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white rounded-xl transition-all font-black">-</button>
                                                <span className="w-10 text-center text-sm font-black text-white">{item.stock}</span>
                                                <button onClick={() => handleUpdateStock(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-black">+</button>
                                            </div>
                                            <div className="w-24 text-right"><span className={`text-[10px] font-black uppercase tracking-[0.2em] ${status.color}`}>{status.label}</span></div>
                                        </div>
                                    </div>
                                    {ordering && item.stock < 20 && (
                                        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] rounded-3xl z-10 flex items-center justify-center border border-blue-500/30">
                                            <div className="flex items-center gap-3"><RefreshCw size={14} className="text-blue-400 animate-spin" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Syncing Supply...</span></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <button onClick={handleOrderMore} disabled={ordering} className={`w-full mt-6 py-5 rounded-[2rem] font-black text-[11px] transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3 relative overflow-hidden ${ordering ? 'bg-white/5 text-gray-600 border border-white/5' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                            {ordering ? <><div className="absolute inset-0 bg-blue-600/5" /><div className="relative z-10 flex items-center gap-3"><div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="h-full w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" /></div><span>PROCUREMENT ACTIVE</span></div></> : <><RefreshCw size={16} className="text-blue-500" /> Dispatch Restock Order</>}
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    const getHeaderDetails = () => {
        switch (type) {
            case 'reports': return { title: 'PRACTICE ANALYTICS', status: 'LIVE SYNC', icon: FileText, color: 'text-blue-400' };
            case 'broadcast': return { title: 'CLINIC BROADCAST', status: 'SECURE NODE', icon: Users, color: 'text-purple-400' };
            case 'inventory': return { title: 'STOCK CONTROL', status: f"{[i for i in inventoryItems if i['stock'] < 20].__len__()} ALERTS", icon: AlertCircle, color: 'text-amber-400' };
            default: return {};
        }
    };

    const header = getHeaderDetails();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-[#0b0f1a] border border-white/10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-10 max-h-[90vh]">
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 bg-white/5 rounded-2xl border border-white/10 ${header.color} shadow-inner`}><header.icon size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter">{header.title}</h3>
                            <div className="flex items-center gap-2"><span className={`flex h-1.5 w-1.5 rounded-full animate-pulse ${header.color.replace('text-', 'bg-')}`} /><span className={`text-[10px] font-black uppercase tracking-[0.2em] ${header.color}`}>{header.status}</span></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-500/10 rounded-full border border-white/10 hover:border-rose-500/30 transition-all group"><X size={20} className="text-gray-500 group-hover:text-rose-500 transition-colors" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">{renderContent()}</div>
                <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center bg-gradient-to-t from-white/5 to-transparent -mx-10 -mb-10 px-10 pb-10 shrink-0">
                    <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest opacity-50">Node: CEREBRO-UTILITY-01</div>
                    <button onClick={onClose} className="px-8 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em] shadow-lg">Close Module</button>
                </div>
            </motion.div>
        </div>
    );
};"""

# Adjusting python f-string escaping for curly braces in the component string
clean_component = clean_component.replace("{", "{{").replace("}", "}}")

# Now I'll use a safer way to insert the real component without double-braces issues if I were using f-strings, 
# but here I'll just use a simple string concatenation.

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line numbers are 1-indexed. 900 to 1466.
# indices are 899 to 1466 (inclusive of 1465 index, but range is end-exclusive)

start_idx = 899
end_idx = 1466 

# Re-escape back to normal for the final paste if I were using f-strings, 
# but I'll actually just use the literal component code.

final_component_code = r'''const UtilityDashboardOverlay = ({ 
    type, isOpen, onClose, 
    inventoryItems, setInventoryItems, 
    broadcastHistory, setBroadcastHistory, 
    analyticsRange, setAnalyticsRange 
}) => {
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [selectedNode, setSelectedNode] = useState('All Staff');
    const [ordering, setOrdering] = useState(false);

    if (!isOpen) return null;

    const handleUpdateStock = (id, delta) => {
        setInventoryItems(prev => prev.map(item => 
            item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item
        ));
    };

    const handleOrderMore = () => {
        setOrdering(true);
        setTimeout(() => {
            setInventoryItems(prev => prev.map(item => ({ ...item, stock: item.stock + 20 })));
            setOrdering(false);
        }, 3000);
    };

    const handleSendBroadcast = () => {
        if (!broadcastMsg.trim()) return;
        setIsSending(true);
        setTimeout(() => {
            const newBroadcast = {
                id: Date.now(),
                message: broadcastMsg,
                target: selectedNode,
                timestamp: new Date().toISOString()
            };
            setBroadcastHistory(prev => [newBroadcast, ...prev]);
            setIsSending(false);
            setSent(true);
            setBroadcastMsg('');
            setTimeout(() => setSent(false), 2000);
        }, 1500);
    };

    const getInventoryStatus = (stock) => {
        if (stock < 5) return { label: 'CRITICAL', color: 'text-rose-400', pip: 'bg-rose-500', glow: 'shadow-[0_0_15px_rgba(225,29,72,0.4)]' };
        if (stock < 20) return { label: 'LOW', color: 'text-amber-400', pip: 'bg-amber-500', glow: '' };
        return { label: 'STABLE', color: 'text-emerald-400', pip: 'bg-emerald-500', glow: '' };
    };

    const getAnalyticsData = () => {
        switch (analyticsRange) {
            case '24h': return {
                stats: [
                    { label: 'Patient Volume', value: '24', trend: '+4%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '8.5m', trend: '-2m', color: 'text-emerald-400' },
                    { label: 'Revenue Pulse', value: '$2.1k', trend: '+12%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '98%', trend: '+1%', color: 'text-amber-400' }
                ],
                points: [80, 60, 40, 55, 75, 50, 45]
            };
            case '30d': return {
                stats: [
                    { label: 'Patient Volume', value: '648', trend: '+18%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '18.4m', trend: '+2m', color: 'text-rose-400' },
                    { label: 'Revenue Pulse', value: '$54.2k', trend: '+5%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '91%', trend: '-2%', color: 'text-rose-400' }
                ],
                points: [20, 15, 30, 45, 10, 5, 25]
            };
            default: return { // 7d
                stats: [
                    { label: 'Patient Volume', value: '142', trend: '+12%', color: 'text-blue-400' },
                    { label: 'Avg. Wait Time', value: '14.2m', trend: '-4m', color: 'text-emerald-400' },
                    { label: 'Revenue Pulse', value: '$12.4k', trend: '+8%', color: 'text-purple-400' },
                    { label: 'Satisfaction', value: '94%', trend: '+2%', color: 'text-amber-400' }
                ],
                points: [60, 30, 55, 10, 35, 20, 50]
            };
        }
    };

    const renderPulseChart = (points) => {
        const width = 460;
        const height = 100;
        const spacing = width / (points.length - 1);
        
        let areaPath = "M 0," + height + " ";
        points.forEach((p, i) => {
            areaPath += "L " + (i * spacing) + "," + p + " ";
        });
        areaPath += "L " + width + "," + height + " Z";

        let linePath = "M 0," + points[0] + " ";
        points.forEach((p, i) => {
            if (i === 0) return;
            const prevX = (i - 1) * spacing;
            const prevY = points[i-1];
            const currX = i * spacing;
            const currY = p;
            const cp1x = prevX + spacing / 2;
            const cp2x = currX - spacing / 2;
            linePath += "C " + cp1x + "," + prevY + " " + cp2x + "," + currY + " " + currX + "," + currY + " ";
        });

        return (
            <div className="relative h-28 w-full mt-2 overflow-hidden bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <svg viewBox={"0 0 " + width + " " + height} className="w-full h-full preserve-3d">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={areaPath} fill="url(#chartGradient)" />
                    <motion.path 
                        initial={{ pathLength: 0, opacity: 0 }} 
                        animate={{ pathLength: 1, opacity: 1 }} 
                        transition={{ duration: 1.5, ease: "easeInOut" }} 
                        d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
                    />
                    {points.map((p, i) => (
                        <motion.circle key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} cx={i * spacing} cy={p} r="3" fill="#3b82f6" />
                    ))}
                </svg>
                <div className="absolute inset-x-0 bottom-2 px-4 flex justify-between text-[8px] font-black text-blue-500/40 uppercase tracking-[0.2em] pointer-events-none">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (type) {
            case 'reports':
                const data = getAnalyticsData();
                return (
                    <div className="space-y-6">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-2">
                            {['24h', '7d', '30d'].map((range) => (
                                <button key={range} onClick={() => setAnalyticsRange(range)} className={"flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all " + (analyticsRange === range ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg" : "text-gray-500 hover:text-white")}>{range}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {data.stats.map((stat, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group overflow-hidden relative">
                                    <div className={"absolute top-0 left-0 w-1 h-full " + (stat.trend.startsWith('+') ? stat.color.replace('text-', 'bg-') : 'bg-rose-500') + " opacity-20"} />
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-end justify-between">
                                        <h4 className="text-2xl font-black text-white group-hover:scale-105 transition-transform origin-left">{stat.value}</h4>
                                        <span className={"text-[10px] font-extrabold px-2 py-0.5 rounded-full " + (stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400') + " border border-current opacity-70"}>{stat.trend}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                            <h4 className="text-white font-black text-[10px] mb-4 uppercase tracking-[0.3em] opacity-40 flex items-center gap-2"><TrendingUp size={12} className="text-blue-500" /> Pulse Density Monitor</h4>
                            {renderPulseChart(data.points)}
                        </div>
                    </div>
                );
            case 'broadcast':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest pl-1">Target Personnel Node</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[{ id: 'All Staff', icon: Users, color: 'text-purple-400' }, { id: 'Nursing Node', icon: Activity, color: 'text-blue-400' }, { id: 'Diagnostic Lab', icon: Microscope, color: 'text-emerald-400' }].map(node => (
                                        <button key={node.id} onClick={() => setSelectedNode(node.id)} className={"p-3 border rounded-2xl text-[10px] font-black transition-all flex flex-col items-center gap-2 " + (selectedNode === node.id ? "bg-white/10 border-purple-500/50 " + node.color + " shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10")}><node.icon size={16} />{node.id}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest pl-1">Secure Terminal Header</label>
                                <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Enter encrypted clinic-wide broadcast..." className="w-full h-32 bg-black/40 border border-white/10 rounded-[2rem] p-5 text-sm font-medium text-blue-100 placeholder-blue-900/30 focus:outline-none focus:border-purple-500/50 transition-all resize-none custom-scrollbar shadow-inner" />
                                <div className="absolute bottom-4 right-4 text-[10px] font-black text-purple-500/30 uppercase tracking-widest">AES-256 Secured</div>
                            </div>
                        </div>
                        <button onClick={handleSendBroadcast} disabled={isSending || sent || !broadcastMsg.trim()} className={"w-full py-5 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 " + (sent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : isSending ? 'bg-white/5 text-gray-600 border border-white/10' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-95')}>
                            {sent ? <><CheckCircle2 size={20} /> DISPATCH SUCCESSFUL</> : isSending ? <>SYNCING WITH NODES...</> : <><Plus size={20} /> SEND BROADCAST</>}
                        </button>
                        {broadcastHistory.length > 0 && (
                            <div className="pt-6 border-t border-white/5 mt-4">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2 justify-center"><Clock size={12} /> SECURE BROADCAST LOG</h4>
                                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-3">
                                    <AnimatePresence>
                                        {broadcastHistory.map((log) => (
                                            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="group relative pl-4 border-l-2 border-purple-500/20 py-1">
                                                <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-purple-500 group-hover:animate-ping" />
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="flex items-center gap-2 px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-md text-[9px] font-black text-purple-400 uppercase tracking-widest shadow-sm">{log.target}</span>
                                                    <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-[13px] text-gray-300 leading-relaxed font-medium pl-1">{log.message}</p>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'inventory':
                return (
                    <div className="space-y-4 pt-2">
                        {inventoryItems.map((item) => {
                            const status = getInventoryStatus(item.stock);
                            return (
                                <div key={item.id} className="relative group">
                                    <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all overflow-hidden">
                                        <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500 opacity-10" />
                                        <div className="flex items-center gap-5">
                                            <div className={"w-3 h-3 rounded-full " + status.pip + " " + status.glow} />
                                            <div>
                                                <p className="text-white font-extrabold text-sm tracking-tight">{item.name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">{item.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-black/40 p-1 rounded-2xl border border-white/10 flex items-center gap-1">
                                                <button onClick={() => handleUpdateStock(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 text-white rounded-xl transition-all font-black">-</button>
                                                <span className="w-10 text-center text-sm font-black text-white">{item.stock}</span>
                                                <button onClick={() => handleUpdateStock(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-black">+</button>
                                            </div>
                                            <div className="w-24 text-right"><span className={"text-[10px] font-black uppercase tracking-[0.2em] " + status.color}>{status.label}</span></div>
                                        </div>
                                    </div>
                                    {ordering && item.stock < 20 && (
                                        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[2px] rounded-3xl z-10 flex items-center justify-center border border-blue-500/30">
                                            <div className="flex items-center gap-3"><RefreshCw size={14} className="text-blue-400 animate-spin" /><span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Syncing Supply...</span></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <button onClick={handleOrderMore} disabled={ordering} className={"w-full mt-6 py-5 rounded-[2rem] font-black text-[11px] transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3 relative overflow-hidden " + (ordering ? 'bg-white/5 text-gray-600 border border-white/5' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10')}>
                            {ordering ? <><div className="absolute inset-0 bg-blue-600/5" /><div className="relative z-10 flex items-center gap-3"><div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="h-full w-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" /></div><span>PROCUREMENT ACTIVE</span></div></> : <><RefreshCw size={16} className="text-blue-500" /> Dispatch Restock Order</>}
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    const getHeaderDetails = () => {
        switch (type) {
            case 'reports': return { title: 'PRACTICE ANALYTICS', status: 'LIVE SYNC', icon: FileText, color: 'text-blue-400' };
            case 'broadcast': return { title: 'CLINIC BROADCAST', status: 'SECURE NODE', icon: Users, color: 'text-purple-400' };
            case 'inventory': return { title: 'STOCK CONTROL', status: (inventoryItems.filter(i => i.stock < 20).length) + ' ALERTS', icon: AlertCircle, color: 'text-amber-400' };
            default: return {};
        }
    };

    const header = getHeaderDetails();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-xl bg-[#0b0f1a] border border-white/10 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-10 max-h-[90vh]">
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className={"p-4 bg-white/5 rounded-2xl border border-white/10 " + header.color + " shadow-inner"}><header.icon size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter">{header.title}</h3>
                            <div className="flex items-center gap-2"><span className={"flex h-1.5 w-1.5 rounded-full animate-pulse " + header.color.replace('text-', 'bg-')} /><span className={"text-[10px] font-black uppercase tracking-[0.2em] " + header.color}>{header.status}</span></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-500/10 rounded-full border border-white/10 hover:border-rose-500/30 transition-all group"><X size={20} className="text-gray-500 group-hover:text-rose-500 transition-colors" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">{renderContent()}</div>
                <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center bg-gradient-to-t from-white/5 to-transparent -mx-10 -mb-10 px-10 pb-10 shrink-0">
                    <div className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest opacity-50">Node: CEREBRO-UTILITY-01</div>
                    <button onClick={onClose} className="px-8 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em] shadow-lg">Close Module</button>
                </div>
            </motion.div>
        </div>
    );
};
'''

new_lines = lines[:start_idx] + [final_component_code + '\n'] + lines[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Surgery completed successfully.")
