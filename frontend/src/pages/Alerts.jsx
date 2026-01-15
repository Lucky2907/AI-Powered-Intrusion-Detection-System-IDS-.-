import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { io } from 'socket.io-client'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
    
    // WebSocket for real-time updates
    const socket = io('http://localhost:3000')
    socket.on('new_alert', (alert) => {
      toast.success(`New ${alert.alertType} alert!`)
      fetchAlerts()
    })
    
    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      fetchAlerts()
    }, 3000)
    
    return () => {
      socket.disconnect()
      clearInterval(interval)
    }
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/alerts')
      setAlerts(response.data.data)
    } catch (error) {
      toast.error('Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      5: 'red',
      4: 'orange',
      3: 'yellow',
      2: 'blue',
      1: 'green'
    }
    return colors[severity] || 'gray'
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 border-b border-slate-700/50 pb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-300 to-orange-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">Security Alerts</h1>
        <p className="text-slate-400 text-lg">Detected threats and security incidents requiring attention</p>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/50 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br from-${getSeverityColor(alert.severity)}-600/30 to-${getSeverityColor(alert.severity)}-600/10 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-${getSeverityColor(alert.severity)}-600/30`}>
                  <AlertTriangle className={`w-7 h-7 text-${getSeverityColor(alert.severity)}-400 animate-pulse-slow`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{alert.title}</h3>
                  <p className="text-sm text-slate-300 mb-4 leading-relaxed">{alert.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className={`px-3 py-1.5 rounded-full bg-${getSeverityColor(alert.severity)}-900/30 text-${getSeverityColor(alert.severity)}-400 border border-${getSeverityColor(alert.severity)}-700/50 font-medium`}>
                      Severity: {alert.severity}/5
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-700/50 font-medium">
                      {alert.attackCategory || alert.attack_category || 'Unknown'}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {new Date(alert.createdAt || alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`px-4 py-2 text-xs font-bold rounded-full border-2 ${
                alert.status === 'open' ? 'bg-red-900/40 text-red-300 border-red-600/50 shadow-lg shadow-red-900/30' :
                alert.status === 'investigating' ? 'bg-yellow-900/40 text-yellow-300 border-yellow-600/50 shadow-lg shadow-yellow-900/30' :
                'bg-green-900/40 text-green-300 border-green-600/50 shadow-lg shadow-green-900/30'
              }`}>
                {alert.status?.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
