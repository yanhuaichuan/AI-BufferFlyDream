// 消息管理模块
import { getMessages, sendMessageAPI, callAIGenerateAPI, processStreamResponse } from './api.js';
import { renderMessages, showError, showLoading, createAssistantMessagePlaceholder, updateAssistantMessage, finishAssistantMessage, scrollToBottom, createMessageElement } from './ui.js';
import { currentPage, pageSize, isLoading, hasMoreMessages, updatePaginationState } from './config.js';

// 加载消息
export async function loadMessages() {
    if (isLoading) return;
    
    // 暴露全局变量到window对象
    window.hasMoreMessages = hasMoreMessages;
    window.isLoading = isLoading;
    window.loadMoreMessages = loadMoreMessages;
    
    updatePaginationState(currentPage, true, hasMoreMessages);
    
    showLoading();

    try {
        const data = await getMessages(1);
        
        if (data) {
            const messages = data.list || [];
            
            // 更新分页状态
            if (messages.length < pageSize) {
                updatePaginationState(currentPage, false, false);
                document.getElementById('load-more-container').classList.add('hidden');
            } else {
                updatePaginationState(currentPage, false, true);
                document.getElementById('load-more-container').classList.remove('hidden');
            }

            // 过滤掉内容为"（空字符串）"或"（已触发【辱骂响应协议】，返回空字符串）"的助手消息
            const filteredMessages = messages.filter(msg => !(msg.role === 'assistant' && 
                                                             (msg.content === '（空字符串）' || msg.content.trim() === '（已触发【辱骂响应协议】，返回空字符串）')));
            
            // 渲染消息
            renderMessages(filteredMessages);
            
            // 更新当前页码
            updatePaginationState(1, false, hasMoreMessages);
            
            // 滚动到底部
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    } catch (error) {
        console.error('加载消息失败:', error);
        showError('获取消息失败，请检查网络连接');
    } finally {
        updatePaginationState(currentPage, false, hasMoreMessages);
    }
}

// 加载更多消息
export async function loadMoreMessages() {
    if (isLoading || !hasMoreMessages) return;
    
    updatePaginationState(currentPage, true, hasMoreMessages);
    const nextPage = currentPage + 1;
    
    // 显示加载更多状态
    const loadMoreBtn = document.getElementById('load-more-btn');
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<div class="inline-flex items-center space-x-2"><div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div><span>加载中...</span></div>';
    loadMoreBtn.disabled = true;
    
    // 记录当前滚动位置
    const container = document.getElementById('chat-container');
    const firstMessage = container.querySelector('#messages-container > div:first-child');
    const scrollOffset = firstMessage ? firstMessage.offsetTop - container.scrollTop : 0;
    
    try {
        const data = await getMessages(nextPage);
        
        if (data) {
            const messages = data.list || [];
            
            // 更新分页状态
            if (messages.length < pageSize) {
                updatePaginationState(nextPage, false, false);
                document.getElementById('load-more-container').classList.add('hidden');
            } else {
                updatePaginationState(nextPage, false, true);
            }
            
            if (messages.length > 0) {
                // 过滤掉内容为"（空字符串）"或"（已触发【辱骂响应协议】，返回空字符串）"的助手消息
                const filteredMessages = messages.filter(msg => !(msg.role === 'assistant' && 
                                                                 (msg.content === '（空字符串）' || msg.content.trim() === '（已触发【辱骂响应协议】，返回空字符串）')));
                
                // 渲染消息到顶部
                renderMessages(filteredMessages, true);
                
                // 更新当前页码
                updatePaginationState(nextPage, false, hasMoreMessages);
                
                // 恢复滚动位置
                if (firstMessage) {
                    const newFirstMessage = container.querySelector('#messages-container > div:first-child');
                    if (newFirstMessage) {
                        container.scrollTop = newFirstMessage.offsetTop - scrollOffset;
                    }
                }
            }
        }
    } catch (error) {
        console.error('加载更多消息失败:', error);
        showError('加载更多消息失败，请重试');
    } finally {
        // 恢复按钮状态
        loadMoreBtn.innerHTML = originalText;
        loadMoreBtn.disabled = false;
        updatePaginationState(currentPage, false, hasMoreMessages);
    }
}

// 发送消息
export async function sendMessage(message) {
    if (!message.trim()) return;

    let sendButton = null;
    document.querySelectorAll('button').forEach(button => {
        if (button.textContent.includes('发送')) {
            sendButton = button;
        }
    });
    
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.classList.add('opacity-70', 'cursor-not-allowed');
    }

    try {
        // 显示用户消息
        const userMessage = {
            id: Date.now(),
            content: message,
            role: 'user',
            created_at: new Date().toISOString()
        };

        // 将用户消息添加到消息列表
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            const messageElement = createMessageElement(userMessage);
            messagesContainer.appendChild(messageElement);
            
            // 立即滚动到底部
            scrollToBottom();
        }

        // 调用API发送消息
        const messageId = await sendMessageAPI(message);

        if (messageId) {
            console.log('用户消息发送成功，messageId:', messageId);
            
            // 清除输入框内容
            const textarea = document.querySelector('#message-input');
            if (textarea) {
                textarea.value = '';
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
            
            // 调用AI生成接口获取回复
            await handleAIGenerateResponse(messageId);
            
        } else {
            throw new Error('发送消息失败');
        }

    } catch (error) {
        console.error('发送消息出错:', error);
        showError('发送消息失败，请稍后重试');
    } finally {
        // 恢复发送按钮状态
        if (sendButton) {
            setTimeout(() => {
                sendButton.disabled = false;
                sendButton.classList.remove('opacity-70', 'cursor-not-allowed');
            }, 1000);
        }
    }
}

// 处理AI生成响应
export async function handleAIGenerateResponse(messageId) {
    // 创建AI回复占位符
    const assistantMessageId = createAssistantMessagePlaceholder();
    
    try {
        // 调用AI生成接口
        const response = await callAIGenerateAPI(messageId);
        
        // 处理流式响应
        await processStreamResponse(
            response,
            (content) => {
                // 实时更新AI回复内容
                // 处理HTML实体编码，将&amp;替换回&
                const fixedContent = content.replace(/&amp;/g, '&');
                updateAssistantMessage(assistantMessageId, fixedContent);
            },
            (finalContent) => {
                // 完成处理前检查内容
                // 处理HTML实体编码，将&amp;替换回&
                const fixedFinalContent = finalContent.replace(/&amp;/g, '&');
                
                if (fixedFinalContent === '（空字符串）' || fixedFinalContent.trim() === '（已触发【辱骂响应协议】，返回空字符串）') {
                    // 如果是"（空字符串）"，删除该消息元素
                    const assistantMessageElement = document.getElementById(assistantMessageId);
                    if (assistantMessageElement && assistantMessageElement.parentNode) {
                        assistantMessageElement.parentNode.removeChild(assistantMessageElement);
                    }
                } else {
                    // 正常处理
                    finishAssistantMessage(assistantMessageId, fixedFinalContent);
                }
            }
        );
        
    } catch (error) {
        console.error('获取AI回复失败:', error);
        showError('获取AI回复失败，请稍后重试');
        
        // 更新AI回复为错误信息
        const assistantMessageElement = document.getElementById(assistantMessageId);
        if (assistantMessageElement) {
            const contentElement = assistantMessageElement.querySelector('p.text-gray-800');
            if (contentElement) {
                contentElement.textContent = '抱歉，获取回复时出现错误';
                contentElement.classList.add('text-red-500');
            }
        }
    }
}