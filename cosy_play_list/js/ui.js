// UI组件和事件处理模块

// HTML转义函数
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 将文本中的URL转换为可点击链接，将图片URL转换为图片显示
export function convertUrlsToLinks(text) {
    if (!text) return '';
    
    // 正则表达式匹配HTTP和HTTPS链接，改进以处理URL中包含转义字符和后面紧跟中文字符的情况
    const urlRegex = /(https?:\/\/[^`"\s\u4e00-\u9fa5]+(?:[&?][^`"\s\u4e00-\u9fa5]+)*)/gi;
    
    return text.replace(urlRegex, function(url) {
        // 使用escapeHtml确保链接内容安全
        const escapedUrl = escapeHtml(url);
        
        // 检查是否为图片URL
        const isImage = isImageUrl(url);
        
        if (isImage) {
            // 对于图片URL，将HTML实体编码的'&amp;'替换回'&'，然后返回图片标签
            const fixedUrl = escapedUrl.replace(/&amp;/g, '&');
            return `<div class="my-2">
                      <img src="${fixedUrl}" 
                           alt="图片预览" 
                           class="max-w-full h-auto rounded-lg shadow-md border border-gray-200 
                                  transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
                           onclick="window.open(this.src, '_blank')"
                           loading="lazy">
                    </div>`;
        } else {
            // 对于普通链接，保持现有的方块链接样式
            // 将HTML实体编码的'&amp;'替换回'&'
            const fixedUrl = escapedUrl.replace(/&amp;/g, '&');
            
            // 提取域名部分用于显示
            let displayUrl = url;
            try {
                // 尝试解析URL以获取更简洁的显示文本
                const urlObj = new URL(url);
                displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname.substring(0, 30) + (urlObj.pathname.length > 30 ? '...' : '') : '');
            } catch (e) {
                // 如果解析失败，就使用整个URL，但限制长度
                if (url.length > 40) {
                    displayUrl = url.substring(0, 40) + '...';
                }
            }
            
            // 生成美观的方块链接样式，类似豆包设计
            return `<a href="${fixedUrl}" target="_blank" rel="noopener noreferrer" 
                      class="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg 
                             hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 
                             font-medium text-sm group overflow-hidden">
                      <span class="truncate">${displayUrl}</span>
                      <span class="ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </a>`;
        }
    });
}

// 判断URL是否指向图片
function isImageUrl(url) {
    // 常见的图片扩展名
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    
    // 转换为小写进行比较
    const lowerUrl = url.toLowerCase();
    
    // 检查URL中是否包含常见图片扩展名
    for (const ext of imageExtensions) {
        if (lowerUrl.includes(ext)) {
            return true;
        }
    }
    
    // 检查URL参数中是否包含图片相关标识，如例子中的"JPEG"或转义形式
    if (lowerUrl.includes('jpeg') || 
        lowerUrl.includes('jpg') || 
        lowerUrl.includes('png') || 
        lowerUrl.includes('gif') || 
        lowerUrl.includes('image') || 
        lowerUrl.includes('img') ||
        // 检查是否包含图片格式参数标识，如例子中的"f=JPEG"
        /[?&]f=(jpeg|jpg|png|gif|webp|bmp)/i.test(lowerUrl)) {
        return true;
    }
    
    return false;
}

// 格式化时间
export function formatTime(timestamp) {
    if (!timestamp) return '';
    
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    } catch (error) {
        return timestamp;
    }
}

