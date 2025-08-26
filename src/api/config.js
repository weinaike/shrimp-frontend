// API配置文件
export const API_BASE_URL = '/api';

// API端点构造函数
export const apiEndpoints = {
  // 项目相关
  projects: () => `${API_BASE_URL}/projects`,
  project: (projectId) => `${API_BASE_URL}/project/${projectId}`,
  
  // 任务相关
  tasks: (projectId) => `${API_BASE_URL}/${projectId}/tasks`,
  task: (projectId, taskId) => `${API_BASE_URL}/${projectId}/tasks/${taskId}`,
  taskTodos: (projectId, taskId) => `${API_BASE_URL}/${projectId}/tasks/${taskId}/todos`,
  
  // 记忆相关
  memories: (projectId) => `${API_BASE_URL}/${projectId}/memories`,
  memory: (projectId, memoryId) => `${API_BASE_URL}/${projectId}/memories/${memoryId}`,
  
  // 会话状态相关
  sessions: (projectId) => `${API_BASE_URL}/${projectId}/sessions`,
  sessionDocuments: (projectId, sessionId) => `${API_BASE_URL}/${projectId}/sessions/${sessionId}/documents`,
  deleteSessionDocuments: (projectId, sessionId) => `${API_BASE_URL}/${projectId}/sessions/${sessionId}/documents`,
  
  // JSON文档相关
  deleteJsonDocument: (projectId, documentId) => `${API_BASE_URL}/${projectId}/json-documents/${documentId}`,
    
  // 健康检查
  health: () => `${API_BASE_URL}/health`,
};
