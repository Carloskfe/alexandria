import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { ReaderScreen } from '../screens/reader/ReaderScreen';
import { FragmentsScreen } from '../screens/fragments/FragmentsScreen';
import { AccountScreen } from '../screens/account/AccountScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Reader" component={ReaderScreen} />
      <Tab.Screen name="Fragments" component={FragmentsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
