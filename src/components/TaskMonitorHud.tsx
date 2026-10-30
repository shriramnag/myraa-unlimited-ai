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
          {/* Emergency Stop / Resume Toggle */}
          {isEmergencyStop ? (
            <button
              onClick={() => agentSupervisor.resumeAgents()}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={() => agentSupervisor.emergencyStop()}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-xl bg-rose-600/90 text-white hover:bg-rose-500 transition"
            >
              <Pause className="w-3 h-3" />
              <span>HALT</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="mt-2 p-2.5 rounded-2xl bg-slate-900/95 border border-white/10 backdrop-blur-xl shadow-2xl max-h-[220px] overflow-y-auto space-y-2">
          {tasks.slice(0, 6).map((task) => {
            const badge = STATE_BADGES[task.state] || STATE_BADGES.CREATED;
            return (
              <div
                key={task.taskId}
                className="p-2 rounded-xl bg-slate-950/70 border border-white/5 text-[10px]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200 truncate max-w-[210px]">
                    {task.title}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-mono font-bold text-[8px] ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 truncate">
                  {task.activeAgentLabel} • {task.currentStep}
                </div>
                {task.verified && (
                  <div className="flex items-center gap-1 mt-1 text-[8px] text-emerald-400 font-mono">
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>Invariant: Supervisor Verified Outcome</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
