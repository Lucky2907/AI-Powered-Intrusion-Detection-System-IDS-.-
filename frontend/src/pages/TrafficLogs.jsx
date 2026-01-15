import { useState, useEffect } from 'react'
import { Activity, Filter, Search } from 'lucide-react'
import { io } from 'socket.io-client'
import api from '../services/api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function TrafficLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchLogs()
    
    // WebSocket for real-time updates
    const socket = io('http://localhost:3000')
    socket.on('new_traffic', () => {
      fetchLogs()
    })
    
    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      fetchLogs()
    }, 3000)
    
    return () => {
      socket.disconnect()
      clearInterval(interval)
    }
  }, [filter])

  const fetchLogs = async () => {
    try {
      const params = filter !== 'all' ? { isAttack: filter === 'attacks' } : {}
      const response = await api.get('/traffic', { params })
      setLogs(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch traffic logs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between border-b border-slate-700/50 pb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">Traffic Logs</h1>
          <p className="text-slate-400 text-lg">Real-time monitoring of all network traffic and connections</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-5 py-2.5 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-600 transition-all cursor-pointer"
          >
            <option value="all">All Traffic</option>
            <option value="attacks">Attacks Only</option>
            <option value="normal">Normal Only</option>
          </select>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-slate-800 border-b border-slate-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Source IP</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Dest IP</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Protocol</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {logs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm text-slate-200 font-medium">
                    {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-400 font-semibold">{log.srcIp || log.src_ip}</td>
                  <td className="px-6 py-4 text-sm font-mono text-cyan-400 font-semibold">{log.dstIp || log.dst_ip}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-700/70 text-slate-200 border border-slate-600">
                      {log.protocol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 ${
                      log.isAttack || log.is_attack
                        ? 'bg-red-900/40 text-red-300 border-red-600/50 shadow-lg shadow-red-900/30'
                        : 'bg-green-900/40 text-green-300 border-green-600/50 shadow-lg shadow-green-900/30'
                    }`}>
                      {log.isAttack || log.is_attack ? '⚠️ Attack' : '✓ Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(log.attackType || log.attack_type) ? (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-700/50">
                        {log.attackType || log.attack_type}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
