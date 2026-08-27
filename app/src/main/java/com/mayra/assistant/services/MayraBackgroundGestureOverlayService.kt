package com.mayra.assistant.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CaptureRequest
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.mayra.assistant.MainActivity

/**
 * MAYRA Background Hand-Gesture Floating Overlay & Foreground Camera Service.
 *
 * Requirements implemented:
 * 1. Floating overlay bubble (Messenger Chat-Head style) displayed over Home screen and other apps.
 * 2. Gesture / double-tap / proximity trigger to launch MAYRA or trigger voice assistant.
 * 3. ALWAYS VISIBLE clear camera indicator banner ("MAYRA is watching" with active glowing dot).
 * 4. STRICT PRIVACY: Automatic camera cutoff immediately upon ACTION_SCREEN_OFF (screen lock / power button).
 *    Upon unlock (ACTION_USER_PRESENT), camera remains OFF until the user manually reactivates it.
 * 5. Native Foreground Service compliance (Android 14+ foregroundServiceType="camera|specialUse").
 */
class MayraBackgroundGestureOverlayService : Service() {

    companion object {
        private const val TAG = "MayraBgGestureService"
        const val CHANNEL_ID = "mayra_bg_gesture_channel"
        const val NOTIFICATION_ID = 3001

        const val ACTION_START_OVERLAY = "com.mayra.assistant.ACTION_START_GESTURE_OVERLAY"
        const val ACTION_STOP_OVERLAY = "com.mayra.assistant.ACTION_STOP_GESTURE_OVERLAY"
        const val ACTION_RESUME_CAMERA = "com.mayra.assistant.ACTION_RESUME_CAMERA_MANUAL"

        @Volatile
        var isOverlayRunning = false
            private set

        @Volatile
        var isCameraActive = false
            private set

        @Volatile
        var isSuspendedDueToScreenLock = false
            private set

        fun start(context: Context) {
            val intent = Intent(context, MayraBackgroundGestureOverlayService::class.java).apply {
                action = ACTION_START_OVERLAY
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, MayraBackgroundGestureOverlayService::class.java).apply {
                action = ACTION_STOP_OVERLAY
            }
            context.startService(intent)
        }
    }

    private var windowManager: WindowManager? = null
    private var floatingBubbleView: View? = null
    private var persistentIndicatorView: View? = null

    private var bubbleLayoutParams: WindowManager.LayoutParams? = null
    private var indicatorLayoutParams: WindowManager.LayoutParams? = null

    private var cameraManager: CameraManager? = null
    private var cameraDevice: CameraDevice? = null
    private var captureSession: CameraCaptureSession? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    private var lastTapTime = 0L

    // Screen-off broadcast receiver for instant privacy camera shut-down
    private val screenEventReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_OFF -> {
                    Log.d(TAG, "Screen OFF / locked detected -> Immediately cutting off background camera for privacy")
                    stopCameraTracking(reason = "SCREEN_OFF")
                    isSuspendedDueToScreenLock = true
                    updateOverlayIndicatorUI(isWatching = false, suspended = true)
                    updateForegroundNotification(isWatching = false, suspended = true)
                }
                Intent.ACTION_USER_PRESENT -> {
                    Log.d(TAG, "Screen unlocked -> Camera stays OFF per privacy mandate until manually reactivated")
                    // Do NOT auto-start camera. User must manually tap bubble to resume.
                    updateOverlayIndicatorUI(isWatching = false, suspended = true)
                    updateForegroundNotification(isWatching = false, suspended = true)
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "MayraBackgroundGestureOverlayService created")
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager

        createNotificationChannel()

        // Register dynamic screen-off and unlock listeners
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        registerReceiver(screenEventReceiver, filter)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START_OVERLAY

        when (action) {
            ACTION_START_OVERLAY -> {
                isOverlayRunning = true
                isSuspendedDueToScreenLock = false
                startForegroundWithNotification()
                setupFloatingBubble()
                setupPersistentAlwaysVisibleIndicator()
                startCameraTracking()
            }
            ACTION_STOP_OVERLAY -> {
                stopSelf()
            }
            ACTION_RESUME_CAMERA -> {
                isSuspendedDueToScreenLock = false
                startCameraTracking()
            }
        }

