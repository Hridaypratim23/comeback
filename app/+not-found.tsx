import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>← Back to COMEBACK</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 48, fontWeight: '900', color: COLORS.red },
  link: { marginTop: 20 },
  linkText: { fontSize: 14, color: COLORS.grey },
});
