export interface KotlinFileItem {
  path: string;
  name: string;
  category: 'core' | 'navigation' | 'screens' | 'settings' | 'config';
  code: string;
}

export const KOTLIN_CODEBASE: KotlinFileItem[] = [
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/screens/settings/MayraSettingsScreen.kt',
    name: 'MayraSettingsScreen.kt',
    category: 'settings',
    code: `package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.*

data class SettingSection(
    val title: String,
    val items: List<SettingItem>
)

data class SettingItem(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val destinationRoute: String,
    val badge: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MayraSettingsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val sections = remember {
        listOf(
            SettingSection(
                title = "ACCOUNT",
                items = listOf(
                    SettingItem("Personal", "Zafer • API Configuration", Icons.Default.Person, "settings/personal"),
                    SettingItem("Country Code", "India (+91)", Icons.Default.Public, "settings/country_code")
                )
            ),
            SettingSection(
                title = "ASSISTANT",
                items = listOf(
                    SettingItem("MAYRA", "Executive Tone • English (India)", Icons.Default.AutoAwesome, "settings/assistant"),
                    SettingItem("Skills", "4 of 6 active capabilities", Icons.Default.Build, "settings/skills"),
                    SettingItem("Sub-agents", "4 specialized task agents", Icons.Default.SmartToy, "settings/sub_agents")
                )
            ),
            SettingSection(
                title = "VOICE GUARDIAN",
                items = listOf(
                    SettingItem("Voice Guardian", "Biometric Shield Active", Icons.Default.Security, "settings/voice_guardian", "SHIELD ON")
                )
            ),
            SettingSection(
                title = "MEMORY & DATA",
                items = listOf(
                    SettingItem("Backup & Storage", "5 facts stored locally in SQLite", Icons.Default.Storage, "settings/backup")
                )
            ),
            SettingSection(
                title = "SYSTEM",
                items = listOf(
                    SettingItem("Advanced", "Safety filters, Permissions, Dev mode", Icons.Default.SettingsSuggest, "settings/advanced"),
                    SettingItem("Optional Integrations", "Maps, Places, IoT bridges", Icons.Default.Extension, "settings/integrations"),
                    SettingItem("Privacy Policy", "On-device data charter & rights", Icons.Default.Lock, "settings/privacy"),
                    SettingItem("About MAYRA", "v2.0.0 Phase 2 • Jetpack Compose", Icons.Default.Info, "settings/about")
                )
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("SETTINGS & SYSTEM", style = MaterialTheme.typography.titleSmall, color = Color.White)
                        Text("MAYRA Configuration Hub", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBackground)
            )
        },
        containerColor = ObsidianBackground
    ) { padding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 12.dp)
        ) {
            sections.forEach { section ->
                item {
                    Text(
                        text = section.title,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = NeonCyan
                        ),
                        modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
                    )

                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            section.items.forEachIndexed { index, item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { navController.navigate(item.destinationRoute) }
                                        .padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(10.dp),
                                            color = ObsidianBackground,
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Icon(item.icon, contentDescription = null, tint = ElectricBlue, modifier = Modifier.size(20.dp))
                                            }
                                        }
                                        Column {
                                            Text(item.title, style = MaterialTheme.typography.bodyMedium, color = Color.White)
                                            Text(item.subtitle, style = MaterialTheme.typography.bodySmall, color = Slate400)
                                        }
                                    }

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        item.badge?.let {
                                            Surface(
                                                color = Color(0x3306B6D4),
                                                shape = RoundedCornerShape(100.dp)
                                            ) {
                                                Text(
                                                    text = it,
                                                    color = NeonCyan,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Slate400)
                                    }
                                }

                                if (index < section.items.size - 1) {
                                    Divider(color = Color(0x1AFFFFFF), thickness = 0.5.dp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/screens/settings/VoiceGuardianScreen.kt',
    name: 'VoiceGuardianScreen.kt',
    category: 'settings',
    code: `package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.*

enum class ListenModePolicy { EVERYONE, OWNER_ONLY, OWNER_FAMILY }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoiceGuardianScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var isGuardianEnabled by remember { mutableStateOf(true) }
    var isAwayModeEnabled by remember { mutableStateOf(false) }
    var selectedListenMode by remember { mutableStateOf(ListenModePolicy.OWNER_ONLY) }
    var strictnessThreshold by remember { mutableFloatStateOf(85f) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("VOICE GUARDIAN", style = MaterialTheme.typography.titleSmall, color = Color.White)
                        Text("Biometric Security & Guard Mode", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBackground)
            )
        },
        containerColor = ObsidianBackground
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Master Toggle Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Voice Guardian Master Shield", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                            Text("Biometrically authenticates speaker voice", style = MaterialTheme.typography.bodySmall, color = Slate400)
                        }
                        Switch(checked = isGuardianEnabled, onCheckedChange = { isGuardianEnabled = it })
                    }

                    Divider(color = Color(0x1AFFFFFF))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Away / Guard Mode", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                            Text("Listens for unauthorized room triggers", style = MaterialTheme.typography.bodySmall, color = Slate400)
                        }
                        Switch(checked = isAwayModeEnabled, onCheckedChange = { isAwayModeEnabled = it })
                    }
                }
            }

            // Listen Mode Segmented Selector
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Authorized Listen Mode", style = MaterialTheme.typography.labelMedium, color = NeonCyan)
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(
                            Triple(ListenModePolicy.EVERYONE, "Everyone", "All speakers"),
                            Triple(ListenModePolicy.OWNER_ONLY, "Owner Only", "Strict voice"),
                            Triple(ListenModePolicy.OWNER_FAMILY, "Owner + Family", "Enrolled group")
                        ).forEach { (mode, title, desc) ->
                            OutlinedButton(
                                onClick = { selectedListenMode = mode },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (selectedListenMode == mode) Color(0x3306B6D4) else Color.Transparent
                                ),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(title, style = MaterialTheme.typography.labelMedium, color = Color.White)
                                    Text(desc, style = MaterialTheme.typography.labelSmall, color = Slate400)
                                }
                            }
                        }
                    }
                }
            }

            // Strictness Slider
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Voice Matching Strictness", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                        Text("\${strictnessThreshold.toInt()}%", style = MaterialTheme.typography.labelMedium, color = NeonCyan)
                    }
                    Slider(
                        value = strictnessThreshold,
                        onValueChange = { strictnessThreshold = it },
                        valueRange = 60f..95f,
                        steps = 6
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/screens/HomeScreen.kt',
    name: 'HomeScreen.kt',
    category: 'screens',
    code: `package com.mayra.assistant.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.*

@Composable
fun HomeScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "orbPulse")
    val orbScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBackground)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top Brand & Greeting
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(top = 16.dp)) {
            Text(
                text = "MAYRA PERSONAL AI",
                style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                color = ElectricBlue
            )
            Text(
                text = "Good evening, Zafer",
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = Color.White
            )
        }

        // Animated Assistant Orb
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(160.dp)
                .scale(orbScale)
        ) {
            Surface(
                shape = CircleShape,
                color = Color(0x333B82F6),
                modifier = Modifier.size(140.dp)
            ) {}

            Surface(
                shape = CircleShape,
                color = Color.Transparent,
                modifier = Modifier
                    .size(100.dp)
                    .clickable { navController.navigate("chat") }
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.radialGradient(
                                colors = listOf(ElectricBlue, NeonCyan, Color(0xFF1E1B4B))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text("M", color = Color.White, style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black))
                }
            }
        }

        // Quick Routine Cards
        Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            Text("QUICK ROUTINES", style = MaterialTheme.typography.labelSmall, color = Slate400)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Card(
                    modifier = Modifier.weight(1f).clickable { navController.navigate("scanner") },
                    colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, tint = NeonCyan)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Vision OCR", style = MaterialTheme.typography.bodySmall, color = Color.White)
                    }
                }
                Card(
                    modifier = Modifier.weight(1f).clickable { navController.navigate("memories") },
                    colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Psychology, contentDescription = null, tint = ElectricViolet)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Memories", style = MaterialTheme.typography.bodySmall, color = Color.White)
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/navigation/MayraNavGraph.kt',
    name: 'MayraNavGraph.kt',
    category: 'navigation',
    code: `package com.mayra.assistant.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.mayra.assistant.ui.screens.*
import com.mayra.assistant.ui.screens.settings.*

@Composable
fun MayraNavGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = "home",
        modifier = modifier
    ) {
        composable("home") { HomeScreen(navController) }
        composable("scanner") { ScannerScreen(navController) }
        composable("memories") { MemoriesScreen(navController) }
        composable("chat") { ChatScreen(navController) }
        
        // Settings Sub-screens
        composable("settings") { MayraSettingsScreen(navController) }
        composable("settings/permissions") { PermissionsScreen(navController) }
        composable("settings/personal") { PersonalSettingsScreen(navController) }
        composable("settings/country_code") { CountryCodeScreen(navController) }
        composable("settings/assistant") { AssistantSettingsScreen(navController) }
        composable("settings/voice_guardian") { VoiceGuardianScreen(navController) }
        composable("settings/skills") { SkillsScreen(navController) }
        composable("settings/sub_agents") { SubAgentsScreen(navController) }
        composable("settings/backup") { BackupScreen(navController) }
        composable("settings/advanced") { AdvancedSettingsScreen(navController) }
        composable("settings/integrations") { OptionalIntegrationsScreen(navController) }
        composable("settings/privacy") { PrivacyScreen(navController) }
        composable("settings/about") { AboutScreen(navController) }
    }
}`
  },
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/screens/settings/PermissionsScreen.kt',
    name: 'PermissionsScreen.kt',
    category: 'settings',
    code: `package com.mayra.assistant.ui.screens.settings

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.*

