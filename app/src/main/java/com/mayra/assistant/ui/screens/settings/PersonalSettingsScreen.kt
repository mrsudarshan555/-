package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.mayra.assistant.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PersonalSettingsScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var userName by remember { mutableStateOf("Alex") }
    var userPronouns by remember { mutableStateOf("They/Them") }
    var preferredAddress by remember { mutableStateOf("San Francisco, CA") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Personal Profile",
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                "Configure how MAYRA should address and personalize responses for you.",
                color = Slate400,
                fontSize = 12.sp
            )

            Card(
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = DeepCardBackground),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Your Preferred Name", color = Slate300, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    TextField(
                        value = userName,
                        onValueChange = { userName = it },
                        modifier = Modifier.fillMaxWidth(),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = ElevatedSurface,
                            unfocusedContainerColor = ElevatedSurface,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedIndicatorColor = CyanAccent
                        ),
                        shape = RoundedCornerShape(10.dp)
                    )

                    Text("Primary Location", color = Slate300, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    TextField(
                        value = preferredAddress,
                        onValueChange = { preferredAddress = it },
                        modifier = Modifier.fillMaxWidth(),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = ElevatedSurface,
                            unfocusedContainerColor = ElevatedSurface,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedIndicatorColor = CyanAccent
                        ),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
        }
    }
}
