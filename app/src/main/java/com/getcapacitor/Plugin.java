package com.getcapacitor;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.lang.reflect.Method;

public class Plugin {
    private Activity activity;
    private Context context;

    public void setActivity(Activity activity) {
        this.activity = activity;
        this.context = activity != null ? activity.getApplicationContext() : null;
    }

    public void setContext(Context context) {
        this.context = context;
    }

    public Activity getActivity() {
        return activity;
    }

    public Context getContext() {
        return context != null ? context : (activity != null ? activity.getApplicationContext() : null);
    }

    public PermissionState getPermissionState(String alias) {
        Context ctx = getContext();
        if (ctx == null) return PermissionState.PROMPT;
        CapacitorPlugin annotation = getClass().getAnnotation(CapacitorPlugin.class);
        if (annotation != null) {
            for (Permission perm : annotation.permissions()) {
                if (perm.alias().equals(alias)) {
                    for (String permStr : perm.strings()) {
                        if (ContextCompat.checkSelfPermission(ctx, permStr) != PackageManager.PERMISSION_GRANTED) {
                            return PermissionState.PROMPT;
                        }
                    }
                    return PermissionState.GRANTED;
                }
            }
        }
        return PermissionState.GRANTED;
    }

    protected void requestPermissionForAlias(String alias, PluginCall call, String callbackName) {
        try {
            Method m = getClass().getDeclaredMethod(callbackName, PluginCall.class);
            m.setAccessible(true);
            m.invoke(this, call);
        } catch (Exception e) {
            call.reject("Permission request error: " + e.getMessage());
        }
    }
}
