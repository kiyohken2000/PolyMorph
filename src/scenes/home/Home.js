import React, { useState, useEffect, useRef, useContext } from 'react'
import { StyleSheet, Text, View, PanResponder, TouchableOpacity, Animated, Modal, FlatList } from 'react-native'
import { colors, fontSize } from '../../theme'
import ScreenTemplate from '../../components/ScreenTemplate'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
import Slider from '@react-native-community/slider'
import * as Haptics from 'expo-haptics'
import { HomeTitleContext } from '../../contexts/HomeTitleContext'
import BlurBox from '../../components/BlurBox/BlurBox'
import { useAudioPlayer } from 'expo-audio'
import { version } from '../../config'

// BGMリスト
const BGM_LIST = [
  { id: 1, name: 'BGM 1', file: require('../../../assets/audio/bgm1.mp3') },
  { id: 2, name: 'BGM 2', file: require('../../../assets/audio/bgm2.mp3') },
  { id: 3, name: 'BGM 3', file: require('../../../assets/audio/bgm3.mp3') },
  { id: 4, name: 'BGM 4', file: require('../../../assets/audio/bgm4.mp3') },
  { id: 5, name: 'BGM 5', file: require('../../../assets/audio/bgm5.mp3') },
]

// 面数に応じたジオメトリを生成する関数
const createGeometryForFaces = (faceCount, isPebble) => {
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

  if(isPebble) {
    // 球状に点をランダム配置
    const points = [];
    for (let i = 0; i < faceCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2;

      points.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }

    // 凸包＝点をつないだ多面体
    const geometry = new ConvexGeometry(points);
    return geometry
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
  const [confetti, setConfetti] = useState([])
  const [selectedBgmId, setSelectedBgmId] = useState(1)
  const [showBgmModal, setShowBgmModal] = useState(false)
  const [isPebble, setIsPebble] = useState(false)
  const [inertiaEnabled, setInertiaEnabled] = useState(true)
  const rendererRef = useRef()
  const sceneRef = useRef()
  const meshRef = useRef()
  const rotationRef = useRef({ x: 0, y: 0 })
  const lastTouchRef = useRef({ x: 0, y: 0 })
  const accumulatedRotationRef = useRef(0)
  const autoRotateRef = useRef(autoRotate)
  const lastConfettiTimeRef = useRef(0)
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastMoveTimeRef = useRef(0)
  const inertiaEnabledRef = useRef(inertiaEnabled)
  const { title, setTitle } = useContext(HomeTitleContext)

  // BGMプレイヤー（各BGMごとに作成）
  const player1 = useAudioPlayer(BGM_LIST[0].file)
  const player2 = useAudioPlayer(BGM_LIST[1].file)
  const player3 = useAudioPlayer(BGM_LIST[2].file)
  const player4 = useAudioPlayer(BGM_LIST[3].file)
  const player5 = useAudioPlayer(BGM_LIST[4].file)

  // 選択されたBGMのプレイヤーを取得
  const getCurrentPlayer = () => {
    switch (selectedBgmId) {
      case 1: return player1
      case 2: return player2
      case 3: return player3
      case 4: return player4
      case 5: return player5
      default: return player1
    }
  }

  useEffect(() => {
    setTitle(faces)
  }, [faces])

  // autoRotateの値をrefに同期
  useEffect(() => {
    autoRotateRef.current = autoRotate
  }, [autoRotate])

  // inertiaEnabledの値をrefに同期
  useEffect(() => {
    inertiaEnabledRef.current = inertiaEnabled
  }, [inertiaEnabled])

  // BGMの再生・停止を管理
  useEffect(() => {
    const currentPlayer = getCurrentPlayer()
    const allPlayers = [player1, player2, player3, player4, player5]

    // すべてのプレイヤーを停止
    allPlayers.forEach(p => {
      if (p.playing) {
        p.pause()
      }
    })

    if (autoRotate) {
      // 自動回転ON: 選択されたBGMを再生
      currentPlayer.loop = true
      currentPlayer.volume = 0.5
      currentPlayer.play()
    } else {
      // 自動回転OFF: BGMを停止
      currentPlayer.pause()
    }
  }, [autoRotate, selectedBgmId])

  // スライダーの値変更ハンドラ
  const handleSliderChange = (value) => {
    const newFaces = Math.round(value)
    if (newFaces !== faces) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setFaces(newFaces)
    }
  }

  // BGM選択ハンドラ
  const handleBgmSelect = (bgmId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSelectedBgmId(bgmId)
    setShowBgmModal(false)

    // BGMを変更したら自動回転をOFF
    setAutoRotate(false)
  }

  // 紙吹雪を作成する関数
  const createConfetti = (x, y, count = 30) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
    const newConfetti = []
    const timestamp = Date.now()

    for (let i = 0; i < count; i++) {
      const id = `${timestamp}_${i}_${Math.random()}`
      const color = colors[Math.floor(Math.random() * colors.length)]
      const translateX = new Animated.Value(0)
      const translateY = new Animated.Value(0)
      const rotate = new Animated.Value(0)
      const opacity = new Animated.Value(1)

      // ランダムな方向と速度
      const angle = (Math.random() * Math.PI * 2)
      const velocity = 100 + Math.random() * 150
      const vx = Math.cos(angle) * velocity
      const vy = -Math.abs(Math.sin(angle)) * velocity - 100

      newConfetti.push({
        id,
        x,
        y,
        color,
        translateX,
        translateY,
        rotate,
        opacity,
        vx,
        vy,
      })

      // アニメーション（期間を短縮）
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: vx,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: vy,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 500,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotate, {
          toValue: (Math.random() - 0.5) * 720,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // アニメーション終了後、紙吹雪を削除
        setConfetti(prev => prev.filter(c => c.id !== id))
      })
    }

    setConfetti(prev => {
      const MAX_CONFETTI = 100 // 最大100個まで
      const updated = [...prev, ...newConfetti]
      // 古いものから削除して最大数を保つ
      if (updated.length > MAX_CONFETTI) {
        return updated.slice(updated.length - MAX_CONFETTI)
      }
      return updated
    })
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
        lastConfettiTimeRef.current = Date.now()
        lastMoveTimeRef.current = Date.now()
        velocityRef.current = { x: 0, y: 0 }
        lastTouchRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        }

        // 触った瞬間に紙吹雪を出す
        const x = evt.nativeEvent.locationX
        const y = evt.nativeEvent.locationY
        createConfetti(x, y, 30)
      },
      onPanResponderMove: (evt) => {
        const now = Date.now()
        const deltaTime = now - lastMoveTimeRef.current
        const deltaX = evt.nativeEvent.pageX - lastTouchRef.current.x
        const deltaY = evt.nativeEvent.pageY - lastTouchRef.current.y

        const rotationDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        rotationRef.current.y += deltaX * 0.01
        rotationRef.current.x += deltaY * 0.01

        // 速度を計算（時間あたりの回転量）
        if (deltaTime > 0) {
          velocityRef.current.x = (deltaY * 0.01) / deltaTime * 16
          velocityRef.current.y = (deltaX * 0.01) / deltaTime * 16
        }

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

        // ドラッグ中も紙吹雪を出す（150msごとに、さらに少なめに）
        if (now - lastConfettiTimeRef.current > 150) {
          const x = evt.nativeEvent.locationX
          const y = evt.nativeEvent.locationY
          createConfetti(x, y, 5) // ドラッグ中はかなり少なめに
          lastConfettiTimeRef.current = now
        }

        lastTouchRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        }
        lastMoveTimeRef.current = now
      },
      onPanResponderRelease: () => {
        // ドラッグ終了時、慣性回転が開始される（アニメーションループで処理）
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
    const geometry = createGeometryForFaces(12, isPebble)
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
      } else if (meshRef.current && inertiaEnabledRef.current) {
        // 慣性回転を適用（慣性が有効な場合のみ）
        const vx = velocityRef.current.x
        const vy = velocityRef.current.y
        const speed = Math.sqrt(vx * vx + vy * vy)

        if (speed > 0.001) {
          rotationRef.current.x += vx
          rotationRef.current.y += vy
          meshRef.current.rotation.x = rotationRef.current.x
          meshRef.current.rotation.y = rotationRef.current.y

          // 速度を減衰（摩擦係数 0.95）
          velocityRef.current.x *= 0.95
          velocityRef.current.y *= 0.95
        } else {
          // 速度が十分小さくなったら停止
          velocityRef.current.x = 0
          velocityRef.current.y = 0
        }
      }

      renderer.render(scene, camera)
      gl.endFrameEXP()
    }
    animate()
  }
  
  // 面数が変わったらジオメトリを更新
  useEffect(() => {
    if (meshRef.current) {
      const newGeometry = createGeometryForFaces(faces, isPebble)
      meshRef.current.geometry.dispose()
      meshRef.current.geometry = newGeometry
    }
  }, [faces, isPebble])
  
  return (
    <ScreenTemplate>
      <BlurBox>
        <View style={styles.container}>

          <View style={styles.canvasContainer} {...panResponder.panHandlers}>
            <GLView
              style={{ flex: 1 }}
              onContextCreate={onContextCreate}
            />

            {/* 紙吹雪レイヤー */}
            {confetti.map((c) => (
              <Animated.View
                key={c.id}
                style={[
                  styles.confettiPiece,
                  {
                    left: c.x,
                    top: c.y,
                    backgroundColor: c.color,
                    transform: [
                      { translateX: c.translateX },
                      { translateY: c.translateY },
                      { rotate: c.rotate.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      })},
                    ],
                    opacity: c.opacity,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonGroup}>
            <View style={styles.buttonRow}>
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

              <TouchableOpacity
                style={styles.bgmButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  setShowBgmModal(true)
                }}
              >
                <Text style={styles.bgmButtonText}>
                  BGM: {BGM_LIST.find(bgm => bgm.id === selectedBgmId)?.name || 'BGM 1'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.pebbleButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  setIsPebble(!isPebble)
                }}
              >
                <Text style={styles.pebbleButtonText}>
                  {isPebble ? 'ペブル: ON' : 'ペブル: OFF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inertiaButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  setInertiaEnabled(!inertiaEnabled)
                }}
              >
                <Text style={styles.inertiaButtonText}>
                  {inertiaEnabled ? '慣性: ON' : '慣性: OFF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
          <View>
            <Text>ver: {version}</Text>
          </View>
        </View>
      </BlurBox>

      {/* BGM選択モーダル */}
      <Modal
        visible={showBgmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBgmModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBgmModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>BGMを選択</Text>
            <FlatList
              data={BGM_LIST}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bgmItem,
                    selectedBgmId === item.id && styles.bgmItemSelected
                  ]}
                  onPress={() => handleBgmSelect(item.id)}
                >
                  <Text style={[
                    styles.bgmItemText,
                    selectedBgmId === item.id && styles.bgmItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedBgmId === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBgmModal(false)}
            >
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  buttonGroup: {
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  autoRotateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  autoRotateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bgmButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  bgmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pebbleButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  pebbleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inertiaButton: {
    backgroundColor: '#AF52DE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  inertiaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  bgmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#f5f5f5',
  },
  bgmItemSelected: {
    backgroundColor: '#007AFF',
  },
  bgmItemText: {
    fontSize: 16,
    color: '#000',
  },
  bgmItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})