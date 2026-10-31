import React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { TaskRecord } from "../types";

interface TaskMonitorHudProps {
  tasks: TaskRecord[];
  defaultExpanded?: boolean;
}

export const TaskMonitorHud: React.FC<TaskMonitorHudProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400">
        अभी कोई टास्क नहीं चला है। जब आप कोई वॉइस कमांड या टूल चलाएँगे, तो उसकी असली स्थिति यहाँ दिखेगी।
      </div>
    );
  }

  return (
    <div className="max-h-[65vh] overflow-y-auto space-y-2.5 pr-1">
      {tasks.map((task) => {
        const isDone = task.state === "COMPLETED";
        const isFail = task.state === "FAILED" || task.state === "BLOCKED_BY_POLICY";
        return (
          <div
            key={task.taskId}
            className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">{task.title}</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                  isDone
                    ? "bg-emerald-500/20 text-emerald-300"
                    : isFail
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-sky-500/20 text-sky-300"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isFail ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {task.state}
              </span>
            </div>
            <div className="text-xs text-slate-300">{task.currentStep}</div>
            {task.errors.length > 0 && (
              <div className="text-xs text-rose-300">{task.errors[task.errors.length - 1]}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
