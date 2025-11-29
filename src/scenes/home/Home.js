import React, { useState, useEffect, useRef, useContext } from 'react'
import { StyleSheet, Text, View, PanResponder, TouchableOpacity } from 'react-native'
import { colors, fontSize } from '../../theme'
import ScreenTemplate from '../../components/ScreenTemplate'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import Slider from '@react-native-community/slider'
import * as Haptics from 'expo-haptics'
import { HomeTitleContext } from '../../contexts/HomeTitleContext'
import BlurBox from '../../components/BlurBox/BlurBox'
import { useAudioPlayer } from 'expo-audio'

// 面数に応じたジオメトリを生成する関数
const createGeometryForFaces = (faceCount) => {
  // 正多面体が存在する面数
  if (faceCount === 4) {
    return new THREE.TetrahedronGeometry(2, 0)
  } else if (faceCount === 6) {
    return new THREE.BoxGeometry(2, 2, 2)
  } else if (faceCount === 8) {
    return new THREE.OctahedronGeometry(2, 0)
  } else if (faceCount === 12) {
    return new THREE.DodecahedronGeometry(2, 0)
  } else if (faceCount === 20) {
    return new THREE.IcosahedronGeometry(2, 0)
  }

  // 正多面体以外の面数は球体で近似
  // 面数に応じて適切なセグメント数を計算
  // SphereGeometry(radius, widthSegments, heightSegments)
  // 総面数 ≈ widthSegments * heightSegments * 2

  if (faceCount === 5) {
    return new THREE.SphereGeometry(2, 3, 2)  // 約6面（5に近い）
  } else if (faceCount === 7) {
    return new THREE.SphereGeometry(2, 3, 3)  // 約8面（7に近い）
  } else if (faceCount === 9 || faceCount === 10) {
    return new THREE.SphereGeometry(2, 4, 3)  // 約10面
  } else if (faceCount === 11) {
    return new THREE.SphereGeometry(2, 4, 4)  // 約12面（11に近い）
  } else if (faceCount === 13 || faceCount === 14) {
    return new THREE.SphereGeometry(2, 5, 3)  // 約14面
  } else if (faceCount === 15 || faceCount === 16) {
    return new THREE.SphereGeometry(2, 5, 4)  // 約16面
  } else if (faceCount === 17 || faceCount === 18) {
    return new THREE.SphereGeometry(2, 5, 5)  // 約18面
  } else if (faceCount === 19) {
    return new THREE.SphereGeometry(2, 6, 4)  // 約20面（19に近い）
  } else if (faceCount === 21 || faceCount === 22) {
    return new THREE.SphereGeometry(2, 6, 5)  // 約22面
  } else if (faceCount === 23 || faceCount === 24) {
    return new THREE.SphereGeometry(2, 6, 6)  // 約24面
  } else if (faceCount === 25 || faceCount === 26) {
    return new THREE.SphereGeometry(2, 7, 5)  // 約26面
  } else if (faceCount === 27 || faceCount === 28) {
    return new THREE.SphereGeometry(2, 7, 6)  // 約28面
  } else if (faceCount === 29 || faceCount === 30) {
    return new THREE.SphereGeometry(2, 7, 7)  // 約30面
  } else if (faceCount === 31 || faceCount === 32) {
    return new THREE.SphereGeometry(2, 8, 6)  // 約32面
  } else if (faceCount === 33 || faceCount === 34) {
    return new THREE.SphereGeometry(2, 8, 7)  // 約34面
  } else if (faceCount === 35 || faceCount === 36) {
    return new THREE.SphereGeometry(2, 8, 8)  // 約36面
  } else if (faceCount === 37 || faceCount === 38) {
    return new THREE.SphereGeometry(2, 9, 7)  // 約38面
  } else if (faceCount === 39 || faceCount === 40) {
    return new THREE.SphereGeometry(2, 9, 8)  // 約40面
  } else if (faceCount === 41 || faceCount === 42) {
    return new THREE.SphereGeometry(2, 9, 9)  // 約42面
  } else if (faceCount === 43 || faceCount === 44) {
    return new THREE.SphereGeometry(2, 10, 8)  // 約44面
  } else if (faceCount === 45 || faceCount === 46) {
    return new THREE.SphereGeometry(2, 10, 9)  // 約46面
  } else if (faceCount === 47 || faceCount === 48) {
    return new THREE.SphereGeometry(2, 10, 10)  // 約48面
  } else if (faceCount === 49 || faceCount === 50) {
    return new THREE.SphereGeometry(2, 11, 9)  // 約50面
  }

  // 51面以上は計算式で対応
  // SphereGeometry(radius, widthSegments, heightSegments)
  // 総面数 ≈ widthSegments * heightSegments * 2
  // widthSegments を heightSegments より少し大きくして自然な球体に
  const targetFaces = faceCount / 2
  const heightSegments = Math.ceil(Math.sqrt(targetFaces * 0.7))
  const widthSegments = Math.ceil(targetFaces / heightSegments)

  return new THREE.SphereGeometry(2, widthSegments, heightSegments)
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

  // BGMプレイヤー
  const player = useAudioPlayer(require('../../../assets/audio/bgm1.mp3'))

  useEffect(() => {
    setTitle(faces)
  }, [faces])

  // autoRotateの値をrefに同期
  useEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  // BGMの再生・停止を管理
  useEffect(() => {
    if (autoRotate) {
      // 自動回転ON: BGMを再生
      player.loop = true
      player.volume = 0.5
      player.play()
    } else {
      // 自動回転OFF: BGMを停止
      player.pause()
    }
  }, [autoRotate, player])

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
    camera.position.z = 3.5
    
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
      <BlurBox>
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
              maximumValue={50}
              step={2}
            />
            <Text style={styles.sliderLabel}>多</Text>
          </View>
        </View>
      </BlurBox>
    </ScreenTemplate>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
    aspectRatio: 1,
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