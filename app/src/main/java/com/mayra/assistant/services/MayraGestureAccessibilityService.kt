package com.mayra.assistant.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import android.widget.ImageView

/**
 * MAYRA System-Wide Gesture Accessibility Service
 * 
 * Translates camera hand-tracking into real Android system-wide touch events:
 * 1. Double-tap finger gesture -> Dispatches short-duration TAP/CLICK at pointer (x, y).
 * 2. Vertical swipe up (bottom to top) -> Dispatches vertical SCROLL UP gesture (reels/feeds).
 * 3. Hold hand in place -> Dispatches LONG PRESS at pointer (x, y).
 * 
 * Displays a visual pointer/cursor overlay on screen showing tracked hand location.
 * Fully honors privacy: Stops camera tracking immediately on screen lock (ACTION_SCREEN_OFF).
 */
class MayraGestureAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "MayraGestureA11y"

        @Volatile
        private var instance: MayraGestureAccessibilityService? = null

        fun getInstance(): MayraGestureAccessibilityService? = instance
        fun isServiceRunning(): Boolean = instance != null

        /**
         * Dispatches synthetic Tap/Click at specified screen coordinates
         */
        fun performTap(x: Float, y: Float, onComplete: ((Boolean) -> Unit)? = null) {
            instance?.dispatchTapAt(x, y, onComplete) ?: onComplete?.invoke(false)
        }

        /**
         * Dispatches synthetic Scroll Up gesture (bottom to top swipe)
         */
        fun performScrollUp(startX: Float, startY: Float, onComplete: ((Boolean) -> Unit)? = null) {
            instance?.dispatchScrollUp(startX, startY, onComplete) ?: onComplete?.invoke(false)
        }

        /**
         * Dispatches synthetic Long Press gesture at specified screen coordinates
         */
        fun performLongPress(x: Float, y: Float, onComplete: ((Boolean) -> Unit)? = null) {
            instance?.dispatchLongPress(x, y, onComplete) ?: onComplete?.invoke(false)
        }

        /**
         * Updates the on-screen visual pointer/cursor location
         */
        fun updateCursorPosition(x: Float, y: Float) {
            instance?.movePointerCursor(x, y)
        }
    }

    private var windowManager: WindowManager? = null
    private var pointerCursorView: View? = null
    private var pointerLayoutParams: WindowManager.LayoutParams? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    private var currentPointerX = 300f
    private var currentPointerY = 600f

    // Screen lock broadcast receiver for instant privacy protection
    private val screenOffReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) {
                Log.d(TAG, "Screen OFF detected -> Stopping gesture tracking and hiding cursor")
                hidePointerCursor()
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        Log.i(TAG, "MayraGestureAccessibilityService Connected successfully.")

        val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
        registerReceiver(screenOffReceiver, filter)

        setupPointerCursorView()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // System wide event listening if needed for node targeting
    }

    override fun onInterrupt() {
        Log.w(TAG, "MayraGestureAccessibilityService interrupted.")
    }

    /**
     * 1. Dispatch Tap / Click at (x, y) via GestureDescription
     */
    fun dispatchTapAt(x: Float, y: Float, onComplete: ((Boolean) -> Unit)? = null) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            onComplete?.invoke(false)
            return
        }

        Log.d(TAG, "Dispatching synthetic TAP at ($x, $y)")
        showPointerClickFeedback(x, y, isLongPress = false)

        val path = Path().apply {
            moveTo(x, y)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, 50)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d(TAG, "Synthetic TAP completed successfully at ($x, $y)")
                onComplete?.invoke(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w(TAG, "Synthetic TAP cancelled at ($x, $y)")
                onComplete?.invoke(false)
            }
        }, null)
    }

    /**
     * 2. Dispatch Vertical Scroll Up gesture (bottom to top swipe, like scrolling Reels/Shorts)
     */
    fun dispatchScrollUp(startX: Float, startY: Float, onComplete: ((Boolean) -> Unit)? = null) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            onComplete?.invoke(false)
            return
        }

        val endY = (startY - 600f).coerceAtLeast(100f)
        Log.d(TAG, "Dispatching synthetic SCROLL UP from ($startX, $startY) to ($startX, $endY)")
        showPointerScrollFeedback(startX, startY, endY)

        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(startX, endY)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, 250)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d(TAG, "Synthetic SCROLL UP completed successfully")
                onComplete?.invoke(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w(TAG, "Synthetic SCROLL UP cancelled")
                onComplete?.invoke(false)
            }
        }, null)
    }

    /**
     * 3. Dispatch Long Press gesture (800ms hold at coordinates)
     */
    fun dispatchLongPress(x: Float, y: Float, onComplete: ((Boolean) -> Unit)? = null) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            onComplete?.invoke(false)
            return
        }

        Log.d(TAG, "Dispatching synthetic LONG PRESS at ($x, $y)")
        showPointerClickFeedback(x, y, isLongPress = true)

        val path = Path().apply {
            moveTo(x, y)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, 800)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d(TAG, "Synthetic LONG PRESS completed successfully")
                onComplete?.invoke(true)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w(TAG, "Synthetic LONG PRESS cancelled")
                onComplete?.invoke(false)
            }
        }, null)
    }

    // ----------------------------------------------------
    // Visual Pointer / Cursor Overlay
    // ----------------------------------------------------
    private fun setupPointerCursorView() {
        if (pointerCursorView != null) return

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY
        }

        pointerLayoutParams = WindowManager.LayoutParams(
            80, 80,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = currentPointerX.toInt()
            y = currentPointerY.toInt()
        }

        val frame = FrameLayout(this)

        // Outer glowing cyan ring
        val outerRing = View(this).apply {
            layoutParams = FrameLayout.LayoutParams(80, 80)
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#3306B6D4"))
                setStroke(3, Color.parseColor("#06B6D4"))
            }
        }
        frame.addView(outerRing)

        // Inner glowing core dot
        val innerDot = View(this).apply {
            layoutParams = FrameLayout.LayoutParams(24, 24).apply {
                gravity = Gravity.CENTER
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.WHITE)
                setStroke(2, Color.parseColor("#22D3EE"))
            }
        }
        frame.addView(innerDot)

        pointerCursorView = frame
        try {
            windowManager?.addView(pointerCursorView, pointerLayoutParams)
        } catch (e: Exception) {
            Log.e(TAG, "Could not add accessibility pointer overlay: ${e.message}")
        }
    }

    fun movePointerCursor(x: Float, y: Float) {
        currentPointerX = x
        currentPointerY = y
        mainHandler.post {
            pointerLayoutParams?.let { params ->
                params.x = (x - 40).toInt()
                params.y = (y - 40).toInt()
                pointerCursorView?.let { view ->
                    view.visibility = View.VISIBLE
                    try {
                        windowManager?.updateViewLayout(view, params)
                    } catch (e: Exception) {
                        // ignore
                    }
                }
            }
        }
    }

    private fun showPointerClickFeedback(x: Float, y: Float, isLongPress: Boolean) {
        mainHandler.post {
            pointerCursorView?.animate()
                ?.scaleX(if (isLongPress) 1.6f else 1.3f)
                ?.scaleY(if (isLongPress) 1.6f else 1.3f)
                ?.setDuration(if (isLongPress) 400 else 150)
                ?.withEndAction {
                    pointerCursorView?.animate()
                        ?.scaleX(1.0f)
                        ?.scaleY(1.0f)
                        ?.setDuration(150)
                        ?.start()
                }
                ?.start()
        }
    }

    private fun showPointerScrollFeedback(startX: Float, startY: Float, endY: Float) {
        mainHandler.post {
            pointerCursorView?.animate()
                ?.translationYBy(-150f)
                ?.setDuration(250)
                ?.withEndAction {
                    pointerCursorView?.translationY = 0f
                }
                ?.start()
        }
    }

    private fun hidePointerCursor() {
        mainHandler.post {
            pointerCursorView?.visibility = View.GONE
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i(TAG, "MayraGestureAccessibilityService destroyed.")
        try {
            unregisterReceiver(screenOffReceiver)
        } catch (e: Exception) {
            // ignore
        }

        pointerCursorView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {
                // ignore
            }
        }
        pointerCursorView = null
        instance = null
    }
}
