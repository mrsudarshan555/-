package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.*

data class IntegrationModel(val id: String, val name: String, val desc: String, val isConnected: Boolean)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OptionalIntegrationsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var integrations by remember {
        mutableStateOf(
            listOf(
                IntegrationModel("1", "Google Workspace", "Calendar, Gmail, Drive & Contacts sync", true),
                IntegrationModel("2", "Spotify Music", "Playback controls and playlist recommendations", false),
                IntegrationModel("3", "WhatsApp Web Bridge", "Send & receive messages via background bridge", true),
                IntegrationModel("4", "Home Assistant / Smart Home", "IoT lights, thermostats & switches control", false)
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Third-Party Integrations",
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
            items(integrations, key = { it.id }) { item ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                            Text(item.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(item.desc, color = Slate400, fontSize = 11.sp)
                        }
                        if (item.isConnected) {
                            TextButton(onClick = {
                                integrations = integrations.map { if (it.id == item.id) it.copy(isConnected = false) else it }
                            }) {
                                Text("Connected", color = EmeraldGuardian, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Button(
                                onClick = {
                                    integrations = integrations.map { if (it.id == item.id) it.copy(isConnected = true) else it }
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = CyanAccent)
                            ) {
                                Text("Connect", color = Color.White, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