        return START_STICKY
    }

    private fun startForegroundWithNotification() {
        val notification = buildForegroundNotification(isWatching = true, suspended = false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
            } else {
                0
            }
            startForeground(NOTIFICATION_ID, notification, type)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildForegroundNotification(isWatching: Boolean, suspended: Boolean): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val title = if (isWatching) "MAYRA is watching" else if (suspended) "Camera Paused (Screen Locked)" else "MAYRA Background Gesture"
        val text = if (isWatching) "Always-visible camera gesture tracking active" else "Camera safely stopped upon screen lock. Tap to reactivate."

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setColor(if (isWatching) Color.parseColor("#06B6D4") else Color.parseColor("#F59E0B"))
            .build()
    }

    private fun updateForegroundNotification(isWatching: Boolean, suspended: Boolean) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildForegroundNotification(isWatching, suspended))
    }

    // 1. Floating Bubble (Chat Head)
    private fun setupFloatingBubble() {
        if (floatingBubbleView != null) return

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        bubbleLayoutParams = WindowManager.LayoutParams(
            160, 160,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 40
            y = 320
        }

        val frame = FrameLayout(this).apply {
            val bgDrawable = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                colors = intArrayOf(Color.parseColor("#06B6D4"), Color.parseColor("#7C3AED"), Color.parseColor("#EC4899"))
                gradientType = GradientDrawable.RADIAL_GRADIENT
                gradientRadius = 90f
                setStroke(4, Color.WHITE)
            }
            background = bgDrawable
        }

        val innerIcon = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_btn_speak_now)
            scaleType = ImageView.ScaleType.CENTER_INSIDE
            setPadding(20, 20, 20, 20)
        }
        frame.addView(innerIcon)

        // Touch & Drag handler with Double-Tap detection
        frame.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isMove = false

            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = bubbleLayoutParams?.x ?: 0
                        initialY = bubbleLayoutParams?.y ?: 0
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isMove = false
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.hypot(dx.toDouble(), dy.toDouble()) > 10) {
                            isMove = true
                            bubbleLayoutParams?.x = initialX + dx
                            bubbleLayoutParams?.y = initialY + dy
                            windowManager?.updateViewLayout(floatingBubbleView, bubbleLayoutParams)
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (!isMove) {
                            val now = System.currentTimeMillis()
                            if (now - lastTapTime < 350) {
                                // DOUBLE TAP -> Trigger Voice Assistant
                                Log.d(TAG, "Double tap on floating bubble -> Launching Voice Assistant")
                                triggerVoiceAssistant()
                            } else {
                                // SINGLE TAP -> Open MAYRA App or Resume Camera if suspended
                                if (isSuspendedDueToScreenLock) {
                                    isSuspendedDueToScreenLock = false
                                    startCameraTracking()
                                } else {
                                    openMayraApp()
                                }
                            }
                            lastTapTime = now
                        }
                        return true
                    }
                }
                return false
            }
        })

        floatingBubbleView = frame
        try {
            windowManager?.addView(floatingBubbleView, bubbleLayoutParams)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add floating bubble overlay: ${e.message}")
        }
    }

    // 2. ALWAYS VISIBLE Camera Active Indicator Banner
    private fun setupPersistentAlwaysVisibleIndicator() {
        if (persistentIndicatorView != null) return

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        indicatorLayoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = 20
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(28, 12, 28, 12)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#E6050714"))
                cornerRadius = 60f
                setStroke(3, Color.parseColor("#F43F5E"))
            }
        }

        // Red glowing dot
        val dot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(20, 20).apply {
                marginEnd = 16
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#F43F5E"))
            }
        }
        container.addView(dot)

        // Status Text: "MAYRA is watching"
        val text = TextView(this).apply {
            tag = "status_text"
            text = "MAYRA is watching"
            setTextColor(Color.WHITE)
            textSize = 12f
            paint.isFakeBoldText = true
        }
        container.addView(text)

        persistentIndicatorView = container
        try {
            windowManager?.addView(persistentIndicatorView, indicatorLayoutParams)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to add persistent indicator overlay: ${e.message}")
        }
    }

    private fun updateOverlayIndicatorUI(isWatching: Boolean, suspended: Boolean) {
        mainHandler.post {
            persistentIndicatorView?.let { view ->
                val text = view.findViewWithTag<TextView>("status_text")
                if (isWatching) {
                    text?.text = "MAYRA is watching"
                    (view.background as? GradientDrawable)?.setStroke(3, Color.parseColor("#F43F5E"))
                } else if (suspended) {
                    text?.text = "Camera Paused (Screen Lock)"
                    (view.background as? GradientDrawable)?.setStroke(3, Color.parseColor("#F59E0B"))
                } else {
                    text?.text = "MAYRA Vision Idle"
                    (view.background as? GradientDrawable)?.setStroke(3, Color.parseColor("#38BDF8"))
                }
            }
        }
    }

    // Camera Tracking Pipeline
    private fun startCameraTracking() {
        if (isCameraActive) return

        try {
            val cameraIdList = cameraManager?.cameraIdList ?: return
            val frontCameraId = cameraIdList.firstOrNull { id ->
                val chars = cameraManager?.getCameraCharacteristics(id)
                chars?.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_FRONT
            } ?: cameraIdList.firstOrNull() ?: return

            cameraManager?.openCamera(frontCameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    cameraDevice = camera
                    isCameraActive = true
                    Log.d(TAG, "Background gesture front camera successfully opened")
                    updateOverlayIndicatorUI(isWatching = true, suspended = false)
                    updateForegroundNotification(isWatching = true, suspended = false)
                }

                override fun onDisconnected(camera: CameraDevice) {
                    camera.close()
                    cameraDevice = null
                    isCameraActive = false
                }

                override fun onError(camera: CameraDevice, error: Int) {
                    camera.close()
                    cameraDevice = null
                    isCameraActive = false
                    Log.e(TAG, "Camera error code: $error")
                }
            }, mainHandler)

        } catch (e: SecurityException) {
            Log.e(TAG, "Camera permission missing: ${e.message}")
        } catch (e: CameraAccessException) {
            Log.e(TAG, "Camera access failed: ${e.message}")
        }
    }

    private fun stopCameraTracking(reason: String) {
        Log.d(TAG, "Stopping camera tracking. Reason: $reason")
        try {
            captureSession?.close()
            captureSession = null
            cameraDevice?.close()
            cameraDevice = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing camera: ${e.message}")
        } finally {
            isCameraActive = false
        }
    }

    private fun triggerVoiceAssistant() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("EXTRA_TRIGGER_VOICE", true)
        }
        startActivity(intent)
    }

    /**
     * Dispatch system-wide touch events via MayraGestureAccessibilityService
     */
    fun dispatchSystemTap(x: Float, y: Float) {
        if (MayraGestureAccessibilityService.isServiceRunning()) {
            MayraGestureAccessibilityService.performTap(x, y)
        } else {
            Log.w(TAG, "MayraGestureAccessibilityService is not enabled by user in Settings > Accessibility")
        }
    }

    fun dispatchSystemScrollUp(x: Float, y: Float) {
        if (MayraGestureAccessibilityService.isServiceRunning()) {
            MayraGestureAccessibilityService.performScrollUp(x, y)
        } else {
            Log.w(TAG, "MayraGestureAccessibilityService is not enabled by user in Settings > Accessibility")
        }
    }

    fun dispatchSystemLongPress(x: Float, y: Float) {
        if (MayraGestureAccessibilityService.isServiceRunning()) {
            MayraGestureAccessibilityService.performLongPress(x, y)
        } else {
            Log.w(TAG, "MayraGestureAccessibilityService is not enabled by user in Settings > Accessibility")
        }
    }

    private fun openMayraApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        startActivity(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MAYRA Background Gesture Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Runs the floating gesture bubble and camera indicator"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "MayraBackgroundGestureOverlayService destroyed")
        try {
            unregisterReceiver(screenEventReceiver)
        } catch (e: Exception) {
            // ignore
        }

        stopCameraTracking("SERVICE_DESTROYED")

        floatingBubbleView?.let { windowManager?.removeView(it) }
        persistentIndicatorView?.let { windowManager?.removeView(it) }

        isOverlayRunning = false
        isCameraActive = false
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
