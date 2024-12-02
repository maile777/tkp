import { ShoulderWebAR } from './shoulderAR.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const ar = new ShoulderWebAR();
        document.getElementById('loadingMessage').style.display = 'none';
    } catch (error) {
        console.error('AR初期化エラー:', error);
        document.getElementById('loadingMessage').textContent = 
            'ARの初期化に失敗しました。デバイスとブラウザの互換性を確認してください。';
    }
});