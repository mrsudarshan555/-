import React from 'react';
import { IntegrationItem } from '../../types';
import { 
  Boxes, MapPin, Building, Calendar, 
  Radio, Webhook, CheckCircle2, AlertCircle, Clock, Link2, ExternalLink, ArrowLeft
} from 'lucide-react';

interface OptionalIntegrationsViewProps {
  integrations: IntegrationItem[];
  onBack: () => void;
}

export const OptionalIntegrationsView: React.FC<OptionalIntegrationsViewProps> = ({
  integrations,
  onBack
}) => {
  const getIntegrationIcon = (icon: string) => {
    switch (icon) {
      case 'MapPin': return <MapPin className="w-4 h-4 text-blue-400" />;
      case 'Building': return <Building className="w-4 h-4 text-cyan-400" />;
      case 'Calendar': return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'Radio': return <Radio className="w-4 h-4 text-purple-400" />;
      case 'Webhook': return <Webhook className="w-4 h-4 text-amber-400" />;
      default: return <Boxes className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: IntegrationItem['status']) => {
    switch (status) {
      case 'enabled':
        return { label: 'ENABLED', style: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' };
      case 'configured':
        return { label: 'CONFIGURED', style: 'bg-blue-950/60 border-blue-500/40 text-blue-400' };
      case 'not_configured':
        return { label: 'NOT CONFIGURED', style: 'bg-amber-950/60 border-amber-500/40 text-amber-400' };
      case 'unavailable':
      default:
        return { label: 'UNAVAILABLE', style: 'bg-slate-900 border-white/10 text-slate-500' };
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#070913] text-slate-200">
      
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#070913]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Optional Integrations</h2>
              <p className="text-[10px] text-slate-400 font-sans">External Services & Third-Party Bridges</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs font-sans pb-8">
        
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Optional services allow MAYRA to access navigation maps, smart home hardware, and calendars when configured.
        </p>

        <div className="space-y-3">
          {integrations.map((integ) => {
            const badge = getStatusBadge(integ.status);
            return (
              <div
                key={integ.id}
                className="p-3.5 bg-[#0C1021] border border-white/10 rounded-2xl space-y-2.5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#070913] rounded-xl border border-white/10">
                      {getIntegrationIcon(integ.icon)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-xs">{integ.name}</div>
                      <div className="text-[9px] font-mono text-slate-400">{integ.category}</div>
                    </div>
                  </div>

                  <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.style}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {integ.description}
                </p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-slate-500">
                    {integ.status === 'configured' ? 'Pipeline Linked' : 'Requires API Credentials / Bridge'}
                  </span>
                  <button
                    disabled={integ.status === 'unavailable'}
                    className="text-[10px] font-mono text-blue-400 hover:text-blue-300 disabled:opacity-30 flex items-center gap-1 transition-colors"
                  >
                    Configure <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