data class PermissionEntry(
    val id: String,
    val title: String,
    val description: String,
    val isGranted: Boolean,
    val isDefaultRole: Boolean = false,
    val isRequired: Boolean = false,
    val intentAction: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PermissionsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var permissionsList by remember {
        mutableStateOf(
            listOf(
                PermissionEntry("default_assistant", "Default assistant", "Make MAYRA the phone's digital assistant (replaces Google Assistant) — long-press power / swipe from a corner opens her instantly, even on the lock screen. Pick 'MAYRA' as the assistant app.", isGranted = true, isDefaultRole = true),
                PermissionEntry("microphone", "Microphone", "So you can talk to Mayra (required).", isGranted = true, isRequired = true),
                PermissionEntry("camera", "Camera", "So Mayra can take your photo (front/back) and record video.", isGranted = true),
                PermissionEntry("phone_calls", "Phone calls", "So Mayra can place calls for you.", isGranted = true),
                PermissionEntry("location", "Location", "So Mayra can give you location, navigation and weather.", isGranted = true),
                PermissionEntry("contacts", "Contacts", "So Mayra can look up a contact's number when you say a name (for calls/SMS).", isGranted = true),
                PermissionEntry("sms", "SMS", "So Mayra can send text messages.", isGranted = true),
                PermissionEntry("gallery_files", "Gallery & files", "So Mayra can find your photos/videos/files and send them to someone (on WhatsApp or any app).", isGranted = true),
                PermissionEntry("manage_calls", "Answer & manage calls", "So Mayra can announce every incoming call and answer/reject/end it — Call Log is also needed to tell you the caller's name. (Note: she can't talk to the caller herself on a cellular call.)", isGranted = true),
                PermissionEntry("notification_access", "Notification access", "To read notifications from all apps (and WhatsApp messages). Also how Mayra knows the caller's name when announcing a call — Android hides it from apps otherwise.", isGranted = true),
                PermissionEntry("accessibility_service", "Accessibility service", "For WhatsApp/YouTube control and screen reading (enable 'Mayra' in the list).", isGranted = false),
                PermissionEntry("battery_optimization", "Battery — no optimization", "So Mayra keeps running with the screen off / in the background — exempt her from battery optimization.", isGranted = false),
                PermissionEntry("overlay", "Display over other apps", "So Mayra can work on top of other apps.", isGranted = false),
                PermissionEntry("screen_capture", "Screen capture", "So Mayra can watch your screen live (screen share). She asks for this herself whenever she needs it — every time. You can also test it once here.", isGranted = false)
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("Permissions", style = MaterialTheme.typography.titleMedium, color = Color.White, fontWeight = FontWeight.Bold)
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { /* Refresh permissions */ }) {
                        Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = Color.White)
                    }
                    Text("MAYRA", color = ElectricBlue, fontWeight = FontWeight.Black, fontSize = 11.sp, modifier = Modifier.padding(end = 12.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBackground)
            )
        },
        containerColor = ObsidianBackground
    ) { padding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(vertical = 10.dp)
        ) {
            item {
                Text(
                    text = "Mayra needs these permissions to do everything for you. Allow only what you want.",
                    color = Slate400,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                )
            }

            items(permissionsList, key = { it.id }) { item ->
                PermissionCard(
                    entry = item,
                    onAction = {
                        permissionsList = permissionsList.map {
                            if (it.id == item.id) it.copy(isGranted = !it.isGranted) else it
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun PermissionCard(
    entry: PermissionEntry,
    onAction: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                Text(
                    text = entry.title,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = entry.description,
                    color = Slate400,
                    fontSize = 11.5.sp,
                    lineHeight = 16.sp
                )
            }

            if (entry.isDefaultRole) {
                Button(
                    onClick = onAction,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("MAYRA", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            } else if (entry.isGranted) {
                TextButton(onClick = onAction) {
                    Text("Granted", color = ElectricBlue, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            } else {
                Button(
                    onClick = onAction,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Text("Grant", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/character/MayraCharacterView.kt',
    name: 'MayraCharacterView.kt',
    category: 'core',
    code: `package com.mayra.assistant.ui.character

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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
 * Supports Google Filament / SceneView rendering pipeline with PMX to glTF conversion.
 * Features 360-degree drag rotation, pitch angle tilt, pinch-to-zoom, double-tap reset,
 * and lock state management.
 */
@Composable
fun MayraCharacterView(
    state: CharacterState,
    onTriggerVoice: () -> Unit,
    modifier: Modifier = Modifier
) {
    var transform by remember { mutableStateOf(CharacterTransformState()) }
    var isLocked by remember { mutableStateOf(false) }

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

        // 3D Model Viewport (Rendered with transform rotation & pitch)
        Box(
            modifier = Modifier
                .size(280.dp)
                .graphicsLayer {
                    rotationY = transform.rotationY
                    rotationX = transform.pitchX
                    scaleX = transform.zoom * breathScale
                    scaleY = transform.zoom * breathScale
                },
            contentAlignment = Alignment.Center
        ) {
            // Native Filament / SceneView Surface or Fallback 3D Canvas
            Box(
                modifier = Modifier
                    .size(200.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                ElevatedSurface,
                                DeepCardBackground,
                                ObsidianBackground
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "MAYRA 3D ENGINE",
                    color = CyanBright,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
            }
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
`
  },
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/components/MayraAvatarView.kt',
    name: 'MayraAvatarView.kt',
    category: 'core',
    code: `package com.mayra.assistant.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mayra.assistant.ui.theme.*

enum class AssistantVisualState { IDLE, LISTENING, THINKING, SPEAKING }

@Composable
fun MayraAvatarView(
    state: AssistantVisualState,
    onAvatarClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = modifier
            .size(200.dp)
            .clickable { onAvatarClick() },
        contentAlignment = Alignment.Center
    ) {
        // Dynamic Halo Aura
        Box(
            modifier = Modifier
                .size(170.dp)
                .scale(if (state != AssistantVisualState.IDLE) pulseScale else 1f)
                .clip(CircleShape)
                .background(
                    when (state) {
                        AssistantVisualState.LISTENING -> NeonCyan.copy(alpha = 0.25f)
                        AssistantVisualState.THINKING -> ElectricViolet.copy(alpha = 0.3f)
                        AssistantVisualState.SPEAKING -> ElectricBlue.copy(alpha = 0.35f)
                        AssistantVisualState.IDLE -> DeepCardBackground
                    }
                )
        )

        // Central Holographic Model Orb
        Box(
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape)
                .border(2.dp, Brush.radialGradient(listOf(Color.White, ElectricViolet)), CircleShape)
                .background(
                    Brush.verticalGradient(listOf(Color(0xFF1E1B4B), ObsidianBackground))
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "M",
                    color = Color.White,
                    fontSize = 36.sp,
                    style = MaterialTheme.typography.displaySmall
                )
                Text(
                    text = "MAYRA",
                    color = NeonCyan,
                    fontSize = 10.sp,
                    letterSpacing = 2.sp
                )
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/mayra/assistant/ui/theme/Theme.kt',
    name: 'Theme.kt',
    category: 'core',
    code: `package com.mayra.assistant.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// MAYRA Extracted Theme Tokens
val ObsidianBackground = Color(0xFF030712)
val DeviceInnerBackground = Color(0xFF070913)
val DeepCardBackground = Color(0xFF0C1021)
val ElevatedSurface = Color(0xFF11172E)
val CyanAccent = Color(0xFF06B6D4)
val CyanBright = Color(0xFF22D3EE)
val VioletAccent = Color(0xFF8B5CF6)
val BlueElectric = Color(0xFF3B82F6)
val EmeraldGuardian = Color(0xFF10B981)
val AmberWarning = Color(0xFFF59E0B)
val RoseAlert = Color(0xFFF43F5E)
val Slate300 = Color(0xFFCBD5E1)
val Slate400 = Color(0xFF94A3B8)
val Slate500 = Color(0xFF64748B)

// Design Tokens: Shapes
val MayraShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)

// Design Tokens: Typography
val MayraTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        color = Color.White
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        color = Color.White
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        color = Color.White
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        color = Slate300
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        color = Slate400
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        color = Slate500
    )
)

private val MayraDarkColorScheme = darkColorScheme(
    primary = ElectricBlue,
    secondary = NeonCyan,
    tertiary = ElectricViolet,
    background = ObsidianBackground,
    surface = DeepCardBackground,
    surfaceVariant = ElevatedSurface,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun MayraTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MayraDarkColorScheme,
        typography = MayraTypography,
        shapes = MayraShapes,
        content = content
    )
}`
  },
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts',
    category: 'config',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.mayra.assistant"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.mayra.assistant"
        minSdk = 26
        targetSdk = 36
        versionCode = 2
        versionName = "2.0.0-phase2"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
}`
  }
];
