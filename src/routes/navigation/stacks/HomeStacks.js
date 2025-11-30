import React, { useContext } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { navigationProps } from './navigationProps/navigationProps'
import GradientHeader from '../../../components/GradientHeader'
import { HomeTitleContext } from '../../../contexts/HomeTitleContext'

import Home from '../../../scenes/home/Home'

const Stack = createStackNavigator()

export const HomeStacks = () => {
  const { title, setTitle } = useContext(HomeTitleContext)
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={navigationProps}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        options={({ navigation }) => ({
          title: `${title} Morph`,
          headerShown: true,
          headerBackTitleVisible: false,
          headerBackground: () => <GradientHeader />,
        })}
      />
    </Stack.Navigator>
  )
}