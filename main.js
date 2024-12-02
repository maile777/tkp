import { ShoulderWebAR } from './shoulderAR.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.style.display = 'block';

    try {
        const ar = new ShoulderWebAR();
        await ar.initialize();
        loadingMessage.style.display = 'none';
    } catch (error) {
        console.error('AR初期化エラー:', error);
        loadingMessage.textContent = 
            'エラーが発生しました：' + error.message + '\n' +
            'カメラへのアクセスを許可してください。';
        loadingMessage.style.display = 'block';
    }
});