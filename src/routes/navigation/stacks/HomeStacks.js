import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { navigationProps } from './navigationProps/navigationProps'
import GradientHeader from '../../../components/GradientHeader'

import Home from '../../../scenes/home/Home'

const Stack = createStackNavigator()

export const HomeStacks = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={navigationProps}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        options={({ navigation }) => ({
          title: 'Home',
          headerShown: true,
          headerBackTitleVisible: false,
          headerBackground: () => <GradientHeader />,
        })}
      />
    </Stack.Navigator>
  )
}