// API配置模块
export let API_CONFIG = {
    baseUrl: 'http://10.1.20.40:8002',
    conversationId: 'bdb294a5-a509-4312-8b87-ae616fcd8c56',
    authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImFwcElkIjoiNjg5YWE2ZWYwNmY2YzEyYmViYWExNmNmIiwiY2xpZW50SWQiOiI2N2U2NzM2ZDE1MmE0NWM0ODE5Y2RmNGEiLCJlbWFpbCI6InRlc3RAdGVzdC50ZXN0IiwiaWQiOiI2ODlhYTZlZjA2ZjZjMTJiZWJhYTE2Y2YiLCJvcGVuaWQiOm51bGwsInBob25lIjoiMTc3Nzc3Nzc3NzciLCJ0eXBlIjoidXNlciIsInVuaW9uaWQiOm51bGwsInVzZXJJZCI6IjY4OWFhNmVmMDZmNmMxMmJlYmFhMTZjZiIsInVzZXJuYW1lIjoidGVzdCJ9LCJleHAiOjE4OTQ4NzU3NzgsImlhdCI6MTc1ODg3NTc3OCwidWlkIjoxMjM0NX0.oFMPRZcQ6hB5lVvKOiAJAPX8iYHTpfy3VACF9IwtiiU'
};

// 更新会话ID的函数
export function updateConversationId(newConversationId) {
    API_CONFIG.conversationId = newConversationId;
}

// 分页状态管理
export let currentPage = 1;
export const pageSize = 10;
export let isLoading = false;
export let hasMoreMessages = true;

// 更新分页状态
export function updatePaginationState(page, loading, hasMore) {
    currentPage = page;
    isLoading = loading;
    hasMoreMessages = hasMore;
}

// 重置分页状态
export function resetPagination() {
    currentPage = 1;
    isLoading = false;
    hasMoreMessages = true;
}