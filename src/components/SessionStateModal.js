import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Spinner, Alert, Button, Dropdown } from 'react-bootstrap';
import { apiEndpoints } from '../api/config';
import './SessionStateModal.css';

// 内联样式
const treeStyles = {
  treeView: {
    fontSize: '14px'
  },
  treeNode: {
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    margin: '2px 0',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease'
  },
  treeSessionNode: {
    fontWeight: '600',
    backgroundColor: '#f8f9fa'
  },
  treeTypeNode: {
    marginLeft: '20px',
    fontWeight: '500',
    backgroundColor: '#ffffff'
  },
  treeDocNode: {
    marginLeft: '40px',
    fontSize: '13px',
    backgroundColor: '#ffffff'
  },
  treeDocNodeSelected: {
    backgroundColor: '#0d6efd !important',
    color: 'white !important',
    fontWeight: '500'
  },
  treeDocNodeHover: {
    backgroundColor: '#f8f9fa',
    transition: 'all 0.15s ease'
  },
  treeSessionNodeSelected: {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #0d6efd'
  },
  treeTypeNodeSelected: {
    backgroundColor: '#e8f5e8',
    borderLeft: '3px solid #198754'
  },
  treeSessionContent: {
    marginLeft: '10px',
    borderLeft: '2px solid #e9ecef',
    paddingLeft: '10px'
  },
  treeDocList: {
    marginLeft: '10px'
  },
  treeEmpty: {
    marginLeft: '40px',
    padding: '8px 12px',
    color: '#6c757d',
    fontStyle: 'italic',
    fontSize: '12px'
  },
  treeLoading: {
    marginLeft: '20px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    color: '#6c757d'
  },
  treeNodeText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
};

