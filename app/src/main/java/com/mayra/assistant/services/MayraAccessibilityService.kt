package com.mayra.assistant.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.content.Intent
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * MAYRA Task Automation & Accessibility Service
 * 
 * Capabilities:
 * 1. Open any app by name or package with fallback mechanisms.
 * 2. Simulate taps and gestures on specific UI nodes.
 * 3. Automate WhatsApp message sending after intent pre-fill.
 * 4. Intercept UI state to verify task completion.
 */
class MayraAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "MayraAccessibility"
        
        @Volatile
        private var instance: MayraAccessibilityService? = null

        fun getInstance(): MayraAccessibilityService? = instance

        fun isRunning(): Boolean = instance != null
    }

    private var pendingWhatsAppAutoSend = false
    private var pendingTargetPackage: String? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "Mayra Accessibility Service Connected successfully.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: return

        // 1. WhatsApp Auto-Send Handler
        if (pendingWhatsAppAutoSend && (packageName.contains("whatsapp", ignoreCase = true))) {
            if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
                event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
                attemptWhatsAppSendButtonTap()
            }
        }
    }

    /**
     * Request automated send click for WhatsApp
     */
    fun scheduleWhatsAppAutoSend() {
        pendingWhatsAppAutoSend = true
        // Set a timeout of 5 seconds to cancel if not found
        mainHandler.postDelayed({
            if (pendingWhatsAppAutoSend) {
                attemptWhatsAppSendButtonTap()
                // Turn off flag after 5 seconds
                mainHandler.postDelayed({ pendingWhatsAppAutoSend = false }, 2000)
            }
        }, 600)
    }

    /**
     * Finds and taps the Send button inside WhatsApp
     */
    private fun attemptWhatsAppSendButtonTap(): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        try {
            // Search by View ID (WhatsApp send button ID)
            val sendById = rootNode.findAccessibilityNodeInfosByViewId("com.whatsapp:id/send")
            if (sendById != null && sendById.isNotEmpty()) {
                for (node in sendById) {
                    if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                        Log.i(TAG, "WhatsApp Send button clicked by View ID")
                        pendingWhatsAppAutoSend = false
                        return true
                    }
                }
            }

            // Search by Content Description ("Send", "भेजें", etc.)
            val sendByDesc = rootNode.findAccessibilityNodeInfosByText("Send")
            if (sendByDesc != null && sendByDesc.isNotEmpty()) {
                for (node in sendByDesc) {
                    if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                        Log.i(TAG, "WhatsApp Send button clicked by Text match")
                        pendingWhatsAppAutoSend = false
                        return true
                    }
                }
            }

            // Search through nodes recursively for send icon or button
            return searchAndClickSendNode(rootNode)
        } catch (e: Exception) {
            Log.e(TAG, "Error executing WhatsApp auto-send tap", e)
            return false
        }
    }

    private fun searchAndClickSendNode(node: AccessibilityNodeInfo): Boolean {
        val contentDesc = node.contentDescription?.toString()?.lowercase() ?: ""
        val viewId = node.viewIdResourceName?.lowercase() ?: ""
        
        if (contentDesc.contains("send") || viewId.contains("send")) {
            if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                pendingWhatsAppAutoSend = false
                return true
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            if (searchAndClickSendNode(child)) {
                return true
            }
        }
        return false
    }

    /**
     * Simulates a tap on specific coordinates
     */
    fun tapCoordinates(x: Float, y: Float, onComplete: ((Boolean) -> Unit)? = null) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            onComplete?.invoke(false)
            return
        }

        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0, 50)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                onComplete?.invoke(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                onComplete?.invoke(false)
            }
        }, null)
    }

    /**
     * Fallback to launch any installed app by name or package
     */
    fun launchAppByNameOrPackage(context: Context, query: String): Boolean {
        val pm = context.packageManager
        // Check if query is already a valid package name
        var launchIntent = pm.getLaunchIntentForPackage(query)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
            return true
        }

        // Search installed applications by label
        val installedApps = pm.getInstalledApplications(0)
        for (appInfo in installedApps) {
            val appLabel = pm.getApplicationLabel(appInfo).toString()
            if (appLabel.equals(query, ignoreCase = true) || 
                appLabel.contains(query, ignoreCase = true) ||
                appInfo.packageName.contains(query, ignoreCase = true)) {
                launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launchIntent)
                    return true
                }
            }
        }

        // Accessibility Fallback: perform GLOBAL_ACTION_HOME
        performGlobalAction(GLOBAL_ACTION_HOME)
        return false
    }

    override fun onInterrupt() {
        Log.w(TAG, "Mayra Accessibility Service interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }
}
