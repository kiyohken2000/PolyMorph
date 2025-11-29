import React, { useContext } from 'react'
import { UserContext } from '../../contexts/UserContext'
import { NavigationContainer } from '@react-navigation/native'
// import DrawerNavigator from './drawer'
import RootStack from './rootStack/RootStack'
import Toast from 'react-native-toast-message'

export default function Navigation() {
  const { user } = useContext(UserContext)
  return (
    <>
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
    <Toast />
    </>
  )
}
