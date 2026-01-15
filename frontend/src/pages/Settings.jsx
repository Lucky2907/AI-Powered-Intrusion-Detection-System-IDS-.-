import { Settings as SettingsIcon, Shield, Bell, Database } from 'lucide-react'

export default function Settings() {
  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8 border-b border-slate-700/50 pb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">Settings</h1>
        <p className="text-slate-400 text-lg">Configure system preferences and detection parameters</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/30 to-blue-600/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Detection Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Alert Threshold (Confidence Score)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                defaultValue="0.85"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0.0</span>
                <span>0.85</span>
                <span>1.0</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Auto-block suspicious IPs</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6 hover:border-slate-600 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-600/30 to-yellow-600/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Bell className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Notification Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
              <span className="text-sm font-medium text-slate-200">Email notifications</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
              <span className="text-sm font-medium text-slate-200">SMS alerts for critical threats</span>
              <input type="checkbox" className="w-5 h-5 rounded cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
