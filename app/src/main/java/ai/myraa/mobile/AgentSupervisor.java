package ai.myraa.mobile;

import java.util.Arrays;
import java.util.List;

/**
 * PHASE 5: AGENT SUPERVISOR, INTENT ROUTER & EMERGENCY STOP CONTROLLER
 */
public final class AgentSupervisor {

    private static volatile boolean emergencyStopActive = false;

    private AgentSupervisor() {}

    public static String routeSpecialistAgent(String actionOrIntent) {
        if (actionOrIntent == null) return "MainOrchestratorAgent";
        String upper = actionOrIntent.toUpperCase();
        if (upper.contains("CODE") || upper.contains("FILE") || upper.contains("SCRIPT")) {
            return "SoftwareEngineeringAgent";
        }
        if (upper.contains("SECURITY") || upper.contains("SCAN") || upper.contains("NOTIFICATION")) {
            return "CybersecurityAgent";
        }
        if (upper.contains("MEMORY") || upper.contains("REMEMBER")) {
            return "MemoryContextAgent";
        }
        if (upper.contains("SEARCH") || upper.contains("YOUTUBE") || upper.contains("MAPS")) {
            return "ResearchAgent";
        }
        if (upper.contains("CAMERA") || upper.contains("THEME") || upper.contains("AVATAR")) {
            return "UserInterfaceAgent";
        }
        return "AndroidDevelopmentAgent";
    }

    public static String selectAvatarRoleForAgent(String specialistAgent) {
        if ("SoftwareEngineeringAgent".equals(specialistAgent) || "DebuggingAgent".equals(specialistAgent)) {
            return "CODEX";
        }
        if ("CybersecurityAgent".equals(specialistAgent)) {
            return "SENTINEL";
        }
        if ("ResearchAgent".equals(specialistAgent) || "PlanningAgent".equals(specialistAgent)) {
            return "SAGE";
        }
        if ("UserInterfaceAgent".equals(specialistAgent)) {
            return "PIXEL";
        }
        return "MYRAA";
    }

    public static synchronized void triggerEmergencyStop() {
        emergencyStopActive = true;
        TaskStateManager.cancelAllActiveTasks("Emergency Stop triggered by user.");
        AuditLogManager.recordEvent("HIGH", "AGENT_SUPERVISOR", "EMERGENCY_STOP", "CANCELLED",
            "User activated Emergency Stop; all active tasks halted.");
    }

    public static synchronized void resetEmergencyStop() {
        emergencyStopActive = false;
    }

    public static boolean isEmergencyStopActive() {
        return emergencyStopActive;
    }
}
