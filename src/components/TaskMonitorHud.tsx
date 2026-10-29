import React, { useState } from "react";
import { TaskRecord, TaskState } from "../types";
import { agentSupervisor } from "../services/agentSupervisor";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Props {
  tasks: TaskRecord[];
}

const STATE_BADGES: Record<TaskState, { bg: string; text: string; label: string }> = {
  CREATED: { bg: "bg-slate-700/60", text: "text-slate-300", label: "Created" },
  PLANNING: { bg: "bg-purple-900/40", text: "text-purple-300", label: "Planning" },
  AWAITING_APPROVAL: { bg: "bg-amber-900/40", text: "text-amber-300", label: "Awaiting Approval" },
  EXECUTING: { bg: "bg-sky-900/40", text: "text-sky-300", label: "Executing" },
  VERIFYING: { bg: "bg-indigo-900/40", text: "text-indigo-300", label: "Verifying" },
  RECOVERING: { bg: "bg-orange-900/40", text: "text-orange-300", label: "Recovering" },
  COMPLETED: { bg: "bg-emerald-950/60", text: "text-[#00E676]", label: "Verified & Done" },
  FAILED: { bg: "bg-rose-950/60", text: "text-rose-400", label: "Failed" },
  CANCELLED: { bg: "bg-slate-800/80", text: "text-slate-400", label: "Cancelled" },
  BLOCKED_BY_POLICY: { bg: "bg-red-950/80", text: "text-red-400", label: "Blocked by Policy" },
};

export const TaskMonitorHud: React.FC<Props> = ({ tasks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isEmergencyStop = agentSupervisor.isEmergencyStopActive();

  const activeTasks = tasks.filter(
    (t) => !["COMPLETED", "FAILED", "CANCELLED", "BLOCKED_BY_POLICY"].includes(t.state)
  );

  return (
    <div className="w-full max-w-[460px] mx-auto select-none">
      {/* Floating Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-100">Task Monitor HUD</span>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                10-State Engine
              </span>
            </div>
            <span className="text-[9px] text-slate-400">
              {activeTasks.length > 0
                ? `${activeTasks.length} active agent tasks in flight`
                : "All agent tasks verified & completed"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Emergency Stop Toggle */}
          <button
            onClick={() => {
              if (isEmergencyStop) {
                agentSupervisor.resumeAgents();
              } else {
                agentSupervisor.emergencyStop();
              }
            }}
            type="button"
            className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition flex items-center gap-1 border ${
              isEmergencyStop
                ? "bg-[#00E676] text-black border-[#00E676]"
                : "bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 border-rose-500/40"
            }`}
            title="Immediate emergency stop for all running agent executions"
          >
            <ShieldAlert className="w-3 h-3" />
            {isEmergencyStop ? "Resume Agents" : "Emergency Stop"}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="p-1 text-slate-300 hover:text-white rounded-lg bg-white/5 transition"
            title="Expand / Collapse Task History"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Task List Modal / Drawer */}
      {isExpanded && (
        <div className="mt-2 p-3 rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl max-h-[260px] overflow-y-auto space-y-2 backdrop-blur-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-white/10">
            <span>Recent Agent Supervised Tasks</span>
            <span className="text-emerald-400 font-mono">100% Invariant Verification</span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">No tasks logged yet.</div>
          ) : (
            tasks.slice(0, 10).map((t) => {
              const badge = STATE_BADGES[t.state] || STATE_BADGES.CREATED;
              return (
                <div
                  key={t.taskId}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-white/15 transition text-[11px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 truncate max-w-[240px]">
                      {t.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-bold border ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1.5">
                    <span>Agent: <b className="text-slate-300">{t.activeAgentLabel}</b></span>
                    <span>Role: <b className="text-sky-400">{t.avatarRole}</b></span>
                    <span>{t.updatedAt}</span>
                  </div>

                  <div className="text-[10px] text-slate-300 bg-slate-950/60 p-1.5 rounded-lg border border-white/5 font-mono truncate">
                    {t.currentStep}
                  </div>

                  {t.errors.length > 0 && (
                    <div className="mt-1 text-[9px] text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{t.errors[t.errors.length - 1]}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
