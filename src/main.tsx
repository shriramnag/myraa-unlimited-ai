import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[MYRAA Crash Recovery] Unhandled error caught by RootErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    try {
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-950 text-white select-none">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-sky-500/40 flex items-center justify-center mb-4 text-2xl">
            🌸
          </div>
          <h1 className="text-base font-bold text-sky-400 mb-1">
            SHIV AI • MYRAA Recovery Shield
          </h1>
          <p className="text-xs text-slate-400 text-center max-w-sm mb-4">
            श्री राम नाग जी, सिस्टम ने एक असामान्य स्थिति को सुरक्षित रूप से रिकवर कर लिया है।
          </p>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-[10px] font-mono text-slate-400 max-w-sm overflow-x-auto mb-4">
            {this.state.error?.message || "Safe Fallback Activated"}
          </div>
          <button
            onClick={this.handleReset}
            type="button"
            className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow-lg active:scale-95"
          >
            सिस्टम रीस्टार्ट करें (Restart Engine)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
