import { useEffect, useState } from 'react'
import { LogOut, Bell, Lock } from 'lucide-react'
import TelegramWebApp from '@/lib/telegram'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'

interface Settings {
  notifications: boolean
  notifications_transactions: boolean
  notifications_security: boolean
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    notifications_transactions: true,
    notifications_security: true,
  })
  const [loading, setLoading] = useState(false)
  const user = TelegramWebApp.user

  const handleToggle = (key: keyof Settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleLogout = () => {
    TelegramWebApp.showConfirm('Are you sure you want to logout?', (confirmed) => {
      if (confirmed) {
        // Logout logic
        TelegramWebApp.close()
      }
    })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 mt-4">Settings</h1>

      {/* Profile Info */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Profile</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-400">Name</p>
            <p className="font-medium">{user?.first_name} {user?.last_name || ''}</p>
          </div>
          {user?.username && (
            <div>
              <p className="text-sm text-slate-400">Username</p>
              <p className="font-medium">@{user.username}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-slate-400">Telegram ID</p>
            <p className="font-medium font-mono">{user?.id}</p>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell size={20} />
          Notifications
        </h3>
        <div className="space-y-4">
          <SettingToggle
            label="Enable Notifications"
            value={settings.notifications}
            onChange={() => handleToggle('notifications')}
          />
          {settings.notifications && (
            <>
              <SettingToggle
                label="Transaction Updates"
                value={settings.notifications_transactions}
                onChange={() => handleToggle('notifications_transactions')}
              />
              <SettingToggle
                label="Security Alerts"
                value={settings.notifications_security}
                onChange={() => handleToggle('notifications_security')}
              />
            </>
          )}
        </div>
      </Card>

      {/* Security */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock size={20} />
          Security
        </h3>
        <Button size="md" variant="outline" className="w-full">
          Change Password
        </Button>
      </Card>

      {/* Logout */}
      <Button
        size="lg"
        variant="outline"
        className="w-full text-red-400 border-red-600/50 hover:bg-red-600/10"
        onClick={handleLogout}
        icon={<LogOut size={20} />}
      >
        Logout
      </Button>
    </div>
  )
}

interface SettingToggleProps {
  label: string
  value: boolean
  onChange: () => void
}

function SettingToggle({ label, value, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-slate-300">{label}</label>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-primary-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
