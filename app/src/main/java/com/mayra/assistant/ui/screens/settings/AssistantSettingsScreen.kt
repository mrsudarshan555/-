package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.layout.*
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssistantSettingsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var selectedModel by remember { mutableStateOf("gemini-2.5-flash") }
    var autoSpeak by remember { mutableStateOf(true) }
    var proactiveSuggestions by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Assistant Engine",
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
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Neural Model & Intelligence", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("Select the engine driving MAYRA's responses.", color = Slate400, fontSize = 11.sp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Voice Auto-Speak", color = Color.White, fontSize = 13.sp)
                        Switch(
                            checked = autoSpeak,
                            onCheckedChange = { autoSpeak = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = CyanAccent)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Proactive Suggestions", color = Color.White, fontSize = 13.sp)
                        Switch(
                            checked = proactiveSuggestions,
                            onCheckedChange = { proactiveSuggestions = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = CyanAccent)
                        )
                    }
                }
            }
        }
    }
}
