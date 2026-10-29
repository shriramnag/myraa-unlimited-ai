package com.getcapacitor;

public class PluginCall {
    private final JSObject data;
    private JSObject resolvedData;
    private String rejectedMessage;

    public PluginCall() {
        this.data = new JSObject();
    }

    public PluginCall(JSObject data) {
        this.data = data != null ? data : new JSObject();
    }

    public JSObject getData() {
        return data;
    }

    public String getString(String key) {
        return getString(key, null);
    }

    public String getString(String key, String defaultValue) {
        return data.getString(key, defaultValue);
    }

    public Integer getInt(String key) {
        return getInt(key, null);
    }

    public Integer getInt(String key, Integer defaultValue) {
        return data.getInteger(key, defaultValue);
    }

    public Boolean getBoolean(String key) {
        return getBoolean(key, false);
    }

    public Boolean getBoolean(String key, Boolean defaultValue) {
        return data.getBoolean(key, defaultValue);
    }

    public JSObject getObject(String key) {
        return getObject(key, new JSObject());
    }

    public JSObject getObject(String key, JSObject defaultValue) {
        JSObject obj = data.getJSObject(key);
        return obj != null ? obj : defaultValue;
    }

    public void resolve() {
        this.resolvedData = new JSObject();
    }

    public void resolve(JSObject data) {
        this.resolvedData = data;
    }

    public void reject(String msg) {
        this.rejectedMessage = msg;
    }

    public JSObject getResolvedData() {
        return resolvedData;
    }

    public String getRejectedMessage() {
        return rejectedMessage;
    }
}
