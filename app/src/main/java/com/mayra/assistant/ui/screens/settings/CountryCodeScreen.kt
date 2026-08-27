package com.mayra.assistant.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
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

data class CountryOption(val name: String, val code: String, val dialCode: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CountryCodeScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var selectedCode by remember { mutableStateOf("IN") }
    val countries = remember {
        listOf(
            CountryOption("India", "IN", "+91"),
            CountryOption("United States", "US", "+1"),
            CountryOption("United Kingdom", "GB", "+44"),
            CountryOption("Canada", "CA", "+1"),
            CountryOption("Australia", "AU", "+61"),
            CountryOption("Germany", "DE", "+49"),
            CountryOption("Japan", "JP", "+81"),
            CountryOption("United Arab Emirates", "AE", "+971")
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Default Country & Dialer",
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
            items(countries, key = { it.code }) { country ->
                val isSelected = country.code == selectedCode
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) ElevatedSurface else DeepCardBackground
                    ),
                    border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, CyanAccent) else null,
                    onClick = { selectedCode = country.code },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "${country.name} (${country.dialCode})",
                            color = Color.White,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 13.sp
                        )
                        if (isSelected) {
                            Icon(Icons.Default.Check, contentDescription = "Selected", tint = CyanBright, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}
