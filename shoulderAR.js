export class ShoulderWebAR {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // 必要なライブラリの読み込み
        await this.loadDependencies();
        
        // Three.jsの初期設定
        this.setupThreeJS();
        
        // カメラストリームのセットアップ
        await this.setupCamera();
        
        // MediaPipe Poseの初期化
        await this.setupPoseDetection();
        
        // 3Dモデルのロード
        await this.loadCharacterModel();
        
        // メインループの開始
        this.animate();
    }

    async loadDependencies() {
        // MediaPipe Poseの読み込み
        await Promise.all([
            this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js'),
            this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        ]);
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
        const video = document.getElementById('videoElement');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        video.srcObject = stream;
        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });
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
        this.character = await new Promise((resolve, reject) => {
            loader.load(
                'takopi_ふわふわ4.glb',
                (gltf) => {
                    const model = gltf.scene;
                    model.scale.set(0.5, 0.5, 0.5);
                    this.scene.add(model);
                    resolve(model);
                },
                undefined,
                reject
            );
        });
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