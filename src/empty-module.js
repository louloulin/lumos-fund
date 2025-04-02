// 这是一个空的模块，用于在客户端替代服务器端模块
// 当Webpack尝试在客户端加载服务器专用模块时，将使用此模块
module.exports = {
  Mastra: function() {
    console.warn('Mastra is only available on the server');
    return {};
  },
  Agent: function() {
    console.warn('Agent is only available on the server');
    return {};
  },
  Tool: function() {
    console.warn('Tool is only available on the server');
    return {};
  },
  Workflow: function() {
    console.warn('Workflow is only available on the server');
    return {};
  },
  // 添加占位符默认导出
  default: {}
}; 