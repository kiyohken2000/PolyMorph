import React, { useState, useEffect, useRef, useContext } from 'react'
import { StyleSheet, Text, View, PanResponder, TouchableOpacity } from 'react-native'
import { colors, fontSize } from '../../theme'
import ScreenTemplate from '../../components/ScreenTemplate'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import Slider from '@react-native-community/slider'
import * as Haptics from 'expo-haptics'
import { HomeTitleContext } from '../../contexts/HomeTitleContext'

// 面数に応じたジオメトリを生成する関数
const createGeometryForFaces = (faceCount) => {
  if (faceCount <= 4) {
    return new THREE.TetrahedronGeometry(2, 0)
  } else if (faceCount <= 6) {
    return new THREE.BoxGeometry(2, 2, 2)
  } else if (faceCount <= 8) {
    return new THREE.OctahedronGeometry(2, 0)
  } else if (faceCount <= 12) {
    return new THREE.DodecahedronGeometry(2, 0)
  } else if (faceCount <= 20) {
    return new THREE.IcosahedronGeometry(2, 0)
  } else {
    // 20面以上は細分化
    const detail = Math.floor((faceCount - 20) / 5)
    return new THREE.IcosahedronGeometry(2, detail)
  }
}

export default function Home() {
  const [faces, setFaces] = useState(12)
  const [autoRotate, setAutoRotate] = useState(false)
  const rendererRef = useRef()
  const sceneRef = useRef()
  const meshRef = useRef()
  const rotationRef = useRef({ x: 0, y: 0 })
  const lastTouchRef = useRef({ x: 0, y: 0 })
  const accumulatedRotationRef = useRef(0)
  const autoRotateRef = useRef(autoRotate)
  const { title, setTitle } = useContext(HomeTitleContext)

  useEffect(() => {
    setTitle(faces)
  }, [faces])

  // autoRotateの値をrefに同期
  useEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  // スライダーの値変更ハンドラ
  const handleSliderChange = (value) => {
    const newFaces = Math.round(value)
    if (newFaces !== faces) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setFaces(newFaces)
    }
  }

  // タッチ操作用のPanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // タッチ開始時にハプティックフィードバック
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        accumulatedRotationRef.current = 0
        lastTouchRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        }
      },
      onPanResponderMove: (evt) => {
        const deltaX = evt.nativeEvent.pageX - lastTouchRef.current.x
        const deltaY = evt.nativeEvent.pageY - lastTouchRef.current.y

        const rotationDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        rotationRef.current.y += deltaX * 0.01
        rotationRef.current.x += deltaY * 0.01

        if (meshRef.current) {
          meshRef.current.rotation.x = rotationRef.current.x
          meshRef.current.rotation.y = rotationRef.current.y
        }

        // 累積回転量を追跡し、一定量を超えたらハプティック
        accumulatedRotationRef.current += rotationDelta
        if (accumulatedRotationRef.current > 50) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          accumulatedRotationRef.current = 0
        }

        lastTouchRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        }
      },
    })
  ).current

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
    
    // 初期ジオメトリ（12面体）
    const geometry = createGeometryForFaces(12)
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

      // 自動回転が有効な場合
      if (autoRotateRef.current && meshRef.current) {
        rotationRef.current.x += 0.005
        rotationRef.current.y += 0.01
        meshRef.current.rotation.x = rotationRef.current.x
        meshRef.current.rotation.y = rotationRef.current.y
      }

      renderer.render(scene, camera)
      gl.endFrameEXP()
    }
    animate()
  }
  
  // 面数が変わったらジオメトリを更新
  useEffect(() => {
    if (meshRef.current) {
      const newGeometry = createGeometryForFaces(faces)
      meshRef.current.geometry.dispose()
      meshRef.current.geometry = newGeometry
    }
  }, [faces])
  
  return (
    <ScreenTemplate>
      <View style={styles.container}>
        
        <View style={styles.canvasContainer} {...panResponder.panHandlers}>
          <GLView
            style={{ flex: 1 }}
            onContextCreate={onContextCreate}
          />
        </View>

        <TouchableOpacity
          style={styles.autoRotateButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            setAutoRotate(!autoRotate)
          }}
        >
          <Text style={styles.autoRotateButtonText}>
            {autoRotate ? '自動回転: ON' : '自動回転: OFF'}
          </Text>
        </TouchableOpacity>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>少</Text>
          <Slider
            style={styles.slider}
            value={faces}
            onValueChange={handleSliderChange}
            minimumValue={4}
            maximumValue={30}
          />
          <Text style={styles.sliderLabel}>多</Text>
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
    fontSize: 18,
    minWidth: 25,
    textAlign: 'center',
  },
  autoRotateButton: {
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  autoRotateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})