// 创建单个消息元素
export function createMessageElement(message, index) {
    // 如果AI返回的内容是空字符串，则不创建消息元素
    if (message.role === 'assistant' && message.content === '（空字符串）' || message.content.trim() === '（已触发【辱骂响应协议】，返回空字符串）') {
        return null;
    }
    
    const messageDiv = document.createElement('div');
    
    // 设置消息元素的ID
    if (message.id) {
        messageDiv.id = message.id;
    }
    
    // 根据角色设置不同的样式
    if (message.role === 'user') {
        // 用户消息
        messageDiv.className = 'w-full max-w-3xl mx-auto flex items-start justify-end message-appear';
        messageDiv.style.animationDelay = `${index * 0.1}s`;
        
        messageDiv.innerHTML = `
            <div class="flex-1 max-w-lg ml-auto">
                <div class="bg-white rounded-2xl rounded-tr-none p-4 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
                    <p class="text-gray-800">${convertUrlsToLinks(message.content)}</p>
                </div>
                <div class="flex justify-end mt-2 text-xs text-gray-500">
                    <span>${formatTime(message.created_at)}</span>
                </div>
            </div>
            <img src="https://download.xinbankeji.com/xbxcx/image/2025/10/22/file_41b69231-ff64-46.png" alt="用户头像" class="w-10 h-10 rounded-full ml-3 flex-shrink-0 border-2 border-white shadow-sm transition-transform duration-300 hover:scale-105">
        `;
    } else if (message.role === 'assistant') {
        // 助手消息
        messageDiv.className = 'w-full max-w-3xl mx-auto flex items-start message-appear';
        messageDiv.style.animationDelay = `${index * 0.1}s`;
        
        // 获取当前智能体的头像
        let agentImage = 'https://download.xinbankeji.com/xbxcx/image/2025/10/22/file_41fcddb3-9ac4-4e.png'; // 默认图片
        let agentName = '智能助手';
        
        try {
            const activeAgent = document.querySelector('.agent-item.agent-active');
            if (activeAgent) {
                const agentImageAttr = activeAgent.getAttribute('data-agent-image');
                const agentNameElement = activeAgent.querySelector('h3');
                
                if (agentImageAttr) agentImage = agentImageAttr;
            }
        } catch (error) {
            console.warn('获取智能体信息失败，使用默认头像:', error);
        }
        
        messageDiv.innerHTML = `
            <img src="${agentImage}" alt="${agentName}" class="w-10 h-10 rounded-full mr-3 flex-shrink-0 border-2 border-white shadow-sm transition-transform duration-300 hover:scale-105 object-cover">
            <div class="flex-1 max-w-lg">
                <div class="bg-white/80 backdrop-blur-sm rounded-2xl rounded-tl-none p-4 shadow-lg border border-white/40 transition-all duration-300 hover:shadow-xl">
                    <p class="text-gray-800">${convertUrlsToLinks(message.content)}</p>
                </div>
                <div class="flex justify-start mt-2 text-xs text-gray-500">
                    <span>${formatTime(message.created_at)}</span>
                </div>
            </div>
        `;
    }
    
    return messageDiv;
}

// 渲染消息列表
export function renderMessages(messages, prepend = false) {
    const container = document.getElementById('messages-container');
    
    if (!container) return;
    
    // 清空容器（如果不是追加模式）
    if (!prepend) {
        container.innerHTML = '';
    }
    
    // 对消息进行排序（最新的在后）
    const sortedMessages = messages.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at);
    });
    
    // 创建消息元素
    sortedMessages.forEach((message, index) => {
        const messageElement = createMessageElement(message, index);
        
        // 只有当消息元素存在时才添加到DOM
        if (messageElement) {
            if (prepend) {
                container.insertBefore(messageElement, container.firstChild);
            } else {
                container.appendChild(messageElement);
            }
        }
    });
    
    // 如果不是追加模式，滚动到底部
    if (!prepend) {
        setTimeout(() => {
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    }
}

// 显示错误信息
export function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'w-full max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm';
    errorDiv.innerHTML = `<div class="flex items-center space-x-2"><i class="fa fa-exclamation-triangle"></i><span>${message}</span></div>`;
    
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.appendChild(errorDiv);
    }
}

// 显示加载状态
export function showLoading() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.innerHTML = '<div class="w-full max-w-3xl mx-auto text-center py-8"><div class="inline-flex items-center space-x-2 text-gray-500"><div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div><span>加载消息中...</span></div></div>';
    }
}

// 更新AI回复内容
export function updateAssistantMessage(assistantMessageId, content) {
    const assistantMessageElement = document.getElementById(assistantMessageId);
    if (assistantMessageElement) {
        const contentElement = assistantMessageElement.querySelector('p.text-gray-800');
        if (contentElement) {
            // 使用convertUrlsToLinks处理内容，将URL转换为可点击链接，将图片URL转换为图片显示
            contentElement.innerHTML = convertUrlsToLinks(content);
        }
    }
}

// 完成AI回复处理
export function finishAssistantMessage(assistantMessageId, content) {
    const assistantMessageElement = document.getElementById(assistantMessageId);
    if (assistantMessageElement) {
        // 移除思考状态
        const thinkingElement = assistantMessageElement.querySelector('.thinking-indicator');
        if (thinkingElement) {
            thinkingElement.remove();
        }
        
        // 确保内容正确显示
        const contentElement = assistantMessageElement.querySelector('p.text-gray-800');
        if (contentElement) {
            // 使用convertUrlsToLinks处理内容，将URL转换为可点击链接，将图片URL转换为图片显示
            contentElement.innerHTML = convertUrlsToLinks(content);
        }
    }
}

// 创建AI回复占位符
export function createAssistantMessagePlaceholder() {
    const assistantMessageId = 'assistant-message-' + Date.now();
    const messagesContainer = document.getElementById('messages-container');
    
    if (messagesContainer) {
        const assistantMessage = {
            id: assistantMessageId,
            content: '思考中...',
            role: 'assistant',
            created_at: new Date().toISOString()
        };
        
        const messageElement = createMessageElement(assistantMessage);
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    return assistantMessageId;
}

// 滚动到底部
export function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// 检查是否需要加载更多消息
export function checkScrollForLoadMore() {
    const container = document.getElementById('chat-container');
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    
    // 如果滚动到顶部附近且有更多消息，加载更多
    if (scrollTop < 100 && window.hasMoreMessages && !window.isLoading) {
        window.loadMoreMessages();
    }
}