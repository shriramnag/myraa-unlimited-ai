package ai.myraa.mobile;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * PHASE 2: CENTRALIZED PERMISSION MANAGER
 * Enforces agent permission scopes and explicitly forbids SMS-reading permissions.
 */
public final class PermissionManager {

    private PermissionManager() {}

    public static final Set<String> FORBIDDEN_PERMISSIONS = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
        "android.permission.READ_SMS",
        "android.permission.RECEIVE_SMS",
        "android.permission.RECEIVE_MMS",
        "android.permission.BIND_DEVICE_ADMIN"
    )));

    public static boolean isPermissionForbidden(String permission) {
        return permission != null && FORBIDDEN_PERMISSIONS.contains(permission);
    }

    public static boolean isRuntimePermissionGranted(Context context, String permission) {
        if (isPermissionForbidden(permission)) return false;
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED;
    }
}
