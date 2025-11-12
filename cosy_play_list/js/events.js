// 事件处理模块
import { loadMoreMessages, sendMessage, loadMessages } from './messageManager.js';
import { checkScrollForLoadMore } from './ui.js';
import { hasMoreMessages, isLoading } from './config.js';

// 初始化事件监听器
export function initializeEventListeners() {
    // 加载更多按钮事件
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            loadMoreMessages();
        });
    }

    // 清除按钮点击事件 - 使用ID选择器避免重复绑定
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const textarea = document.querySelector('#message-input');
            if (textarea) {
                textarea.value = '';
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
        });
    }

    // 发送按钮点击事件 - 使用ID选择器避免重复绑定
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            const textarea = document.querySelector('#message-input');
            if (textarea && textarea.value.trim()) {
                sendMessage(textarea.value.trim());
            }
        });
    }

    // 智能体选择功能
        document.querySelectorAll('.agent-item').forEach(item => {
            item.addEventListener('click', async function() {
                // 移除所有active状态
                document.querySelectorAll('.agent-item').forEach(i => {
                    i.classList.remove('agent-active');
                });
                
                // 添加当前active状态
                this.classList.add('agent-active');
                
                // 获取智能体数据
                const agentName = this.querySelector('h3').textContent;
                const agentDesc = this.querySelector('p').textContent;
                const conversationId = this.getAttribute('data-conversation-id') || this.getAttribute('data-agent-id');
                const agentImage = this.getAttribute('data-agent-image');
                
                // 更新聊天框图片
                const chatImage = document.querySelector('.agent-item.agent-active img');
                if (chatImage) {
                    chatImage.src = agentImage;
                    chatImage.alt = agentName;
                }
                
                // 更新顶部导航栏的头像、名称和描述
                const headerAvatar = document.getElementById('chat-agent-avatar');
                const headerName = document.getElementById('chat-agent-name');
                const headerDesc = document.getElementById('chat-agent-desc');
                
                if (headerAvatar) {
                    headerAvatar.src = agentImage;
                    headerAvatar.alt = agentName;
                }
                if (headerName) headerName.textContent = agentName;
                if (headerDesc) headerDesc.textContent = agentDesc;
                
                // 更新会话ID
                if (conversationId) {
                    try {
                        const configModule = await import('./config.js');
                        configModule.updateConversationId(conversationId);
                    } catch (error) {
                        console.error('Failed to update conversation ID:', error);
                    }
                }
                
                // 刷新消息列表
                loadMessages();
            });
        });

    // 响应式面板切换
    document.getElementById('toggle-agent-panel').addEventListener('click', function () {
        document.getElementById('agent-panel').classList.toggle('hidden');
    });

    // 文本输入框自动调整高度
    const textarea = document.getElementById('message-input');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // 滚动加载检测
    let scrollTimeout;
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                checkScrollForLoadMore();
            }, 100);
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 确保事件监听器只初始化一次
    if (!window.eventListenersInitialized) {
        initializeEventListeners();
        window.eventListenersInitialized = true;
    }
    
    // 页面加载完成后隐藏启动画面并加载消息
    setTimeout(() => {
        // 加载初始消息
        loadMessages();
    }, 100);
});