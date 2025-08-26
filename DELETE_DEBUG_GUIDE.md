## 删除功能调试指南

### 问题排查步骤

1. **检查浏览器开发者工具控制台**
   - 打开浏览器 F12 开发者工具
   - 查看 Console 标签页
   - 删除文档时应该看到以下日志：
     ```
     开始删除文档: {sessionId: "xxx", docId: "xxx", selectedItem: {...}}
     Deleting document: {projectId: "xxx", documentId: "xxx", url: "xxx"}
     Document deleted successfully
     删除成功，更新本地状态
     文档过滤前: X 过滤后: Y
     延迟刷新开始
     Fetching session documents: {projectId: "xxx", sessionId: "xxx", url: "xxx", forceReload: true}
     延迟刷新完成
     ```

2. **检查网络请求**
   - 打开 Network 标签页
   - 删除文档时应该看到：
     - DELETE 请求到 `/api/{projectId}/json-documents/{documentId}`
     - 状态码应该是 200
     - 然后有 GET 请求重新加载数据

3. **后端日志检查**
   - 检查后端服务日志
   - 确认删除请求是否到达后端
   - 确认数据库删除操作是否成功

4. **常见问题**
   - **文档仍显示**：可能是缓存问题或状态更新延迟
   - **删除请求失败**：检查权限、项目ID、文档ID是否正确
   - **网络错误**：检查后端服务是否正常运行

### 临时解决方案

如果删除后文档仍显示，可以：
1. 关闭并重新打开模态框
2. 刷新整个页面
3. 清除浏览器缓存

### 代码修改说明

已实现的改进：
- ✅ 添加删除功能API配置
- ✅ 实现智能体和会话删除方法
- ✅ 改进选中状态样式区分
- ✅ 添加删除确认对话框
- ✅ 立即从本地状态移除已删除文档
- ✅ 延迟刷新确保数据同步
- ✅ 强制重新加载机制
- ✅ 详细的调试日志
