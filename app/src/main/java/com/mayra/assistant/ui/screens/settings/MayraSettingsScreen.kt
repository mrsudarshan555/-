package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.*

data class SettingsCategory(
    val title: String,
    val route: String,
    val icon: ImageVector,
    val description: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MayraSettingsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val settingsItems = listOf(
        SettingsCategory("Permissions Center", "settings/permissions", Icons.Default.Security, "Manage system permissions & service access"),
        SettingsCategory("Personal Profile", "settings/personal", Icons.Default.Person, "Name, identity, and personal preferences"),
        SettingsCategory("Country Code & Region", "settings/country_code", Icons.Default.Public, "Telecom, phone dialer & regional formats"),
        SettingsCategory("Assistant Engine", "settings/assistant", Icons.Default.Psychology, "AI Model personality, speed and prompt templates"),
        SettingsCategory("Voice Guardian", "settings/voice_guardian", Icons.Default.Mic, "Biometric voice match & enrollments"),
        SettingsCategory("Skills Engine", "settings/skills", Icons.Default.Extension, "System tools, integrations & automation hooks"),
        SettingsCategory("Sub-Agents Team", "settings/sub_agents", Icons.Default.Group, "Specialized agents for coding, math & research"),
        SettingsCategory("Backup & Restore", "settings/backup", Icons.Default.Backup, "Export or restore memory vaults and settings"),
        SettingsCategory("Advanced Developer", "settings/advanced", Icons.Default.Terminal, "LLM temperature, debug logs & API tokens"),
        SettingsCategory("Third-Party Integrations", "settings/integrations", Icons.Default.Hub, "Connect Google Workspace, Spotify & cloud accounts"),
        SettingsCategory("Privacy & Safety", "settings/privacy", Icons.Default.Lock, "Local processing preferences & data retention"),
        SettingsCategory("About MAYRA", "settings/about", Icons.Default.Info, "Version info, licenses, and architecture docs")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "MAYRA Settings",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
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
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(settingsItems.size) { index ->
                val item = settingsItems[index]
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { navController.navigate(item.route) }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Surface(
                                color = ElevatedSurface,
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.size(38.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        item.icon,
                                        contentDescription = null,
                                        tint = CyanBright,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }

                            Column {
                                Text(
                                    text = item.title,
                                    color = Color.White,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = item.description,
                                    color = Slate400,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = "Navigate",
                            tint = Slate500,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}
