package com.mayra.assistant.ui.navigation

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
}
