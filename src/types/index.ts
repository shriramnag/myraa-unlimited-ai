export type CharacterRole = "MYRAA" | "CODEX" | "AURA" | "SENTINEL" | "SAGE" | "PIXEL";

export interface RoleTheme {
  role: CharacterRole;
  name: string;
  hindiTitle: string;
  specialty: string;
  badge: string;
  color: string;
  hex: string;
  thumb: string;
  closeupVideo: string;
  fullVideo: string;
  systemPersona: string;
  voiceName: "Kore" | "Aoede" | "Despina" | "Puck" | "Fenrir" | "Charon";
  voiceGender: "Female" | "Male";
  voiceDescription: string;
}

export type TaskState =
  | "CREATED"
  | "PLANNING"
  | "AWAITING_APPROVAL"
  | "EXECUTING"
  | "VERIFYING"
  | "RECOVERING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "BLOCKED_BY_POLICY";

export interface TaskRecord {
  taskId: string;
  title: string;
  actionName: string;
  activeAgent: string;
  activeAgentLabel: string;
  avatarRole: CharacterRole;
  selectedModel: string;
  state: TaskState;
  currentStep: string;
  completedSteps: string[];
  remainingSteps: string[];
  errors: string[];
  recoveryAttempts: number;
  maxRetries: number;
  approvalRequests: string[];
  verificationStatus: "PENDING" | "VERIFIED" | "FAILED" | "BLOCKED_BY_POLICY";
  verified: boolean;
  paused: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShivAiTool {
  id: string;
  index: number;
  name: string;
  category: "MEMORY" | "CODING" | "RESEARCH" | "WRITING" | "CREATION" | "MEDIA" | "SECURITY" | "MODELS";
  icon: string;
  upstreamRepo: string;
  hindiDesc: string;
  keywords: string[];
}

export interface BrainMemory {
  id: string;
  category: "IDENTITY" | "PREFERENCE" | "PROJECT" | "FACT" | "HABIT" | "RELATIONSHIP";
  key: string;
  content: string;
  timestamp: string;
  tags: string[];
}

export interface NativeActionDefinition {
  name: string;
  category: "DEVICE" | "NAVIGATION" | "MEDIA" | "PRODUCTIVITY" | "PRIVACY";
  description: string;
  requiresConfirmation: boolean;
  iconName: string;
}

export interface AuditLogItem {
  id: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: string;
  action: string;
  status: "ALLOWED" | "BLOCKED_BY_POLICY" | "AWAITING_CONFIRMATION" | "EXECUTED";
  details: string;
  timestamp: string;
}
