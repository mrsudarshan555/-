package com.mayra.assistant.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// MAYRA Extracted Theme Tokens
val ObsidianBackground = Color(0xFF030712)
val DeviceInnerBackground = Color(0xFF070913)
val DeepCardBackground = Color(0xFF0C1021)
val ElevatedSurface = Color(0xFF11172E)
val CyanAccent = Color(0xFF06B6D4)
val CyanBright = Color(0xFF22D3EE)
val NeonCyan = CyanBright
val VioletAccent = Color(0xFF8B5CF6)
val BlueElectric = Color(0xFF3B82F6)
val ElectricBlue = BlueElectric
val EmeraldGuardian = Color(0xFF10B981)
val AmberWarning = Color(0xFFF59E0B)
val RoseAlert = Color(0xFFF43F5E)
val Slate300 = Color(0xFFCBD5E1)
val Slate400 = Color(0xFF94A3B8)
val Slate500 = Color(0xFF64748B)

// Shapes Tokens
val MayraShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)

// Typography Tokens
val MayraTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 38.sp,
        color = Color.White
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 26.sp,
        color = Color.White
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
        color = Color.White
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = Slate300
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        color = Slate400
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        lineHeight = 14.sp,
        color = Slate500
    )
)

private val MayraDarkColorScheme = darkColorScheme(
    primary = CyanAccent,
    secondary = CyanBright,
    tertiary = VioletAccent,
    background = ObsidianBackground,
    surface = DeepCardBackground,
    surfaceVariant = ElevatedSurface,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun MayraTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = MayraDarkColorScheme,
        typography = MayraTypography,
        shapes = MayraShapes,
        content = content
    )
}
