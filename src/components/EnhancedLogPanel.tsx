import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Download, Trash2, Search, Filter, Maximize2, Minimize2, Copy } from 'lucide-react';
import { logger, type EnhancedLog, type LogType } from '../services/logger';

export const EnhancedLogPanel: React.FC = () => {
    const [logs, setLogs] = useState<EnhancedLog[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [filter, setFilter] = useState<LogType | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = logger.subscribe(setLogs);
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === 'all' || log.type === filter;
        const matchesSearch = searchTerm === '' ||
            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getTypeIcon = (type: LogType) => {
        const icons = {
            api: '🌐',
            pipeline: '⚙️',
            generation: '🎨',
            validation: '✓',
            error: '❌',
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
        };
        return icons[type] || '•';
    };

    const copyLog = (log: EnhancedLog) => {
        const text = `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}\n${JSON.stringify(log.details, null, 2)}`;
        navigator.clipboard.writeText(text);
    };

    const exportLogs = () => {
        const blob = new Blob([logger.export()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${Date.now()}.json`;
        a.click();
    };

    if (!isExpanded) {
        // Minimized view
        return (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="glass-panel px-6 py-3 flex items-center gap-3 hover:bg-white/10 transition-all group"
                >
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium">System Logs</span>
                    <span className="text-xs text-gray-400">
                        {logs.length} {logs.filter(l => l.severity === 'critical' || l.type === 'error').length > 0 && (
                            <span className="text-red-400 font-bold">({logs.filter(l => l.severity === 'critical' || l.type === 'error').length} errors)</span>
                        )}
                    </span>
                    <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        );
    }

    // Expanded view
    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90vw] max-w-6xl">
            <div className="glass-panel flex flex-col h-[60vh] max-h-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold">System Logs</span>
                        <span className="text-xs text-gray-500">({filteredLogs.length}/{logs.length})</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search logs..."
                                className="pl-7 pr-3 py-1 text-xs bg-black/40 border border-white/10 rounded text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 w-40"
                            />
                        </div>

                        {/* Filter */}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-2 py-1 text-xs bg-black/40 border border-white/10 rounded text-white focus:outline-none focus:border-cyan-400"
                        >
                            <option value="all">All</option>
                            <option value="api">API</option>
                            <option value="pipeline">Pipeline</option>
                            <option value="generation">Generation</option>
                            <option value="validation">Validation</option>
                            <option value="error">Errors</option>
                        </select>

                        {/* Auto-scroll toggle */}
                        <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`px-2 py-1 text-xs rounded border ${autoScroll ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                        >
                            Auto-scroll
                        </button>

                        {/* Export */}
                        <button
                            onClick={exportLogs}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                            title="Export logs"
                        >
                            <Download className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        {/* Clear */}
                        <button
                            onClick={() => logger.clear()}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                            title="Clear logs"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>

                        {/* Minimize */}
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        >
                            <Minimize2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Log content */}
                <div
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs custom-scrollbar"
                >
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-600">
                            {searchTerm || filter !== 'all' ? 'No logs match filter' : 'No logs yet'}
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className={`flex items-start gap-2 p-2 rounded border ${getSeverityColor(log.severity)} hover:bg-white/5 group`}
                            >
                                <span className="text-xs opacity-60 flex-shrink-0 w-20">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="flex-shrink-0 w-5 text-center">{getTypeIcon(log.type)}</span>
                                <span className="flex-1 break-words">{log.message}</span>
                                {log.details && (
                                    <details className="flex-shrink-0">
                                        <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300 text-xs">
                                            details
                                        </summary>
                                        <pre className="mt-1 p-2 bg-black/40 rounded text-[10px] overflow-x-auto">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </details>
                                )}
                                <button
                                    onClick={() => copyLog(log)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                                    title="Copy log"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
