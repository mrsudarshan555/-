package com.mayra.assistant.ui.screens.settings

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
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
    var permissionsList by remember {
        mutableStateOf(
            listOf(
                PermissionEntry("default_assistant", "Default assistant", "Make MAYRA the phone's digital assistant (replaces Google Assistant) — long-press power / swipe from a corner opens her instantly, even on the lock screen.", isGranted = true, isDefaultRole = true),
                PermissionEntry("microphone", "Microphone", "So you can talk to Mayra (required).", isGranted = true, isRequired = true),
                PermissionEntry("camera", "Camera", "So Mayra can take your photo (front/back) and record video.", isGranted = true),
                PermissionEntry("phone_calls", "Phone calls", "So Mayra can place calls for you.", isGranted = true),
                PermissionEntry("location", "Location", "So Mayra can give you location, navigation and weather.", isGranted = true),
                PermissionEntry("contacts", "Contacts", "So Mayra can look up a contact's number when you say a name (for calls/SMS).", isGranted = true),
                PermissionEntry("sms", "SMS", "So Mayra can send text messages.", isGranted = true),
                PermissionEntry("gallery_files", "Gallery & files", "So Mayra can find your photos/videos/files and send them to someone (on WhatsApp or any app).", isGranted = true),
                PermissionEntry("manage_calls", "Answer & manage calls", "So Mayra can announce every incoming call and answer/reject/end it.", isGranted = true),
                PermissionEntry("notification_access", "Notification access", "To read notifications from all apps (and WhatsApp messages).", isGranted = true),
                PermissionEntry("accessibility_service", "Accessibility service", "For WhatsApp/YouTube control and screen reading.", isGranted = false),
                PermissionEntry("battery_optimization", "Battery — no optimization", "So Mayra keeps running with the screen off / in the background.", isGranted = false),
                PermissionEntry("overlay", "Display over other apps", "So Mayra can work on top of other apps.", isGranted = false),
                PermissionEntry("screen_capture", "Screen capture", "So Mayra can watch your screen live (screen share).", isGranted = false)
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Permissions Center",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                actions = {
                    Text(
                        "MAYRA",
                        color = NeonCyan,
                        fontWeight = FontWeight.Black,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(end = 12.dp)
                    )
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
            Column(modifier = Modifier.weight(1f).padding(end = 10.dp)) {
                Text(
                    text = entry.title,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = entry.description,
                    color = Slate400,
                    fontSize = 11.sp,
                    lineHeight = 15.sp
                )
            }

            if (entry.isDefaultRole) {
                Button(
                    onClick = onAction,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("MAYRA", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                }
            } else if (entry.isGranted) {
                TextButton(onClick = onAction) {
                    Text("Granted", color = EmeraldGuardian, fontWeight = FontWeight.SemiBold, fontSize = 11.sp)
                }
            } else {
                Button(
                    onClick = onAction,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ElectricBlue),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text("Grant", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 11.sp)
                }
            }
        }
    }
}