function SessionStateModal({ show, handleClose, projectId }) {
  const [sessions, setSessions] = useState([]);
  const [sessionDocuments, setSessionDocuments] = useState({});
  const [selectedItem, setSelectedItem] = useState(null); // 选中的项目 {type: 'document', sessionId, docType, doc}
  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState({});
  const [error, setError] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [expandedTypes, setExpandedTypes] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (show && projectId) {
      fetchSessions();
    }
  }, [show, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSessions = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    try {
      const url = apiEndpoints.sessions(projectId);
      
      const response = await fetch(url, {
        headers: {
          'X-Project-ID': projectId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        const errorText = await response.text();
        console.error('Sessions fetch error:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          projectId
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
      setError(`获取会话列表失败: ${error.message}`);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDocuments = async (sessionId, forceReload = false) => {
    if (!projectId || !sessionId) return;
    if (!forceReload && sessionDocuments[sessionId]) return; // 已经加载过了

    setDocumentsLoading(prev => ({ ...prev, [sessionId]: true }));
    try {
      const url = apiEndpoints.sessionDocuments(projectId, sessionId);
      
      const response = await fetch(url, {
        headers: {
          'X-Project-ID': projectId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const documents = await response.json();
        setSessionDocuments(prev => ({
          ...prev,
          [sessionId]: documents || []
        }));
        
      } else {
        const errorText = await response.text();
        console.error('Session documents fetch error:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          projectId,
          sessionId
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('获取会话文档失败:', error);
      setSessionDocuments(prev => ({
        ...prev,
        [sessionId]: []
      }));
    } finally {
      setDocumentsLoading(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
    
    // 如果展开且没有加载过文档，则加载
    if (!expandedSessions[sessionId] && !sessionDocuments[sessionId]) {
      fetchSessionDocuments(sessionId);
    }
  };

  const toggleDocumentType = (sessionId, docType) => {
    const key = `${sessionId}_${docType}`;
    setExpandedTypes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  // 获取文档ID的辅助函数
  const getDocumentId = (doc) => {
    // 尝试多种可能的ID字段名
    return doc.id || doc._id || doc.document_id || null;
  };

  const deleteJsonDocument = async (projectId, documentId) => {
    if (!projectId || !documentId) {
      return false;
    }
    
    setDeleteLoading(true);
    try {
      const url = apiEndpoints.deleteJsonDocument(projectId, documentId);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Project-ID': projectId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        console.error('Document deletion error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`删除失败: HTTP ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('删除文档失败:', error);
      setError(`删除文档失败: ${error.message}`);
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteSessionDocuments = async (projectId, sessionId) => {
    if (!projectId || !sessionId) return false;
    
    setDeleteLoading(true);
    try {
      const url = apiEndpoints.deleteSessionDocuments(projectId, sessionId);
      console.log('Deleting session documents:', { projectId, sessionId, url });
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-Project-ID': projectId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        console.error('Session documents deletion error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`删除失败: HTTP ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('删除会话文档失败:', error);
      setError(`删除会话文档失败: ${error.message}`);
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteDocument = async (docToDelete = null) => {
    const targetItem = docToDelete || selectedItem;
    
    if (!targetItem || targetItem.type !== 'document') {
      return;
    }
    
    if (!window.confirm('确定要删除这个文档吗？此操作不可撤销。')) {
      return;
    }

    const sessionId = targetItem.sessionId;
    const docId = getDocumentId(targetItem.doc);
    
    if (!docId) {
      setError('无法获取文档ID，删除失败');
      return;
    }
    
    const success = await deleteJsonDocument(projectId, docId);
    if (success) {
      // 立即从本地状态中移除该文档
      setSessionDocuments(prev => {
        if (!prev[sessionId]) {
          return prev;
        }
        
        const currentDocs = prev[sessionId];
        const updatedDocuments = currentDocs.filter(doc => getDocumentId(doc) !== docId);
        
        return {
          ...prev,
          [sessionId]: updatedDocuments
        };
      });
      
      // 如果删除的是当前选中的文档，清除选中状态
      if (selectedItem?.doc && getDocumentId(selectedItem.doc) === docId) {
        setSelectedItem(null);
      }
      
      // 延迟重新加载以确保数据一致性
      setTimeout(async () => {
        await fetchSessionDocuments(sessionId, true);
        await fetchSessions();
      }, 300);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!sessionId) return;
    
    if (!window.confirm(`确定要删除会话 "${sessionId}" 的所有数据吗？此操作不可撤销。`)) {
      return;
    }

    const success = await deleteSessionDocuments(projectId, sessionId);
    if (success) {
      // 如果当前选中的是被删除会话的文档，清除选中状态
      if (selectedItem && selectedItem.sessionId === sessionId) {
        setSelectedItem(null);
      }
      
      // 延迟一点再刷新，确保删除操作已完成
      setTimeout(async () => {
        // 清除会话文档缓存
        setSessionDocuments(prev => {
          const newDocuments = { ...prev };
          delete newDocuments[sessionId];
          return newDocuments;
        });
        
        // 清除展开状态
        setExpandedSessions(prev => {
          const newExpanded = { ...prev };
          delete newExpanded[sessionId];
          return newExpanded;
        });
        
        // 清除类型展开状态
        setExpandedTypes(prev => {
          const newExpanded = { ...prev };
          Object.keys(newExpanded).forEach(key => {
            if (key.startsWith(`${sessionId}_`)) {
              delete newExpanded[key];
            }
          });
          return newExpanded;
        });
        
        // 重新加载会话列表
        await fetchSessions();
      }, 500);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',  // 指定时区为CST
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,  // 24小时制
    });
  };

  const getDocumentsByType = (documents, type) => {
    return (documents || []).filter(doc => doc.document_type === type);
  };

  const renderTreeView = () => {
    return (
      <div style={treeStyles.treeView}>
        {sessions.map((session) => {
          const sessionId = session.session_id;
          const isSessionExpanded = expandedSessions[sessionId];
          const documents = sessionDocuments[sessionId] || [];
          const isLoadingDocs = documentsLoading[sessionId];
          
          const agentDocs = getDocumentsByType(documents, 'agent_component_model');
          const stateDocs = getDocumentsByType(documents, 'session_state');
          
          return (
            <div key={sessionId} className="tree-session">
              {/* Session 节点 */}
              <div 
                style={{
                  ...treeStyles.treeNode,
                  ...treeStyles.treeSessionNode,
                  ...(isSessionExpanded ? treeStyles.treeSessionNodeSelected : {})
                }}
                onClick={() => toggleSession(sessionId)}
                onMouseEnter={(e) => {
                  if (!isSessionExpanded) e.target.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  if (!isSessionExpanded) e.target.style.backgroundColor = '#f8f9fa';
                }}
              >
                <i className={`bi ${isSessionExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} me-2`}></i>
                <i className="bi bi-chat-dots me-2 text-primary"></i>
                <span style={treeStyles.treeNodeText} title={sessionId}>
                  {sessionId}
                </span>
                <Badge bg="info" className="ms-2" style={{ fontSize: '10px' }}>{session.document_count}</Badge>
                
                {/* 会话删除按钮 */}
                <Dropdown className="ms-2" onClick={(e) => e.stopPropagation()}>
                  <Dropdown.Toggle 
                    variant="outline-secondary" 
                    size="sm" 
                    style={{ 
                      border: 'none', 
                      padding: '2px 6px',
                      fontSize: '12px',
                      opacity: 0.7
                    }}
                    className="dropdown-toggle-no-caret"
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item 
                      onClick={() => handleDeleteSession(sessionId)}
                      className="text-danger"
                      disabled={deleteLoading}
                    >
                      <i className="bi bi-trash me-2"></i>
                      删除会话
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              
              {/* Session 展开内容 */}
              {isSessionExpanded && (
                <div style={treeStyles.treeSessionContent}>
                  {isLoadingDocs ? (
                    <div style={treeStyles.treeLoading}>
                      <Spinner animation="border" size="sm" />
                      <span className="ms-2">加载中...</span>
                    </div>
                  ) : (
                    <>
                      {/* 智能组件模型 */}
                      <div className="tree-doc-type">
                        <div 
                          style={{
                            ...treeStyles.treeNode,
                            ...treeStyles.treeTypeNode,
                            ...(expandedTypes[`${sessionId}_agent_component_model`] ? treeStyles.treeTypeNodeSelected : {})
                          }}
                          onClick={() => toggleDocumentType(sessionId, 'agent_component_model')}
                          onMouseEnter={(e) => {
                            if (!expandedTypes[`${sessionId}_agent_component_model`]) e.target.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            if (!expandedTypes[`${sessionId}_agent_component_model`]) e.target.style.backgroundColor = '#ffffff';
                          }}
                        >
                          <i className={`bi ${expandedTypes[`${sessionId}_agent_component_model`] ? 'bi-chevron-down' : 'bi-chevron-right'} me-2`}></i>
                          <i className="bi bi-cpu me-2 text-success"></i>
                          <span style={treeStyles.treeNodeText}>智能体</span>
                          <Badge bg="success" className="ms-2" style={{ fontSize: '10px' }}>{agentDocs.length}</Badge>
                        </div>
                        
                        {expandedTypes[`${sessionId}_agent_component_model`] && (
                          <div style={treeStyles.treeDocList}>
                            {agentDocs.length === 0 ? (
                              <div style={treeStyles.treeEmpty}>暂无数据</div>
                            ) : (
                              agentDocs.map((doc, index) => (
                                <div 
                                  key={getDocumentId(doc) || index}
                                  style={{
                                    ...treeStyles.treeNode,
                                    ...treeStyles.treeDocNode,
                                    ...(selectedItem?.doc && getDocumentId(selectedItem.doc) === getDocumentId(doc) ? treeStyles.treeDocNodeSelected : {})
                                  }}
                                  onClick={() => handleItemSelect({
                                    type: 'document',
                                    sessionId,
                                    docType: 'agent_component_model',
                                    doc
                                  })}
                                  onMouseEnter={(e) => {
                                    if (!selectedItem?.doc || getDocumentId(selectedItem.doc) !== getDocumentId(doc)) {
                                      e.target.style.backgroundColor = '#f0f0f0';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!selectedItem?.doc || getDocumentId(selectedItem.doc) !== getDocumentId(doc)) {
                                      e.target.style.backgroundColor = '#ffffff';
                                    }
                                  }}
                                >
                                  <i className="bi bi-file-text me-2 text-muted"></i>
                                  <span style={treeStyles.treeNodeText} title={doc.name}>
                                    {doc.name ? (doc.name.length > 25 ? `${doc.name.substring(0, 25)}...` : doc.name) : '未命名文档'}
                                  </span>
                                  <small className="text-muted ms-2" style={{ fontSize: '10px' }}>
                                    {doc.access_count || 0}
                                  </small>
                                  
                                  {/* 智能体文档删除按钮 */}
                                  <Dropdown className="ms-1" onClick={(e) => e.stopPropagation()}>
                                    <Dropdown.Toggle 
                                      variant="link" 
                                      size="sm" 
                                      style={{ 
                                        border: 'none', 
                                        padding: '0px 4px',
                                        fontSize: '10px',
                                        color: '#6c757d',
                                        opacity: 0.6
                                      }}
                                      className="dropdown-toggle-no-caret"
                                    >
                                      <i className="bi bi-three-dots"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item 
                                        onClick={() => {
                                          handleDeleteDocument({
                                            type: 'document',
                                            sessionId,
                                            docType: 'agent_component_model',
                                            doc
                                          });
                                        }}
                                        className="text-danger"
                                        disabled={deleteLoading}
                                      >
                                        <i className="bi bi-trash me-2"></i>
                                        删除智能体
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* 会话状态数据 */}
                      <div className="tree-doc-type">
                        <div 
                          style={{
                            ...treeStyles.treeNode,
                            ...treeStyles.treeTypeNode,
                            ...(expandedTypes[`${sessionId}_session_state`] ? treeStyles.treeTypeNodeSelected : {})
                          }}
                          onClick={() => toggleDocumentType(sessionId, 'session_state')}
                          onMouseEnter={(e) => {
                            if (!expandedTypes[`${sessionId}_session_state`]) e.target.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            if (!expandedTypes[`${sessionId}_session_state`]) e.target.style.backgroundColor = '#ffffff';
                          }}
                        >
                          <i className={`bi ${expandedTypes[`${sessionId}_session_state`] ? 'bi-chevron-down' : 'bi-chevron-right'} me-2`}></i>
                          <i className="bi bi-database me-2 text-warning"></i>
                          <span style={treeStyles.treeNodeText}>会话数据</span>
                          <Badge bg="warning" className="ms-2" style={{ fontSize: '10px' }}>{stateDocs.length}</Badge>
                        </div>
                        
                        {expandedTypes[`${sessionId}_session_state`] && (
                          <div style={treeStyles.treeDocList}>
                            {stateDocs.length === 0 ? (
                              <div style={treeStyles.treeEmpty}>暂无数据</div>
                            ) : (
                              stateDocs.map((doc, index) => (
                                <div 
                                  key={getDocumentId(doc) || index}
                                  style={{
                                    ...treeStyles.treeNode,
                                    ...treeStyles.treeDocNode,
                                    ...(selectedItem?.doc && getDocumentId(selectedItem.doc) === getDocumentId(doc) ? treeStyles.treeDocNodeSelected : {})
                                  }}
                                  onClick={() => handleItemSelect({
                                    type: 'document',
                                    sessionId,
                                    docType: 'session_state',
                                    doc
                                  })}
                                  onMouseEnter={(e) => {
                                    if (!selectedItem?.doc || getDocumentId(selectedItem.doc) !== getDocumentId(doc)) {
                                      e.target.style.backgroundColor = '#f0f0f0';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!selectedItem?.doc || getDocumentId(selectedItem.doc) !== getDocumentId(doc)) {
                                      e.target.style.backgroundColor = '#ffffff';
                                    }
                                  }}
                                >
                                  <i className="bi bi-file-text me-2 text-muted"></i>
                                  <span style={treeStyles.treeNodeText} title={doc.name}>
                                    {doc.name ? (doc.name.length > 25 ? `${doc.name.substring(0, 25)}...` : doc.name) : '未命名文档'}
                                  </span>
                                  <small className="text-muted ms-2" style={{ fontSize: '10px' }}>
                                    {doc.access_count || 0}
                                  </small>
                                  
                                  {/* 会话数据文档删除按钮 */}
                                  <Dropdown className="ms-1" onClick={(e) => e.stopPropagation()}>
                                    <Dropdown.Toggle 
                                      variant="link" 
                                      size="sm" 
                                      style={{ 
                                        border: 'none', 
                                        padding: '0px 4px',
                                        fontSize: '10px',
                                        color: '#6c757d',
                                        opacity: 0.6
                                      }}
                                      className="dropdown-toggle-no-caret"
                                    >
                                      <i className="bi bi-three-dots"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item 
                                        onClick={() => {
                                          handleDeleteDocument({
                                            type: 'document',
                                            sessionId,
                                            docType: 'session_state',
                                            doc
                                          });
                                        }}
                                        className="text-danger"
                                        disabled={deleteLoading}
                                      >
                                        <i className="bi bi-trash me-2"></i>
                                        删除会话数据
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDocumentDetail = () => {
    if (!selectedItem || selectedItem.type !== 'document') {
      return (
        <div className="d-flex align-items-center justify-content-center h-100">
          <div className="empty-state text-center">
            <i className="bi bi-arrow-left text-muted" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 mb-2">请从左侧树形列表中选择文档</h5>
            <p className="text-muted">选择智能组件模型或会话状态数据中的任何一条记录来查看详细内容</p>
          </div>
        </div>
      );
    }
    
    const { doc, sessionId, docType } = selectedItem;
    const typeDisplay = docType === 'agent_component_model' ? '智能组件模型' : '会话状态数据';
    const typeIcon = docType === 'agent_component_model' ? 'bi-cpu' : 'bi-database';
    const typeColor = docType === 'agent_component_model' ? 'text-success' : 'text-warning';
    
    return (
      <div className="document-detail-container h-100 d-flex flex-column">
        {/* 文档头部 */}
        <div className="document-detail-header p-4 border-bottom">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h5 className="mb-2">
                <i className={`bi ${typeIcon} ${typeColor} me-2`}></i>
                {doc.name || '未命名文档'}
              </h5>
              <div className="document-meta">
                <span className="badge bg-light text-dark me-2">
                  <i className="bi bi-chat-dots me-1"></i>
                  {sessionId}
                </span>
                <span className={`badge ${docType === 'agent_component_model' ? 'bg-success' : 'bg-warning'} me-2`}>
                  {typeDisplay}
                </span>
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  {formatDate(doc.created_at)}
                </small>
                <small className="text-muted ms-3">
                  <i className="bi bi-eye me-1"></i>
                  访问 {doc.access_count || 0} 次
                </small>
              </div>
            </div>
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  const content = JSON.stringify(doc.content || doc, null, 2);
                  navigator.clipboard.writeText(content);
                }}
                className="me-2"
              >
                <i className="bi bi-clipboard me-1"></i>
                复制内容
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleDeleteDocument}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    删除中...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash me-1"></i>
                    删除文档
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* 文档内容 */}
        <div className="document-detail-content flex-grow-1 p-4">
          {/* 描述 */}
          {doc.description && (
            <div className="mb-4">
              <h6 className="text-muted mb-2">
                <i className="bi bi-info-circle me-2"></i>
                描述
              </h6>
              <p className="bg-light p-3 rounded">{doc.description}</p>
            </div>
          )}
                    
          {/* JSON 内容 */}
          <div className="mb-4">
            <h6 className="text-muted mb-2">
              <i className="bi bi-code-slash me-2"></i>
              JSON 内容
            </h6>
            <div className="code-display-wrapper" style={{ height: '470px' }}>
              <pre 
                className="code-display-content h-100 bg-dark text-light p-3 rounded"
                style={{ 
                  whiteSpace: 'pre', 
                  overflowX: 'auto', 
                  overflowY: 'auto',
                  maxWidth: '100%',
                  fontSize: '14px',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                }}
              >
{JSON.stringify(doc.content || doc, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* 元数据 */}
          {doc.metadata && Object.keys(doc.metadata).length > 0 && (
            <div className="mb-4">
              <h6 className="text-muted mb-2">
                <i className="bi bi-gear me-2"></i>
                元数据
              </h6>
              <div className="bg-light p-3 rounded">
                <pre className="mb-0" style={{ fontSize: '12px', color: '#666' }}>
{JSON.stringify(doc.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl" fullscreen="xl-down" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-diagram-3 me-2"></i>
          会话状态查看器
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0" style={{ minHeight: '80vh' }}>
        {error && (
          <Alert variant="danger" className="m-3 mb-0">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        <div className="h-100 d-flex flex-column">
          <Row className="g-0 flex-grow-1">
            {/* 左侧树形列表 */}
            <Col lg={4} md={5} className="border-end bg-light">
              <div className="tree-container p-3 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    <i className="bi bi-diagram-3 me-2"></i>
                    会话树形结构
                  </h6>
                  {loading && <Spinner animation="border" size="sm" />}
                </div>
                
                <div className="flex-grow-1 overflow-auto">
                  {loading ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <div className="text-center">
                        <Spinner animation="border" />
                        <div className="mt-2">加载会话列表...</div>
                      </div>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="d-flex align-items-center justify-content-center h-100">
                      <div className="text-center text-muted">
                        <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                        <p className="mt-3">暂无会话记录</p>
                      </div>
                    </div>
                  ) : (
                    renderTreeView()
                  )}
                </div>
              </div>
            </Col>
            
            {/* 右侧详情显示区 */}
            <Col lg={8} md={7}>
              <div className="detail-container h-100">
                {renderDocumentDetail()}
              </div>
            </Col>
          </Row>
        </div>
      </Modal.Body>
      </Modal>
  );
}

export default SessionStateModal;
