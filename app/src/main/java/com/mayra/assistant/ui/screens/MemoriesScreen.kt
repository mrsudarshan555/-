package com.mayra.assistant.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Psychology
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

data class MemoryEntry(
    val id: String,
    val title: String,
    val date: String,
    val category: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemoriesScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val sampleMemories = remember {
        listOf(
            MemoryEntry("1", "User prefers dark mode and high contrast", "Today", "Preferences"),
            MemoryEntry("2", "Preferred primary communication language is English", "Yesterday", "Language"),
            MemoryEntry("3", "Emergency contact: Home & Office", "3 days ago", "Contacts")
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Memory Vault",
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
                actions = {
                    IconButton(onClick = { /* Add Memory */ }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Memory", tint = CyanBright)
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
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            item {
                Text(
                    text = "Things MAYRA has learned and remembered to personalize your experience.",
                    color = Slate400,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(bottom = 6.dp)
                )
            }

            items(sampleMemories, key = { it.id }) { memory ->
                Card(
                    shape = RoundedCornerShape(14.dp),
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
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = memory.title,
                                color = Color.White,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${memory.category} • ${memory.date}",
                                color = Slate400,
                                fontSize = 11.sp
                            )
                        }
                        Icon(
                            Icons.Default.Psychology,
                            contentDescription = null,
                            tint = VioletAccent,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        }
    }
}
