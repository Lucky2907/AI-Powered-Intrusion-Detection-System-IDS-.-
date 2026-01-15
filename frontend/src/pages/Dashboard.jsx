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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    
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
    })
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
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
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 border-b border-slate-700/50 pb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">Dashboard</h1>
        <p className="text-slate-400 text-lg">Real-time network security monitoring and threat detection</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/50 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-600/10 to-transparent' :
              stat.color === 'red' ? 'from-red-600/10 to-transparent' :
              stat.color === 'yellow' ? 'from-yellow-600/10 to-transparent' :
              'from-green-600/10 to-transparent'
            } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                stat.color === 'blue' ? 'from-blue-600/20 to-blue-600/5' :
                stat.color === 'red' ? 'from-red-600/20 to-red-600/5' :
                stat.color === 'yellow' ? 'from-yellow-600/20 to-yellow-600/5' :
                'from-green-600/20 to-green-600/5'
              } backdrop-blur-sm`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'red' ? 'text-red-400' :
                  stat.color === 'yellow' ? 'text-yellow-400' :
                  'text-green-400'
                }`} />
              </div>
              <span className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
              }`}>
                {stat.change.startsWith('+') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stat.change}
              </span>
            </div>
            <h3 className="text-4xl font-bold text-white mb-2 drop-shadow-lg tracking-tight">{stat.value.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)' }}
                labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                itemStyle={{ color: '#cbd5e1' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Area type="monotone" dataKey="normal" stroke="#3b82f6" strokeWidth={2} fill="url(#colorNormal)" name="Normal Traffic" />
              <Area type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={2} fill="url(#colorAttacks)" name="Attacks" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attack Types Distribution */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 hover:shadow-lg transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
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

      {/* Recent Alerts */}
      <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Critical Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-900/30 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-white font-medium">DDoS Attack Detected</p>
                <p className="text-sm text-slate-400">Source: 192.168.1.50 • 2 minutes ago</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-full">CRITICAL</span>
          </div>
        </div>
      </div>
    </div>
  )
}
