import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, fontSize } from '../../theme'
import ScreenTemplate from '../../components/ScreenTemplate'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import Slider from '@react-native-community/slider'

export default function Home() {
  const [faces, setFaces] = useState(12)
  const rendererRef = useRef()
  const sceneRef = useRef()
  const meshRef = useRef()
  
  const onContextCreate = async (gl) => {
    // レンダラー設定
    const renderer = new THREE.WebGLRenderer({
      canvas: {
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: gl.drawingBufferHeight,
        getContext: () => gl,
      },
      context: gl,
    })
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight)
    
    // シーン設定
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    
    // カメラ設定
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    )
    camera.position.z = 5
    
    // 初期ジオメトリ
    const geometry = new THREE.IcosahedronGeometry(2, 0)
    const material = new THREE.MeshNormalMaterial({ flatShading: true })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    
    // ライト
    const light = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(light)
    
    // Refに保存
    rendererRef.current = renderer
    sceneRef.current = scene
    meshRef.current = mesh
    
    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate)
      
      if (meshRef.current) {
        meshRef.current.rotation.x += 0.01
        meshRef.current.rotation.y += 0.01
      }
      
      renderer.render(scene, camera)
      gl.endFrameEXP()
    }
    animate()
  }
  
  // 面数が変わったらジオメトリを更新
  useEffect(() => {
    if (meshRef.current) {
      let newGeometry
      
      if (faces <= 4) {
        newGeometry = new THREE.TetrahedronGeometry(2, 0)
      } else if (faces <= 6) {
        newGeometry = new THREE.BoxGeometry(2, 2, 2)
      } else if (faces <= 8) {
        newGeometry = new THREE.OctahedronGeometry(2, 0)
      } else if (faces <= 12) {
        newGeometry = new THREE.DodecahedronGeometry(2, 0)
      } else if (faces <= 20) {
        newGeometry = new THREE.IcosahedronGeometry(2, 0)
      } else {
        // 20面以上は細分化
        const detail = Math.floor((faces - 20) / 5)
        newGeometry = new THREE.IcosahedronGeometry(2, detail)
      }
      
      meshRef.current.geometry.dispose()
      meshRef.current.geometry = newGeometry
    }
  }, [faces])
  
  return (
    <ScreenTemplate>
      <View style={styles.container}>
        <View style={styles.faceCountContainer}>
          <Text style={styles.faceCountText}>{faces} faces</Text>
        </View>
        
        <View style={styles.canvasContainer}>
          <GLView
            style={{ flex: 1 }}
            onContextCreate={onContextCreate}
          />
        </View>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>4</Text>
          <Slider
            style={styles.slider}
            value={faces}
            onValueChange={(value) => setFaces(Math.round(value))}
            minimumValue={4}
            maximumValue={30}
          />
          <Text style={styles.sliderLabel}>30</Text>
        </View>
      </View>
    </ScreenTemplate>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  faceCountContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  faceCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#000',
    minWidth: 25,
    textAlign: 'center',
  },
})