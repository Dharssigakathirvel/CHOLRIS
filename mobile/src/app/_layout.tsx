import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="farmer"
          options={{ headerShown: false }}
        />

        <Stack.Screen
  name="admin"
  options={{ headerShown: false }}
/>

        <Stack.Screen
          name="explore"
          options={{ headerShown: false }}
        />
      </Stack>
    </ThemeProvider>
  );
}