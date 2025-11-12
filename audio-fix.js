// 音频修复脚本 - 简化版本专注于正确处理完整的base64音频片段

// 覆盖原始的synthesizeAudio函数
async function synthesizeAudio(messageId, text) {
    console.log('开始音频合成，消息ID:', messageId, '文本:', text);
    
    // 获取输入控件
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // 禁用输入控件
    if (userInput) userInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    
    // 音频队列管理
    const audioQueue = [];
    let isPlaying = false;
    let streamController = null;
    
    try {
        // 调用音频合成接口
        const response = await fetch('http://127.0.0.1:8003/v1/chat/stream/game/audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFwcElkIjoiNjg5YWE2ZWYwNmY2YzEyYmViYWExNmNmIiwiY2xpZW50SWQiOiI2N2U2NzM2ZDE1MmE0NWM0ODE5Y2RmNGEiLCJlbWFpbCI6InRlc3RAdGVzdC50ZXN0IiwiaWQiOiI2ODlhYTZlZjA2ZjZjMTJiZWJhYTE2Y2YiLCJvcGVuaWQiOm51bGwsInBob25lIjoiMTc3Nzc3Nzc3NzciLCJ0eXBlIjoidXNlciIsInVuaW9uaWQiOm51bGwsInVzZXJJZCI6IjY4OWFhNmVmMDZmNmMxMmJlYmFhMTZjZiIsInVzZXJuYW1lIjoidGVzdCJ9LCJleHAiOjE4OTQ4NzU3NzgsImlhdCI6MTc1ODg3NTc3OCwidWlkIjoxMjM0NX0.oFMPRZcQ6hB5lVvKOiAJAPX8iYHTpfy3VACF9IwtiiU"
            },
            body: JSON.stringify({
                messageId: messageId,
                text: text,
                voiceId: 'longfeifei_v2',
                stream: true,
                volume: 100,
                sample_rate: 22050,
                format: "mp3"
            })
        });
        
        // 检查响应状态
        if (!response.ok) {
            console.error('音频合成请求失败:', response.status, response.statusText);
            throw new Error('音频合成请求失败');
        }
        
        // 确保响应是流式的
        if (!response.body) {
            console.error('响应不包含可读流');
            throw new Error('无效的响应格式');
        }
        
        // 创建流读取器
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // 优化的音频队列处理函数 - 实现真正的流式播放
        async function processAudioQueue() {
            // 立即开始处理队列中的音频，无需等待整个接口完成
            if (audioQueue.length > 0 && !isPlaying) {
                isPlaying = true;
                const currentAudio = audioQueue.shift(); // 取出并删除第一个音频
                console.log('立即开始播放音频片段，剩余队列长度:', audioQueue.length);
                
                try {
                    // 使用Audio元素播放完整的base64音频
                    await playAudioWithElement(currentAudio);
                } catch (playError) {
                    console.error('音频播放失败:', playError);
                } finally {
                    isPlaying = false;
                    // 继续处理队列中的下一个音频
                    processAudioQueue();
                }
            } else if (audioQueue.length === 0) {
                console.log('音频队列为空，等待新的音频数据');
            }
        }
        
        // 监听队列变化，确保数据到达时立即处理
        function ensureQueueProcessing() {
            if (!isPlaying && audioQueue.length > 0) {
                processAudioQueue();
            }
        }
        
        // 使用Audio元素播放base64音频
        async function playAudioWithElement(base64Audio) {
            return new Promise((resolve, reject) => {
                try {
                    // 确保base64格式正确
                    let cleanBase64 = base64Audio.replace(/[^A-Za-z0-9+/]/g, '');
                    while (cleanBase64.length % 4 !== 0) {
                        cleanBase64 += '=';
                    }
                    
                    console.log('准备播放音频，数据长度:', cleanBase64.length);
                    
                    // 创建Data URL
                    const audioDataUrl = 'data:audio/mp3;base64,' + cleanBase64;
                    const audioElement = new Audio(audioDataUrl);
                    
                    // 设置音量
                    audioElement.volume = 1.0;
                    
                    // 播放结束回调
                    audioElement.onended = () => {
                        console.log('音频播放完成');
                        resolve();
                    };
                    
                    // 错误处理
                    audioElement.onerror = (error) => {
                        console.error('Audio元素错误:', error);
                        reject(new Error('音频播放错误'));
                    };
                    
                    // 开始播放
                    audioElement.play().then(() => {
                        console.log('Audio元素开始播放');
                    }).catch((playError) => {
                        console.error('播放请求失败:', playError);
                        reject(playError);
                    });
                } catch (e) {
                    console.error('创建音频播放失败:', e);
                    reject(e);
                }
            });
        }
        
        // 在函数外部定义累积变量
        let accumulatedJson = '';
        let nonStreamChunks = [];
        
        // 处理SSE流
        async function processStream() {
            const { done, value } = await reader.read();
            
            if (done) {
                // 处理剩余的非流数据
                if (nonStreamChunks.length > 0) {
                    console.log('处理最后一批累积的非流数据');
                    const finalChunk = decoder.decode(new Uint8Array(nonStreamChunks), { stream: false });
                    processChunk(finalChunk);
                    nonStreamChunks = [];
                }
                
                console.log('SSE流处理完成');
                // 恢复输入控件
                if (userInput) userInput.disabled = false;
                if (sendBtn) sendBtn.disabled = false;
                return;
            }
            
            // 优化的流数据处理 - 对所有大小的数据块都尝试立即解码和处理
            // 这样可以确保即使是大的数据块也能尽快被处理
            try {
                // 直接解码当前数据块，不再等待累积到一定大小
                const chunk = decoder.decode(value, { stream: false });
                console.log('立即处理数据块，长度:', chunk.length);
                processChunk(chunk);
            } catch (decodeError) {
                console.error('数据解码失败，尝试累积处理:', decodeError);
                // 如果直接解码失败，才进行累积处理
                nonStreamChunks.push(...value);
                
                // 当累积的数据达到一定量时处理
                if (nonStreamChunks.length > 1024 * 64) { // 降低阈值到64KB以便更快处理
                    console.log('累积数据达到阈值，进行处理，累积长度:', nonStreamChunks.length);
                    try {
                        const chunk = decoder.decode(new Uint8Array(nonStreamChunks), { stream: false });
                        processChunk(chunk);
                        nonStreamChunks = []; // 重置累积的二进制数据
                    } catch (accumDecodeError) {
                        console.error('累积数据解码失败:', accumDecodeError);
                        // 保留累积数据，但限制大小
                        if (nonStreamChunks.length > 1024 * 128) {
                            console.warn('累积数据过大，清理部分数据');
                            nonStreamChunks = nonStreamChunks.slice(nonStreamChunks.length - 1024 * 64);
                        }
                    }
                }
            }
            
            // 继续处理流
            processStream();
        }
        
        // 处理解码后的数据块
        function processChunk(chunk) {
            console.log('处理数据块，长度:', chunk.length);
            
            // 处理SSE格式，按行分割
            const lines = chunk.split('\n');

            for (let line of lines) {
                line = line.trim();
                if (!line) continue;

                // 移除data:前缀
                if (line.startsWith('data:')) {
                    line = line.substring(5).trim();
                }
                
                // 跳过空行和结束信号
                if (!line || line === '[DONE]') continue;
                
                // 尝试直接解析当前行
                try {
                    // 首先尝试直接解析这一行，看是否是完整的JSON
                    const data = JSON.parse(line);
                    console.log('成功直接解析单行JSON');
                    
                    // 检查是否有content字段
                    if (data.content && typeof data.content === 'string') {
                        console.log('获取到音频数据，长度:', data.content.length);
                        
                        // 将content添加到队列
                        audioQueue.push(data.content);
                        console.log('音频数据已添加到队列，立即尝试处理');
                        // 确保队列处理函数被调用，无需检查isPlaying状态
                        ensureQueueProcessing();
                    }
                    
                    // 如果这行解析成功，确保累积变量为空
                    accumulatedJson = '';
                } catch (e) {
                    // 当前行不是完整的JSON，需要累积
                    // 但首先检查accumulatedJson是否已经有内容且当前行可能是新的JSON开始
                    if (accumulatedJson && line.startsWith('{')) {
                        // 检查accumulatedJson是否是一个完整的JSON
                        try {
                            const prevData = JSON.parse(accumulatedJson);
                            console.log('发现新的JSON开始，之前累积的数据已解析完成');
                            
                            // 处理之前累积的数据
                            if (prevData.content && typeof prevData.content === 'string') {
                                console.log('获取到音频数据，长度:', prevData.content.length);
                                audioQueue.push(prevData.content);
                                console.log('累积音频数据已添加到队列，立即尝试处理');
                                // 确保队列处理函数被调用
                                ensureQueueProcessing();
                            }
                            
                            // 重置累积变量，开始累积新的JSON
                            accumulatedJson = line;
                        } catch (prevError) {
                            // 之前累积的数据不完整，继续累积
                            accumulatedJson += line;
                            // 限制累积数据的大小，避免内存问题
                            if (accumulatedJson.length > 1024 * 1024) { // 超过1MB时清理
                                console.warn('累积JSON数据过大，清理并尝试新的解析策略');
                                accumulatedJson = line;
                            }
                        }
                    } else {
                        // 正常累积
                        accumulatedJson += line;
                        
                        // 尝试解析累积的数据
                        try {
                            const data = JSON.parse(accumulatedJson);
                            console.log('成功解析累积的JSON');
                            
                            if (data.content && typeof data.content === 'string') {
                                console.log('获取到音频数据，长度:', data.content.length);
                                audioQueue.push(data.content);
                                console.log('累积的完整JSON音频已添加到队列，立即尝试处理');
                                // 确保队列处理函数被调用
                                ensureQueueProcessing();
                            }
                            
                            // 解析成功，重置累积变量
                            accumulatedJson = '';
                        } catch (accumError) {
                            // 累积的数据仍然不完整，继续累积
                            // 静默失败，避免过多警告日志
                            // console.warn('JSON累积中...');
                        }
                    }
                }
            }
        }
        
        // 开始处理流
        console.log('开始处理SSE流，准备实时接收和播放音频数据');
        processStream();
        
        // 确保在流开始处理前，输入控件已禁用
        console.log('流式音频处理已启动，等待数据到达...');
        
    } catch (error) {
        console.error('音频合成过程发生错误:', error);
        // 确保恢复输入控件
        if (userInput) userInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        throw error;
    }
}