package ai.myraa.mobile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * PHASE 2 & 3: REDACTED AUDIT LOG MANAGER
 * Stores security and automation events with mandatory secret redaction.
 */
public final class AuditLogManager {

    public static final class AuditEvent {
        public final long timestampMs;
        public final String severity;
        public final String subsystem;
        public final String action;
        public final String outcome;
        public final String detail;

        public AuditEvent(long timestampMs, String severity, String subsystem, String action, String outcome, String detail) {
            this.timestampMs = timestampMs;
            this.severity = severity;
            this.subsystem = subsystem;
            this.action = action;
            this.outcome = outcome;
            this.detail = SecurityPolicyEngine.redactSensitiveText(detail);
        }
    }

    private static final List<AuditEvent> EVENTS = new ArrayList<>();
    private static final int MAX_EVENTS = 200;

    private AuditLogManager() {}

    public static synchronized void recordEvent(String severity, String subsystem, String action, String outcome, String detail) {
        if (EVENTS.size() >= MAX_EVENTS) {
            EVENTS.remove(0);
        }
        EVENTS.add(new AuditEvent(System.currentTimeMillis(), severity, subsystem, action, outcome, detail));
    }

    public static synchronized List<AuditEvent> getRecentEvents() {
        return Collections.unmodifiableList(new ArrayList<>(EVENTS));
    }
}
