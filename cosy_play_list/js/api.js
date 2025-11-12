import { API_CONFIG, pageSize } from './config.js';

// 获取消息列表API
export async function getMessages(page = 1) {
    try {
        const url = `${API_CONFIG.baseUrl}/v1/conversations/${API_CONFIG.conversationId}/messages?page=${page}&page_size=${pageSize}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': API_CONFIG.authToken,
                'Accept': '*/*',
                'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
                'Host': '10.1.20.40:8002',
                'Connection': 'keep-alive'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.code === 200) {
            return data.data;
        } else {
            throw new Error(data.message || 'API返回错误');
        }
    } catch (error) {
        console.error('获取消息失败:', error);
        throw error;
    }
}

// 发送消息API
export async function sendMessageAPI(message) {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/v1/conversations/${API_CONFIG.conversationId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_CONFIG.authToken
            },
            body: JSON.stringify({
                content: message,
                role: 'user',
                type: 'text'
            })
        });

        const data = await response.json();

        if (data.code === 200 && data.data && data.data.id) {
            return data.data.id;
        } else {
            throw new Error(data.message || '发送消息失败');
        }
    } catch (error) {
        console.error('发送消息API出错:', error);
        throw error;
    }
}

// 调用AI生成接口获取回复
export async function callAIGenerateAPI(messageId) {
    try {
        console.log('调用AI生成接口，messageId:', messageId);

        const response = await fetch('http://10.1.20.40:8003/v1/chat/stream/game/me/play/yes/del', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_CONFIG.authToken
            },
            body: JSON.stringify({
                messageId: messageId,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('调用AI生成接口出错:', error);
        throw error;
    }
}

// 处理流式响应
export async function processStreamResponse(response, onContent, onFinish) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let isFinished = false;

    function readStream() {
        return reader.read().then(({ done, value }) => {
            if (done) {
                isFinished = true;
                onFinish(fullResponse);
                return;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log('接收到数据块:', chunk);

            const lines = chunk.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                if (trimmedLine.startsWith('data:')) {
                    const jsonStr = trimmedLine.substring(5).trim();
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        console.log('解析成功的数据:', data);

                        if (data.content && !data.isFinished) {
                            fullResponse += data.content;
                            console.log('累计响应内容:', fullResponse);
                            onContent(fullResponse);
                        }

                        if (data.isFinished) {
                            isFinished = true;
                            console.log('接收到完成标记');
                            onFinish(fullResponse);
                        }
                    } catch (e) {
                        console.error('解析JSON错误:', e, '原始数据:', jsonStr);
                    }
                } else {
                    // 备用解析方案
                    try {
                        const data = JSON.parse(trimmedLine);
                        console.log('直接解析JSON成功:', data);

                        if (data.content && !data.isFinished) {
                            fullResponse += data.content;
                            console.log('累计响应内容:', fullResponse);
                            onContent(fullResponse);
                        }

                        if (data.isFinished) {
                            isFinished = true;
                            console.log('接收到完成标记');
                            onFinish(fullResponse);
                        }
                    } catch (e) {
                        console.error('直接解析失败:', e, '原始数据:', trimmedLine);
                    }
                }
            }

            if (!isFinished) {
                return readStream();
            }
        });
    }

    return readStream();
}