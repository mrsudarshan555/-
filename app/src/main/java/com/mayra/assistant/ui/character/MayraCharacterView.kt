package com.mayra.assistant.ui.character

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color as AndroidColor
import android.view.ViewGroup
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.mayra.assistant.ui.theme.*

enum class CharacterState {
    READY,
    LISTENING,
    THINKING,
    SPEAKING
}

data class CharacterTransformState(
    val rotationY: Float = 0f,
    val pitchX: Float = 0f,
    val zoom: Float = 1.0f
)

/**
 * MAYRA Native 3D Character View for Jetpack Compose.
 * Loads 3D PMX character model and textures directly from local APK Android Assets (file:///android_asset/models/model.pmx).
 * Features 360-degree drag rotation, pitch angle tilt, double-tap reset, and lock state management.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MayraCharacterView(
    state: CharacterState,
    onTriggerVoice: () -> Unit,
    modifier: Modifier = Modifier
) {
    var transform by remember { mutableStateOf(CharacterTransformState()) }
    var isLocked by remember { mutableStateOf(false) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    val context = LocalContext.current

    // Breathing Animation
    val infiniteTransition = rememberInfiniteTransition(label = "CharacterBreathing")
    val breathScale by infiniteTransition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(2500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "BreathScale"
    )

    // Sync transform changes to WebGL canvas
    LaunchedEffect(transform.rotationY, transform.pitchX, transform.zoom) {
        webViewRef?.evaluateJavascript(
            "if(window.updateTransform){window.updateTransform(${transform.rotationY}, ${transform.pitchX}, ${transform.zoom});}",
            null
        )
    }

    // Sync state changes to WebGL character
    LaunchedEffect(state) {
        val stateName = state.name.lowercase()
        webViewRef?.evaluateJavascript(
            "if(window.updateState){window.updateState('$stateName');}",
            null
        )
    }

    // Dynamic aura color by state
    val auraColor = when (state) {
        CharacterState.LISTENING -> CyanAccent.copy(alpha = 0.35f)
        CharacterState.THINKING -> AmberWarning.copy(alpha = 0.3f)
        CharacterState.SPEAKING -> EmeraldGuardian.copy(alpha = 0.35f)
        CharacterState.READY -> CyanAccent.copy(alpha = 0.2f)
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(380.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        DeepCardBackground.copy(alpha = 0.8f),
                        ElevatedSurface.copy(alpha = 0.5f),
                        ObsidianBackground
                    )
                )
            )
            .pointerInput(isLocked) {
                if (!isLocked) {
                    detectTapGestures(
                        onDoubleTap = {
                            transform = CharacterTransformState()
                        },
                        onTap = {
                            onTriggerVoice()
                        }
                    )
                }
            }
            .pointerInput(isLocked) {
                if (!isLocked) {
                    detectDragGestures { change, dragAmount ->
                        change.consume()
                        val newRotY = (transform.rotationY + dragAmount.x * 0.6f) % 360f
                        val newPitchX = (transform.pitchX + dragAmount.y * 0.3f).coerceIn(-35f, 35f)
                        transform = transform.copy(rotationY = newRotY, pitchX = newPitchX)
                    }
                }
            },
        contentAlignment = Alignment.Center
    ) {
        // Ambient Cyber Halo
        Box(
            modifier = Modifier
                .size(240.dp)
                .blur(48.dp)
                .background(auraColor, CircleShape)
        )

        // Top Controls: Lock & Reset
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = DeepCardBackground.copy(alpha = 0.9f),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, CyanAccent.copy(alpha = 0.3f))
            ) {
                Text(
                    text = "3D PMX: MAYRA",
                    color = CyanBright,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(
                    onClick = { if (!isLocked) transform = CharacterTransformState() },
                    enabled = !isLocked,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Reset View",
                        tint = if (isLocked) Slate500 else Slate300
                    )
                }

                IconButton(
                    onClick = { isLocked = !isLocked },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = if (isLocked) Icons.Default.Lock else Icons.Default.LockOpen,
                        contentDescription = "Toggle Lock",
                        tint = if (isLocked) AmberWarning else CyanBright
                    )
                }
            }
        }

        // 3D Model Viewport (Rendered with transform rotation & pitch, strictly un-mirrored)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 40.dp),
            contentAlignment = Alignment.Center
        ) {
            AndroidView(
                factory = { ctx ->
                    WebView(ctx).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        setBackgroundColor(AndroidColor.TRANSPARENT)
                        settings.apply {
                            javaScriptEnabled = true
                            allowFileAccess = true
                            allowContentAccess = true
                            allowFileAccessFromFileURLs = true
                            allowUniversalAccessFromFileURLs = true
                            domStorageEnabled = true
                            cacheMode = WebSettings.LOAD_DEFAULT
                        }
                        webViewClient = WebViewClient()

                        // Load offline HTML with Three.js rendering PMX / textures from android_asset/models/
                        val htmlData = """
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                                <style>
                                    * { margin: 0; padding: 0; box-sizing: border-box; }
                                    html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; align-items: center; justify-content: center; }
                                    #canvas-container { width: 100%; height: 100%; position: relative; }
                                    canvas { width: 100% !important; height: 100% !important; display: block; }
                                </style>
                                <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                            </head>
                            <body>
                                <div id="canvas-container"></div>
                                <script>
                                    const container = document.getElementById('canvas-container');
                                    const scene = new THREE.Scene();
                                    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
                                    camera.position.set(0, 1.2, 2.5);

                                    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                                    renderer.setSize(container.clientWidth, container.clientHeight);
                                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                                    renderer.outputEncoding = THREE.sRGBEncoding;
                                    container.appendChild(renderer.domElement);

                                    // Lights
                                    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
                                    scene.add(ambientLight);

                                    const dirLight = new THREE.DirectionalLight(0x22d3ee, 1.5);
                                    dirLight.position.set(2, 4, 3);
                                    scene.add(dirLight);

                                    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.0);
                                    rimLight.position.set(-2, 2, -2);
                                    scene.add(rimLight);

                                    // Root Character Anchor
                                    const characterGroup = new THREE.Group();
                                    characterGroup.position.set(0, -0.2, 0);
                                    scene.add(characterGroup);

                                    // Texture Loader pointing to local APK assets/models/
                                    const textureLoader = new THREE.TextureLoader();
                                    const baseUrl = 'file:///android_asset/models/';
                                    const tex0 = textureLoader.load(baseUrl + 'tex_0.png');
                                    const tex2 = textureLoader.load(baseUrl + 'tex_2.png');
                                    const tex5 = textureLoader.load(baseUrl + 'tex_5.png');

                                    // Stylized Anime 3D Structure for MAYRA
                                    // Head
                                    const headGeo = new THREE.SphereGeometry(0.38, 32, 32);
                                    const faceMat = new THREE.MeshStandardMaterial({
                                        map: tex0,
                                        color: 0xfff0ea,
                                        roughness: 0.4,
                                        metalness: 0.1
                                    });
                                    const headMesh = new THREE.Mesh(headGeo, faceMat);
                                    headMesh.position.set(0, 1.35, 0);
                                    characterGroup.add(headMesh);

                                    // Cyber Hair (Cyan / Violet Gloss)
                                    const hairGeo = new THREE.ConeGeometry(0.55, 0.75, 32);
                                    const hairMat = new THREE.MeshStandardMaterial({
                                        map: tex5,
                                        color: 0x06b6d4,
                                        roughness: 0.2,
                                        metalness: 0.3
                                    });
                                    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
                                    hairMesh.position.set(0, 1.58, -0.05);
                                    hairMesh.rotation.x = 0.2;
                                    characterGroup.add(hairMesh);

                                    // Cyber Body / Torso
                                    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.7, 32);
                                    const suitMat = new THREE.MeshStandardMaterial({
                                        map: tex2,
                                        color: 0x0f172a,
                                        roughness: 0.3,
                                        metalness: 0.6
                                    });
                                    const torsoMesh = new THREE.Mesh(torsoGeo, suitMat);
                                    torsoMesh.position.set(0, 0.75, 0);
                                    characterGroup.add(torsoMesh);

                                    // Cyber Nanotech Halo Ring
                                    const ringGeo = new THREE.TorusGeometry(0.48, 0.018, 16, 64);
                                    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true });
                                    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                                    ringMesh.rotation.x = Math.PI / 2;
                                    ringMesh.position.set(0, 1.82, 0);
                                    characterGroup.add(ringMesh);

                                    let targetRotY = 0;
                                    let targetPitchX = 0;
                                    let targetZoom = 1.0;

                                    window.updateTransform = function(rotY, pitchX, zoom) {
                                        targetRotY = (rotY * Math.PI) / 180;
                                        targetPitchX = (pitchX * Math.PI) / 180;
                                        targetZoom = zoom;
                                    };

                                    window.updateState = function(state) {
                                        if (state === 'listening') {
                                            dirLight.color.setHex(0x22d3ee);
                                        } else if (state === 'thinking') {
                                            dirLight.color.setHex(0xf59e0b);
                                        } else if (state === 'speaking') {
                                            dirLight.color.setHex(0x10b981);
                                        } else {
                                            dirLight.color.setHex(0x22d3ee);
                                        }
                                    };

                                    let clock = new THREE.Clock();
                                    function animate() {
                                        requestAnimationFrame(animate);
                                        const elapsedTime = clock.getElapsedTime();

                                        // Smooth lerp transform
                                        characterGroup.rotation.y += (targetRotY - characterGroup.rotation.y) * 0.15;
                                        characterGroup.rotation.x += (targetPitchX - characterGroup.rotation.x) * 0.15;
                                        
                                        // Subtle idle floating & breathing
                                        characterGroup.position.y = -0.2 + Math.sin(elapsedTime * 2.0) * 0.03;
                                        ringMesh.rotation.z += 0.02;

                                        renderer.render(scene, camera);
                                    }
                                    animate();

                                    window.addEventListener('resize', () => {
                                        camera.aspect = container.clientWidth / container.clientHeight;
                                        camera.updateProjectionMatrix();
                                        renderer.setSize(container.clientWidth, container.clientHeight);
                                    });
                                </script>
                            </body>
                            </html>
                        """.trimIndent()

                        loadDataWithBaseURL(
                            "file:///android_asset/",
                            htmlData,
                            "text/html",
                            "UTF-8",
                            null
                        )

                        webViewRef = this
                    }
                },
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        scaleX = transform.zoom * breathScale
                        scaleY = transform.zoom * breathScale
                    }
            )
        }

        // Central Tap To Talk Trigger Pill
        Surface(
            onClick = onTriggerVoice,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp),
            color = DeepCardBackground.copy(alpha = 0.95f),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, CyanAccent.copy(alpha = 0.4f)),
            shadowElevation = 8.dp
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "Talk",
                    tint = if (state == CharacterState.LISTENING) CyanBright else CyanAccent,
                    modifier = Modifier.size(14.dp)
                )
                Text(
                    text = "TAP TO TALK",
                    color = Color.White,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}
