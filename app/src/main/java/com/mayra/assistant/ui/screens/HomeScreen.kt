package com.mayra.assistant.ui.screens

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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.mayra.assistant.ui.character.CharacterState
import com.mayra.assistant.ui.character.MayraCharacterView
import com.mayra.assistant.ui.theme.*

/**
 * MAYRA Full-Screen Character Home Screen for Jetpack Compose.
 * Clean, character-first assistant stage where the 3D MAYRA model occupies
 * the majority of the screen, with minimal floating overlays.
 */
@Composable
fun HomeScreen(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    var assistantState by remember { mutableStateOf(CharacterState.READY) }
    var inputText by remember { mutableStateOf("") }

    val assistantMessage = when (assistantState) {
        CharacterState.READY -> "Good evening, Alex! I'm MAYRA. How can I assist you today?"
        CharacterState.LISTENING -> "Listening... speak now"
        CharacterState.THINKING -> "Reasoning with Gemini Neural Engine..."
        CharacterState.SPEAKING -> "Speaking: \"All systems active. How can I help you next?\""
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DeviceInnerBackground)
    ) {
        // 1. FULL-SCREEN 3D CHARACTER LAYER (Dominant Visual Element)
        MayraCharacterView(
            state = assistantState,
            onTriggerVoice = {
                assistantState = when (assistantState) {
                    CharacterState.READY -> CharacterState.LISTENING
                    CharacterState.LISTENING -> CharacterState.THINKING
                    CharacterState.THINKING -> CharacterState.SPEAKING
                    CharacterState.SPEAKING -> CharacterState.READY
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // 2. MINIMAL TOP BAR OVERLAY
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "MAYRA",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    ),
                    color = Color.White
                )

                Surface(
                    color = CyanAccent.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CyanAccent.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = "ONLINE",
                        color = CyanBright,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            IconButton(
                onClick = { navController.navigate("settings") },
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(DeepCardBackground.copy(alpha = 0.8f))
            ) {
                Icon(
                    Icons.Default.Settings,
                    contentDescription = "Settings",
                    tint = Slate300,
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        // 3. LOWER OVERLAY: Assistant Response + Message Input + Microphone
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(horizontal = 16.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Assistant Message Bubble
            Surface(
                color = DeepCardBackground.copy(alpha = 0.85f),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, CyanAccent.copy(alpha = 0.25f)),
                shadowElevation = 8.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = assistantMessage,
                    color = Color.White,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                )
            }

            // Rounded Message Input Bar
            Surface(
                color = DeepCardBackground.copy(alpha = 0.9f),
                shape = CircleShape,
                border = androidx.compose.foundation.BorderStroke(1.dp, CyanAccent.copy(alpha = 0.35f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Type a message to MAYRA...",
                        color = Slate400,
                        fontSize = 12.sp
                    )

                    IconButton(
                        onClick = { /* Submit query */ },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            Icons.Default.Send,
                            contentDescription = "Send",
                            tint = CyanBright,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            // Central Voice Microphone Button
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                CyanAccent,
                                VioletAccent,
                                ObsidianBackground
                            )
                        )
                    )
                    .clickable {
                        assistantState = when (assistantState) {
                            CharacterState.READY -> CharacterState.LISTENING
                            CharacterState.LISTENING -> CharacterState.THINKING
                            CharacterState.THINKING -> CharacterState.SPEAKING
                            CharacterState.SPEAKING -> CharacterState.READY
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Mic,
                    contentDescription = "Voice Assistant",
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
    }
}
