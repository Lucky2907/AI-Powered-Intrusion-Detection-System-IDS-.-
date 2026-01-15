import { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Shield, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { io } from 'socket.io-client'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchRecentAlerts()
    
    // Connect to WebSocket
    const socket = io('http://localhost:3000')
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket')
    })
    
    // Listen for new traffic
    socket.on('new_traffic', () => {
      fetchDashboardData()
    })
    
    // Listen for new alerts
    socket.on('new_alert', () => {
      fetchDashboardData()
      fetchRecentAlerts()
    })
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchRecentAlerts()
    }, 5000)
    
    return () => {
      socket.disconnect()
      clearInterval(interval)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/overview')
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentAlerts = async () => {
    try {
      const response = await api.get('/alerts?limit=5&sortBy=createdAt&sortOrder=DESC')
      setRecentAlerts(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch recent alerts')
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Traffic',
      value: stats?.traffic?.total || 0,
      change: '+12.5%',
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'Attacks Detected',
      value: stats?.traffic?.attacks || 0,
      change: '-8.2%',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: 'Open Alerts',
      value: stats?.alerts?.open || 0,
      change: '+3.1%',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      title: 'Blocked IPs',
      value: stats?.blocked || 0,
      change: '+15.3%',
      icon: Shield,
      color: 'green'
    }
  ]

  return (
    <div className="p-8 animate-fade-in bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8 pb-6 border-b-2 border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
              Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Real-time network security monitoring and threat detection
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="relative bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-600/5 to-transparent dark:from-blue-600/10' :
              stat.color === 'red' ? 'from-red-600/5 to-transparent dark:from-red-600/10' :
              stat.color === 'yellow' ? 'from-yellow-600/5 to-transparent dark:from-yellow-600/10' :
              'from-green-600/5 to-transparent dark:from-green-600/10'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                stat.color === 'blue' ? 'from-blue-100 to-blue-50 dark:from-blue-600/20 dark:to-blue-600/5' :
                stat.color === 'red' ? 'from-red-100 to-red-50 dark:from-red-600/20 dark:to-red-600/5' :
                stat.color === 'yellow' ? 'from-yellow-100 to-yellow-50 dark:from-yellow-600/20 dark:to-yellow-600/5' :
                'from-green-100 to-green-50 dark:from-green-600/20 dark:to-green-600/5'
              } backdrop-blur-sm`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  stat.color === 'red' ? 'text-red-600 dark:text-red-400' :
                  stat.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <span className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
                stat.change.startsWith('+') 
                  ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20' 
                  : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
              }`}>
                {stat.change.startsWith('+') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </span>
            </div>
            <h3 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{stat.value.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Traffic Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={(stats?.trafficTimeline && stats.trafficTimeline.length > 0) ? stats.trafficTimeline : [
              { time: '07:00', normal: 0, attacks: 0 },
              { time: '08:00', normal: 0, attacks: 0 },
              { time: '09:00', normal: 0, attacks: 0 },
              { time: '10:00', normal: 0, attacks: 0 },
              { time: '11:00', normal: 0, attacks: 0 },
              { time: '12:00', normal: 0, attacks: 0 }
            ]}>
              <defs>
                <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" opacity={0.5} />
              <XAxis dataKey="time" stroke="#64748b" className="dark:stroke-slate-400" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" className="dark:stroke-slate-400" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' 
                }}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                itemStyle={{ color: '#475569' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="normal" stroke="#3b82f6" strokeWidth={2} fill="url(#colorNormal)" name="Normal Traffic" />
              <Area type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={2} fill="url(#colorAttacks)" name="Attacks" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attack Types Distribution */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Attack Types Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={(stats?.attackDistribution && stats.attackDistribution.length > 0) ? stats.attackDistribution : [
                  { name: 'No Data', value: 1 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name === 'No Data' ? 'No attacks yet' : `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {((stats?.attackDistribution && stats.attackDistribution.length > 0) ? stats.attackDistribution : [{ name: 'No Data', value: 1 }]).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'No Data' ? '#475569' : ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'][index % 5]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Critical Alerts */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          Recent Critical Alerts
        </h3>
        <div className="space-y-3">
          {recentAlerts.length > 0 ? (
            recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg hover:border-red-300 dark:hover:border-red-800 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
                  <div>
                    <p className="text-slate-900 dark:text-white font-medium">{alert.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {alert.attackCategory} • {getTimeAgo(alert.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  alert.severity >= 5 ? 'bg-red-600 text-white' :
                  alert.severity >= 4 ? 'bg-orange-600 text-white' :
                  'bg-yellow-600 text-white'
                }`}>
                  {alert.alertType}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>No recent alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
