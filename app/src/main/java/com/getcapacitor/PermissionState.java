package com.getcapacitor;

public enum PermissionState {
    GRANTED,
    DENIED,
    PROMPT,
    PROMPT_WITH_RATIONALE;

    @Override
    public String toString() {
        return name().toLowerCase();
    }
}
