import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ShoulderWebAR {
    constructor() {
        // THREE を window オブジェクトに追加
        window.THREE = THREE;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.character = null;
        this.pose = null;
    }

    async initialize() {
        try {
            this.setupThreeJS();
            await this.setupCamera();
            await this.setupPoseDetection();
            await this.loadCharacterModel();
            this.animate();
        } catch (error) {
            console.error('初期化エラー:', error);
            throw error;
        }
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        
        // カメラのセットアップ
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        
        // レンダラーのセットアップ
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas: document.getElementById('overlay')
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // ライティング
        const light = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(light);
    }

    async setupCamera() {
        try {
            const video = document.getElementById('videoElement');
            // デバイスの種類に関係なく最適な設定を使用
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'  // 内カメラを優先
                }
            });
            video.srcObject = stream;
            
            // ビデオの準備完了を待つ
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().catch(err => {
                        console.error('ビデオの再生に失敗:', err);
                    });
                    resolve();
                };
            });
            
            console.log('カメラのセットアップ完了');
        } catch (error) {
            console.error('カメラのセットアップエラー:', error);
            throw new Error('カメラの初期化に失敗しました。カメラへのアクセスを許可し、カメラが正しく接続されていることを確認してください。');
        }
    }

    async setupPoseDetection() {
        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.pose.onResults((results) => {
            if (results.poseLandmarks) {
                this.updateCharacterPosition(results.poseLandmarks);
            }
        });
    }

    async loadCharacterModel() {
        const loader = new GLTFLoader();
        try {
            this.character = await new Promise((resolve, reject) => {
                // リポジトリ名を含めたパスに修正
                const modelPath = '/tkp/models/takopi_ふわふわ4.glb';  
                loader.load(
                    modelPath,
                    (gltf) => {
                        const model = gltf.scene;
                        model.scale.set(0.5, 0.5, 0.5);
                        this.scene.add(model);
                        resolve(model);
                    },
                    (progress) => {
                        console.log('モデル読み込み進捗:', (progress.loaded / progress.total * 100) + '%');
                    },
                    reject
                );
            });
        } catch (error) {
            console.error('モデル読み込みエラー:', error);
            throw new Error('3Dモデルの読み込みに失敗しました：' + error.message);
        }
    }

    updateCharacterPosition(landmarks) {
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        // 肩の中心位置を計算
        const centerX = (leftShoulder.x + rightShoulder.x) / 2;
        const centerY = (leftShoulder.y + rightShoulder.y) / 2;
        const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

        // 画面座標を3D空間座標に変換
        const x = (centerX - 0.5) * 2;
        const y = -(centerY - 0.5) * 2;

        // キャラクターの位置更新
        this.character.position.set(
            x,
            y + 0.3, // 肩から少し上に配置
            -0.5
        );

        // スケールの更新
        const scale = shoulderWidth * 1.5;
        this.character.scale.set(scale, scale, scale);

        // キャラクターのアニメーション
        this.animateCharacter();
    }

    animateCharacter() {
        const time = performance.now() * 0.001;
        this.character.position.y += Math.sin(time * 2) * 0.001;
        this.character.rotation.y = Math.sin(time) * 0.1;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // ビデオフレームの処理
        const video = document.getElementById('videoElement');
        this.pose.send({image: video});
        
        // シーンのレンダリング
        this.renderer.render(this.scene, this.camera);
    }

    // ユーティリティ関数
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}