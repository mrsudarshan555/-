import React from 'react';
import { SettingsSubScreen } from '../../types';
import { 
  User, Globe, Sparkles, Wrench, 
  Bot, ShieldCheck, Database, Cpu, 
  Boxes, Lock, Info, ExternalLink, CheckCircle2, ArrowRight, Shield
} from 'lucide-react';

interface SettingsArchitectureViewerProps {
  onNavigateToSetting: (subScreen: SettingsSubScreen) => void;
}

export const SettingsArchitectureViewer: React.FC<SettingsArchitectureViewerProps> = ({
  onNavigateToSetting
}) => {
  const sections = [
    {
      group: '1. PERMISSIONS & SYSTEM ACCESS',
      description: 'Comprehensive 14 Android system permissions with live grant toggles, floating overlay window settings, and screen projection consent prompts.',
      items: [
        {
          id: 'permissions' as SettingsSubScreen,
          name: 'Permissions Center (14 Controls)',
          icon: <Shield className="w-4 h-4 text-emerald-400" />,
          details: 'Default Assistant, Mic, Camera, Phone Calls, Location, Contacts, SMS, Gallery/Files, Manage Calls, Notification Access, Accessibility, Battery, Display Over Other Apps, Screen Capture',
          status: 'Complete'
        }
      ]
    },
    {
      group: '2. ACCOUNT ARCHITECTURE',
      description: 'User identity, greeting style preferences, encrypted API key slot, and searchable country dialing codes.',
      items: [
        {
          id: 'personal' as SettingsSubScreen,
          name: 'Personal Settings',
          icon: <User className="w-4 h-4 text-blue-400" />,
          details: 'Full Name, Nickname, Greeting style, Gemini API key slot (masked), Model picker & Temperature',
          status: 'Complete'
        },
        {
          id: 'country_code' as SettingsSubScreen,
          name: 'Country Code Picker',
          icon: <Globe className="w-4 h-4 text-cyan-400" />,
          details: 'Searchable Country dialing codes list with India (+91) as default selection',
          status: 'Complete'
        }
      ]
    },
    {
      group: '3. ASSISTANT & AGENT ENGINE',
      description: 'Persona styles, neural voice profiles, TTS speech rates, modular capabilities, and multi-agent topology.',
      items: [
        {
          id: 'assistant' as SettingsSubScreen,
          name: 'MAYRA Persona & Voice',
          icon: <Sparkles className="w-4 h-4 text-purple-400" />,
          details: 'Executive / Technical tone, Voice profiles, Language, Speed & Pitch sliders, Haptics, Audio chimes',
          status: 'Complete'
        },
        {
          id: 'skills' as SettingsSubScreen,
          name: 'Skills & Tools',
          icon: <Wrench className="w-4 h-4 text-emerald-400" />,
          details: 'Installed tools list, toggle switches, category filters, permissions requirement chips, Skill Store',
          status: 'Complete'
        },
        {
          id: 'sub_agents' as SettingsSubScreen,
          name: 'Sub-Agents Orchestration',
          icon: <Bot className="w-4 h-4 text-indigo-400" />,
          details: 'Coding, Deep Research, Background Sentinel & Vision Analysts with sandboxed priority queues',
          status: 'Complete'
        }
      ]
    },
    {
      group: '4. VOICE GUARDIAN & SECURITY',
      description: 'Biometric acoustic authentication, away guard mode, listen authorization policies, and sample calibration.',
      items: [
        {
          id: 'voice_guardian' as SettingsSubScreen,
          name: 'Voice Guardian',
          icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
          details: 'Master shield toggle, Away mode, Listen mode (Owner only/Family), 60-95% strictness, 5-sample acoustic calibration',
          status: 'Complete'
        }
      ]
    },
    {
      group: '5. DATA SOVEREIGNTY & STORAGE',
      description: 'Local on-device SQLite / Room persistence, JSON backup export/restore, and right to erasure.',
      items: [
        {
          id: 'backup' as SettingsSubScreen,
          name: 'Backup & Storage',
          icon: <Database className="w-4 h-4 text-blue-400" />,
          details: 'Context memory metrics, Export memories/chats (.json), File restore, Permanent reset safety dialog',
          status: 'Complete'
        }
      ]
    },
    {
      group: '6. SYSTEM GOVERNANCE & CHARTER',
      description: 'Android runtime permissions manager, background optimization, third-party bridges, privacy charter, and manifest.',
      items: [
        {
          id: 'advanced' as SettingsSubScreen,
          name: 'Advanced System & Diagnostics',
          icon: <Cpu className="w-4 h-4 text-amber-400" />,
          details: 'Content safety filters, Android Mic/Camera/Overlay/Accessibility permissions, Battery optimization exempt, Dev logs',
          status: 'Complete'
        },
        {
          id: 'optional_integrations' as SettingsSubScreen,
          name: 'Optional Integrations',
          icon: <Boxes className="w-4 h-4 text-blue-400" />,
          details: 'Maps, Places, Calendar, IoT ESP32 & Webhook status badges (UNAVAILABLE, NOT CONFIGURED, CONFIGURED)',
          status: 'Complete'
        },
        {
          id: 'privacy' as SettingsSubScreen,
          name: 'Privacy Policy Charter',
          icon: <Lock className="w-4 h-4 text-emerald-400" />,
          details: 'On-device data promise, AI provider transmission details, zero-ads guarantee, complete data rights',
          status: 'Complete'
        },
        {
          id: 'about' as SettingsSubScreen,
          name: 'About MAYRA Manifest',
          icon: <Info className="w-4 h-4 text-slate-400" />,
          details: 'v2.4.0 specifications, Target SDK 36 (Android 16), Jetpack Compose BOM architecture',
          status: 'Complete'
        }
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0C1021] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#070913] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Settings & System Architecture Explorer
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">12 Modular Settings Subsystems</p>
          </div>
        </div>

        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          ALL MODULES IMPLEMENTED
        </span>
      </div>

      {/* Grid of Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {sections.map((section) => (
          <div key={section.group} className="space-y-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-blue-400 tracking-wider uppercase">
                {section.group}
              </span>
              <span className="text-[10px] text-slate-400 font-sans">
                {section.description}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigateToSetting(item.id)}
                  className="p-3.5 bg-[#070913] hover:bg-[#0A0D1F] border border-white/5 hover:border-blue-500/30 rounded-2xl cursor-pointer transition-all flex flex-col justify-between space-y-2 group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors font-sans">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{item.status}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    {item.details}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[9px] font-mono text-slate-500 group-hover:text-blue-400 transition-colors">
                    <span>Inspect Subsystem</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
