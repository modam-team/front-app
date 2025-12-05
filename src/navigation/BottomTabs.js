import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BookshelfScreen from '../screens/BookshelfScreen';
import HomeScreen from '../screens/HomeScreen';
import ReportScreen from '../screens/ReportScreen';
import colors from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { useBooks } from '../context/BooksContext';

const Tab = createBottomTabNavigator();

function TabIcon({ type, focused }) {
  const tint = focused ? colors.accent : colors.tabInactive;

  if (type === 'book') {
    return (
      <View style={styles.iconWrap}>
        <View style={[styles.bookCover, { borderColor: tint }]} />
        <View style={[styles.bookLine, { backgroundColor: tint }]} />
      </View>
    );
  }
  if (type === 'home') {
    return (
      <View style={styles.iconWrap}>
        <View style={[styles.homeRoof, { borderBottomColor: tint }]} />
        <View style={[styles.homeBody, { borderColor: tint }]} />
      </View>
    );
  }
  return (
    <View style={[styles.iconWrap, styles.bars]}>
      {[6, 10, 14].map((h) => (
        <View key={h} style={[styles.bar, { height: h, backgroundColor: tint }]} />
      ))}
    </View>
  );
}

export default function BottomTabs() {
  const { addBook, setLastShelf } = useBooks();
  const navigation = useNavigation();

  const handleSelectBook = (book, shelf = 'before') => {
    setLastShelf(shelf);
    addBook(book, { shelf });
    Alert.alert('책이 추가되었습니다', `${book?.title || '제목 없음'} (${shelf})`);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: styles.tabBar,
        }}
      >
        <Tab.Screen
          name="책장"
          component={BookshelfScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon type="book" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="홈"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon type="home" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="리포트"
          component={ReportScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon type="report" focused={focused} />,
          }}
        />
      </Tab.Navigator>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => navigation.navigate('BookSelect', { onPick: handleSelectBook })}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: colors.border,
    height: 76,
    paddingTop: 10,
  },
  tabLabel: { fontSize: 12, fontWeight: '700', paddingBottom: 6 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', height: 22 },
  bookCover: {
    width: 20,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  bookLine: {
    width: 12,
    height: 2,
    borderRadius: 999,
    marginTop: 2,
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -2,
  },
  homeBody: {
    width: 20,
    height: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    borderRadius: 2,
  },
  bars: { flexDirection: 'row', width: 26, justifyContent: 'space-between' },
  bar: { width: 4, borderRadius: 1 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabPlus: { fontSize: 28, lineHeight: 32, color: '#fff' },
});
