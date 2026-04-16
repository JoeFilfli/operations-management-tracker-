import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text } from 'react-native'
import { colors } from '../theme'
import EquipmentDetailScreen from '../screens/EquipmentDetailScreen'
import EquipmentListScreen from '../screens/EquipmentListScreen'
import TicketDetailScreen from '../screens/TicketDetailScreen'
import TicketListScreen from '../screens/TicketListScreen'

const Tab   = createBottomTabNavigator()
const EqStack = createNativeStackNavigator()
const TkStack = createNativeStackNavigator()

function EquipmentStack() {
  return (
    <EqStack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <EqStack.Screen name="EquipmentList"   component={EquipmentListScreen}   options={{ title: 'Equipment' }} />
      <EqStack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ title: 'Equipment Detail' }} />
    </EqStack.Navigator>
  )
}

function TicketStack() {
  return (
    <TkStack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
      <TkStack.Screen name="TicketList"   component={TicketListScreen}   options={{ title: 'My Tickets' }} />
      <TkStack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'Ticket' }} />
    </TkStack.Navigator>
  )
}

const TabIcon = ({ emoji, focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
)

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="EquipmentTab"
        component={EquipmentStack}
        options={{
          tabBarLabel: 'Equipment',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TicketsTab"
        component={TicketStack}
        options={{
          tabBarLabel: 'My Tickets',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔧" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}
