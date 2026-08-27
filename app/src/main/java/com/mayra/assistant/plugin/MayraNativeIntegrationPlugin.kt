package com.mayra.assistant.plugin

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.mayra.assistant.engine.MayraSmsHandler
import com.mayra.assistant.engine.MayraTelecomHandler
import com.mayra.assistant.services.MayraAccessibilityService
import com.mayra.assistant.services.MayraNotificationService
import java.net.URLEncoder

/**
 * MAYRA Native Android Integration Plugin
 * Bridges React / Web Assistant with Android Native OS APIs.
 */
@CapacitorPlugin(name = "MayraNativeIntegration")
class MayraNativeIntegrationPlugin : Plugin() {

    companion object {
        private const val TAG = "MayraNativePlugin"
    }

    private lateinit var smsHandler: MayraSmsHandler
    private lateinit var telecomHandler: MayraTelecomHandler

    override fun load() {
        super.load()
        smsHandler = MayraSmsHandler(context)
        telecomHandler = MayraTelecomHandler(context)

        // Bind incoming notification listener to JavaScript bridge
        MayraNotificationService.onNotificationReceivedListener = { data ->
            val event = JSObject().apply {
                put("id", data.id)
                put("packageName", data.packageName)
                put("appName", data.appName)
                put("sender", data.sender)
                put("text", data.text)
                put("timestamp", data.timestamp)
                put("isMessaging", data.isMessaging)
                put("isCall", data.isCall)
            }
            notifyListeners("onIncomingNotification", event)
        }
    }

    @PluginMethod
    fun checkSystemServicesStatus(call: PluginCall) {
        val result = JSObject().apply {
            put("isAccessibilityActive", MayraAccessibilityService.isRunning())
            put("isNotificationListenerActive", MayraNotificationService.isRunning())
            
            // Check battery optimization exemption
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            val isBatteryIgnoring = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && powerManager != null) {
                powerManager.isIgnoringBatteryOptimizations(context.packageName)
            } else {
                true
            }
            put("isBatteryOptimizationExempt", isBatteryIgnoring)

            // Check overlay permission
            val canDrawOverlays = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(context)
            } else {
                true
            }
            put("canDrawOverlays", canDrawOverlays)
        }
        call.resolve(result)
    }

    @PluginMethod
    fun openAccessibilitySettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Failed to open accessibility settings: ${e.message}")
        }
    }

    @PluginMethod
    fun openNotificationListenerSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Failed to open notification listener settings: ${e.message}")
        }
    }

    @PluginMethod
    fun openVoiceInputSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_VOICE_INPUT_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Failed to open voice input settings: ${e.message}")
        }
    }

    @PluginMethod
    fun openBatteryOptimizationSettings(call: PluginCall) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${context.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            }
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Failed to open battery optimization settings: ${e.message}")
        }
    }

    @PluginMethod
    fun sendSmsDirect(call: PluginCall) {
        val phoneNumber = call.getString("phoneNumber") ?: ""
        val message = call.getString("message") ?: ""

        if (phoneNumber.isBlank() || message.isBlank()) {
            call.reject("Phone number and message are required")
            return
        }

        smsHandler.sendDirectSms(phoneNumber, message) { success, msg ->
            if (success) {
                call.resolve(JSObject().put("success", true).put("message", msg))
            } else {
                call.reject(msg)
            }
        }
    }

    @PluginMethod
    fun sendWhatsAppMessage(call: PluginCall) {
        val phoneNumber = call.getString("phoneNumber") ?: ""
        val message = call.getString("message") ?: ""
        val autoSend = call.getBoolean("autoSend", false) ?: false

        try {
            val cleanNumber = phoneNumber.replace("[^0-9]".toRegex(), "")
            val encodedMessage = URLEncoder.encode(message, "UTF-8")
            
            // Build Intent to WhatsApp direct chat
            val uri = if (cleanNumber.isNotBlank()) {
                Uri.parse("https://api.whatsapp.com/send?phone=$cleanNumber&text=$encodedMessage")
            } else {
                Uri.parse("https://api.whatsapp.com/send?text=$encodedMessage")
            }

            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                setPackage("com.whatsapp")
            }

            // Schedule auto-send tap via Accessibility Service if enabled
            if (autoSend && MayraAccessibilityService.isRunning()) {
                MayraAccessibilityService.getInstance()?.scheduleWhatsAppAutoSend()
            }

            context.startActivity(intent)
            call.resolve(JSObject().apply {
                put("success", true)
                put("autoSendScheduled", autoSend && MayraAccessibilityService.isRunning())
            })
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch WhatsApp intent", e)
            call.reject("WhatsApp is not installed or could not be launched: ${e.message}")
        }
    }

    @PluginMethod
    fun answerCall(call: PluginCall) {
        val success = telecomHandler.answerCall()
        if (success) {
            call.resolve(JSObject().put("success", true))
        } else {
            call.reject("Failed to answer call or no active ringing call found")
        }
    }

    @PluginMethod
    fun rejectCall(call: PluginCall) {
        val success = telecomHandler.rejectCall()
        if (success) {
            call.resolve(JSObject().put("success", true))
        } else {
            call.reject("Failed to reject or end call")
        }
    }

    @PluginMethod
    fun lookupCaller(call: PluginCall) {
        val phoneNumber = call.getString("phoneNumber") ?: ""
        val name = telecomHandler.resolveContactName(phoneNumber)
        call.resolve(JSObject().apply {
            put("phoneNumber", phoneNumber)
            put("contactName", name ?: "")
            put("found", name != null)
        })
    }

    @PluginMethod
    fun launchApp(call: PluginCall) {
        val appNameOrPackage = call.getString("appName") ?: ""
        val service = MayraAccessibilityService.getInstance()
        val success = service?.launchAppByNameOrPackage(context, appNameOrPackage) ?: run {
            val pm = context.packageManager
            val intent = pm.getLaunchIntentForPackage(appNameOrPackage)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                true
            } else false
        }

        if (success) {
            call.resolve(JSObject().put("success", true))
        } else {
            call.reject("App not found or could not be opened: $appNameOrPackage")
        }
    }

    @PluginMethod
    fun simulateTap(call: PluginCall) {
        val x = call.getDouble("x")?.toFloat() ?: 0f
        val y = call.getDouble("y")?.toFloat() ?: 0f

        val service = MayraAccessibilityService.getInstance()
        if (service == null) {
            call.reject("Accessibility Service is not enabled")
            return
        }

        service.tapCoordinates(x, y) { success ->
            if (success) {
                call.resolve(JSObject().put("success", true))
            } else {
                call.reject("Tap gesture cancelled or failed")
            }
        }
    }
}
