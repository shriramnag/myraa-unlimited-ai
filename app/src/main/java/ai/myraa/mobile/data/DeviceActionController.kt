package ai.myraa.mobile.data

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.provider.AlarmClock
import android.provider.MediaStore
import android.provider.Settings
import android.widget.Toast
import ai.myraa.mobile.AuditLogManager

class DeviceActionController(private val context: Context) {
    private var isTorchOn: Boolean = false

    fun toggleTorch(): Boolean {
        try {
            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
            val cameraId = cameraManager?.cameraIdList?.firstOrNull()
            if (cameraManager != null && cameraId != null) {
                isTorchOn = !isTorchOn
                cameraManager.setTorchMode(cameraId, isTorchOn)
                AuditLogManager.recordEvent(
                    "INFO",
                    "HARDWARE",
                    if (isTorchOn) "TORCH_ON" else "TORCH_OFF",
                    "EXECUTED",
                    "Camera torch mode set to $isTorchOn"
                )
                return isTorchOn
            }
        } catch (e: Exception) {
            AuditLogManager.recordEvent("LOW", "HARDWARE", "TORCH_TOGGLE", "FAILED", e.message ?: "Torch error")
        }
        isTorchOn = !isTorchOn
        return isTorchOn
    }

    fun isTorchActive(): Boolean = isTorchOn

    fun launchDialer(phoneNumber: String = "") {
        try {
            val uri = if (phoneNumber.isNotEmpty()) Uri.parse("tel:$phoneNumber") else Uri.parse("tel:")
            val intent = Intent(Intent.ACTION_DIAL, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            AuditLogManager.recordEvent("INFO", "TELEPHONY", "DIALER", "EXECUTED", "Launched dialer for $phoneNumber")
        } catch (e: Exception) {
            Toast.makeText(context, "Dialer error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun launchSms(phoneNumber: String, message: String) {
        try {
            val uri = Uri.parse("smsto:$phoneNumber")
            val intent = Intent(Intent.ACTION_SENDTO, uri).apply {
                putExtra("sms_body", message)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            AuditLogManager.recordEvent("INFO", "TELEPHONY", "SMS_COMPOSE", "EXECUTED", "Prepared SMS for $phoneNumber")
        } catch (e: Exception) {
            Toast.makeText(context, "SMS error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun launchWhatsApp(phoneNumber: String, message: String) {
        try {
            val cleanPhone = phoneNumber.replace("+", "").replace(" ", "").trim()
            val url = if (cleanPhone.isNotEmpty()) {
                "https://api.whatsapp.com/send?phone=$cleanPhone&text=${Uri.encode(message)}"
            } else {
                "https://api.whatsapp.com/send?text=${Uri.encode(message)}"
            }
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                setPackage("com.whatsapp")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            AuditLogManager.recordEvent("INFO", "MESSAGING", "WHATSAPP", "EXECUTED", "Launched WhatsApp intent")
        } catch (e: Exception) {
            // Fallback to browser
            val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://api.whatsapp.com/send?text=${Uri.encode(message)}")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(webIntent)
        }
    }

    fun launchCamera() {
        try {
            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            AuditLogManager.recordEvent("INFO", "CAMERA", "LAUNCH_CAMERA", "EXECUTED", "Launched camera viewfinder")
        } catch (e: Exception) {
            Toast.makeText(context, "Camera intent error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    fun launchSettings(settingType: String) {
        val action = when (settingType) {
            "WIFI" -> Settings.ACTION_WIFI_SETTINGS
            "BLUETOOTH" -> Settings.ACTION_BLUETOOTH_SETTINGS
            "DISPLAY" -> Settings.ACTION_DISPLAY_SETTINGS
            "BATTERY" -> Settings.ACTION_BATTERY_SAVER_SETTINGS
            "STORAGE" -> Settings.ACTION_INTERNAL_STORAGE_SETTINGS
            "ACCESSIBILITY" -> Settings.ACTION_ACCESSIBILITY_SETTINGS
            "NOTIFICATIONS" -> Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS
            else -> Settings.ACTION_SETTINGS
        }
        try {
            val intent = Intent(action).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            AuditLogManager.recordEvent("INFO", "SETTINGS", settingType, "EXECUTED", "Launched system settings")
        } catch (e: Exception) {
            val genericIntent = Intent(Settings.ACTION_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(genericIntent)
        }
    }

    fun launchMaps(query: String) {
        try {
            val uri = Uri.parse("geo:0,0?q=${Uri.encode(query)}")
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                setPackage("com.google.android.apps.maps")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            val browserUri = Uri.parse("https://maps.google.com/?q=${Uri.encode(query)}")
            context.startActivity(Intent(Intent.ACTION_VIEW, browserUri).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) })
        }
    }

    fun launchWebSearch(query: String) {
        try {
            val intent = Intent(Intent.ACTION_WEB_SEARCH).apply {
                putExtra("query", query)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            val uri = Uri.parse("https://www.google.com/search?q=${Uri.encode(query)}")
            context.startActivity(Intent(Intent.ACTION_VIEW, uri).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) })
        }
    }

    fun launchYouTubeSearch(query: String) {
        try {
            val intent = Intent(Intent.ACTION_SEARCH).apply {
                setPackage("com.google.android.youtube")
                putExtra("query", query)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            val uri = Uri.parse("https://www.youtube.com/results?search_query=${Uri.encode(query)}")
            context.startActivity(Intent(Intent.ACTION_VIEW, uri).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) })
        }
    }

    fun setAlarm(hour: Int, minute: Int, message: String) {
        try {
            val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
                putExtra(AlarmClock.EXTRA_HOUR, hour)
                putExtra(AlarmClock.EXTRA_MINUTES, minute)
                putExtra(AlarmClock.EXTRA_MESSAGE, message)
                putExtra(AlarmClock.EXTRA_SKIP_UI, false)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Alarm set error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
}
