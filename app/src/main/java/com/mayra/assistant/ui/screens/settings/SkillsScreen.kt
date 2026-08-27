package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Extension
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

data class SkillModel(val id: String, val name: String, val desc: String, val isEnabled: Boolean)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SkillsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var skillsList by remember {
        mutableStateOf(
            listOf(
                SkillModel("1", "WhatsApp Autopilot", "Send messages & read incoming chats hands-free", true),
                SkillModel("2", "Call Screener", "Screen spam calls with AI voice interaction", true),
                SkillModel("3", "Camera Vision AI", "Recognize objects, translate text and read barcodes", true),
                SkillModel("4", "Media Controller", "Control Spotify, YouTube & local music players", true)
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Skills Engine",
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
            items(skillsList, key = { it.id }) { skill ->
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
                            Text(skill.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(skill.desc, color = Slate400, fontSize = 11.sp)
                        }
                        Switch(
                            checked = skill.isEnabled,
                            onCheckedChange = { isChecked ->
                                skillsList = skillsList.map { if (it.id == skill.id) it.copy(isEnabled = isChecked) else it }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = CyanAccent)
                        )
                    }
                }
            }
        }
    }
}
