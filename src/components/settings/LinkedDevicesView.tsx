import React, { useState } from 'react';
import { 
  Smartphone, Tablet, Watch, Laptop, Wifi, Bluetooth, 
  Battery, RefreshCw, Plus, Trash2, CheckCircle2, ShieldCheck,
  Radio, Bell, Copy, ArrowLeft
} from 'lucide-react';
import { LinkedDeviceItem } from '../../types';

interface LinkedDevicesViewProps {
  onBack: () => void;
}

const INITIAL_DEVICES: LinkedDeviceItem[] = [
  {
    id: 'dev-1',
    name: 'Zafer’s Pixel 9 Pro',
    model: 'Google Pixel 9 Pro XL',
    type: 'smartphone',
    status: 'online',
    batteryLevel: 88,
    lastSync: 'Just now (Host Device)',
    location: 'Current Device',
    isPrimary: true
  },
  {
    id: 'dev-2',
    name: 'Zafer’s Galaxy Tab S9',
    model: 'Samsung Galaxy Tab S9 Ultra',
    type: 'tablet',
    status: 'online',
    batteryLevel: 74,
    lastSync: '1 min ago (WiFi Sync)',
    location: 'Home Studio'
  },
  {
    id: 'dev-3',
    name: 'MAYRA Neural Watch',
    model: 'Google Pixel Watch 3 (LTE)',
    type: 'smartwatch',
    status: 'nearby_ble',
    batteryLevel: 92,
    lastSync: 'Connected via BLE Mesh',
    location: 'On Wrist'
  },
  {
    id: 'dev-4',
    name: 'Zafer’s MacBook Workstation',
    model: 'Apple MacBook Pro M3 Max',
    type: 'laptop',
    status: 'online',
    batteryLevel: 100,
    lastSync: 'Active (Desktop Relay)',
    location: 'Office Desk'
  }
];

export const LinkedDevicesView: React.FC<LinkedDevicesViewProps> = ({ onBack }) => {
  const [devices, setDevices] = useState<LinkedDeviceItem[]>(INITIAL_DEVICES);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [clipboardSyncEnabled, setClipboardSyncEnabled] = useState<boolean>(true);
  const [notificationMirrorEnabled, setNotificationMirrorEnabled] = useState<boolean>(true);
  const [voiceRelayEnabled, setVoiceRelayEnabled] = useState<boolean>(true);
  const [pingStatus, setPingStatus] = useState<{ [id: string]: string }>({});

  const handleSyncAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          lastSync: 'Just now (Synced)'
        }))
      );
    }, 1200);
  };

  const handlePingDevice = (device: LinkedDeviceItem) => {
    setPingStatus((prev) => ({ ...prev, [device.id]: 'Pinging...' }));
    setTimeout(() => {
      setPingStatus((prev) => ({ ...prev, [device.id]: 'Chime Sent!' }));
      setTimeout(() => {
        setPingStatus((prev) => {
          const copy = { ...prev };
          delete copy[device.id];
          return copy;
        });
      }, 2500);
    }, 1000);
  };

  const getDeviceIcon = (type: LinkedDeviceItem['type']) => {
    switch (type) {
      case 'smartphone':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-purple-400" />;
      case 'smartwatch':
        return <Watch className="w-5 h-5 text-emerald-400" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070914] text-white select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0C1024]/90 border-b border-cyan-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              LINKED DEVICES & MULTI-DEVICE SYNC
            </h1>
            <p className="text-[10px] text-slate-400">Zero-latency cross-device relay & state</p>
          </div>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-lg text-[10px] font-mono text-cyan-300 font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Global Sync Controls */}
        <div className="p-3 bg-[#0A0E24] border border-cyan-500/20 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
            <span className="font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" /> MAYRA Neural Mesh Relay
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> End-to-End Encrypted
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setClipboardSyncEnabled(!clipboardSyncEnabled)}
              className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                clipboardSyncEnabled
                  ? 'bg-cyan-950/40 border-cyan-400/40 text-cyan-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[9px] font-mono">{clipboardSyncEnabled ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[10px] font-semibold">Live Clipboard</span>
            </button>

            <button
              onClick={() => setNotificationMirrorEnabled(!notificationMirrorEnabled)}
              className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                notificationMirrorEnabled
                  ? 'bg-purple-950/40 border-purple-400/40 text-purple-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Bell className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[9px] font-mono">{notificationMirrorEnabled ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[10px] font-semibold">Mirror Alerts</span>
            </button>

            <button
              onClick={() => setVoiceRelayEnabled(!voiceRelayEnabled)}
              className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                voiceRelayEnabled
                  ? 'bg-emerald-950/40 border-emerald-400/40 text-emerald-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] font-mono">{voiceRelayEnabled ? 'ON' : 'OFF'}</span>
              </div>
              <span className="text-[10px] font-semibold">Voice Hand-off</span>
            </button>
          </div>
        </div>

        {/* Device List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Connected Devices ({devices.length})
            </h2>
            <button
              onClick={() => setShowPairModal(true)}
              className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300"
            >
              <Plus className="w-3 h-3" /> Pair Device
            </button>
          </div>

          {devices.map((dev) => (
            <div
              key={dev.id}
              className={`p-3 rounded-xl border transition-all ${
                dev.isPrimary
                  ? 'bg-gradient-to-r from-[#0C1230] to-[#0A0D22] border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-[#080B1E] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 shrink-0">
                    {getDeviceIcon(dev.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{dev.name}</span>
                      {dev.isPrimary && (
                        <span className="px-1.5 py-0.2 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 font-bold">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{dev.model} • {dev.location}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Battery className="w-3 h-3" /> {dev.batteryLevel}%
                      </span>
                      <span className="flex items-center gap-1">
                        {dev.status === 'online' ? (
                          <Wifi className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Bluetooth className="w-3 h-3 text-purple-400" />
                        )}
                        {dev.lastSync}
                      </span>
                    </div>
                  </div>
                </div>

                {!dev.isPrimary && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePingDevice(dev)}
                      className="px-2 py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/10 rounded-lg text-[9px] font-mono text-slate-300 hover:text-cyan-300"
                    >
                      {pingStatus[dev.id] || 'Ping'}
                    </button>
                    <button
                      onClick={() => setDevices((prev) => prev.filter((d) => d.id !== dev.id))}
                      className="p-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400"
                      title="Unpair Device"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pair Device Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xs p-4 bg-[#0A0E24] border border-cyan-500/40 rounded-2xl space-y-3 text-center">
            <h3 className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
              PAIR SECOND DEVICE
            </h3>
            <p className="text-[11px] text-slate-300">
              Open MAYRA on your secondary phone, tablet, or laptop and scan this neural sync code:
            </p>
            <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
              {/* QR Code Graphic simulation */}
              <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full bg-slate-900 p-1.5 rounded">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xs ${
                      (i % 2 === 0 || i % 7 === 0) ? 'bg-cyan-400' : 'bg-slate-950'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[10px] font-mono text-cyan-400">PIN: MAYRA-8891-SYNC</p>
            <button
              onClick={() => setShowPairModal(false)}
              className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-xl text-xs font-mono text-cyan-300 font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
