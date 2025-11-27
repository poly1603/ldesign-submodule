// API基础URL
const API_BASE = '/api';

// 全局状态
let isReadonly = false;
let submodules = [];

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await checkServerStatus();
    setupEventListeners();
    await loadSubmodules();
});

// 检查服务器状态
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE}/status`);
        const data = await response.json();
        isReadonly = data.readonly;
        
        if (isReadonly) {
            document.getElementById('readonly-badge').classList.remove('hidden');
            disableWriteOperations();
        }
    } catch (error) {
        showStatus('无法连接到服务器', 'error');
    }
}

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', loadSubmodules);
    document.getElementById('add-btn').addEventListener('click', () => openModal('add-modal'));
    document.getElementById('update-all-btn').addEventListener('click', updateAllSubmodules);
    document.getElementById('sync-btn').addEventListener('click', syncSubmodules);
    document.getElementById('analyze-btn').addEventListener('click', analyzeSubmodules);
    document.getElementById('health-check-btn').addEventListener('click', healthCheck);
    document.getElementById('add-form').addEventListener('submit', handleAddSubmodule);
}

// 禁用写操作
function disableWriteOperations() {
    const writeButtons = ['add-btn', 'update-all-btn', 'sync-btn'];
    writeButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = true;
            btn.title = '只读模式下不可用';
        }
    });
}

// 加载子模块列表
async function loadSubmodules() {
    showLoading(true);
    hideElement('empty-state');
    
    try {
        const response = await fetch(`${API_BASE}/submodules?verbose=true`);
        const result = await response.json();
        
        if (result.success) {
            submodules = result.data;
            renderSubmodules(submodules);
            updateStats(submodules);
        } else {
            showStatus('加载失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('加载失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 渲染子模块列表
function renderSubmodules(modules) {
    const listElement = document.getElementById('submodules-list');
    
    if (modules.length === 0) {
        listElement.innerHTML = '';
        showElement('empty-state');
        return;
    }
    
    listElement.innerHTML = modules.map(module => `
        <div class="submodule-item">
            <div class="submodule-header">
                <div class="submodule-info">
                    <div class="submodule-path">${escapeHtml(module.path)}</div>
                    ${module.url ? `<div class="submodule-url">${escapeHtml(module.url)}</div>` : ''}
                </div>
                <div class="submodule-actions">
                    <button class="btn btn-sm btn-secondary" onclick="viewDetails('${escapeHtml(module.path)}')">
                        详情
                    </button>
                    ${!isReadonly ? `
                        <button class="btn btn-sm btn-secondary" onclick="updateSubmodule('${escapeHtml(module.path)}')">
                            更新
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="removeSubmodule('${escapeHtml(module.path)}')">
                            删除
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="submodule-meta">
                <div class="meta-item">
                    <span class="status-badge ${getStatusClass(module.status)}">${getStatusText(module.status)}</span>
                </div>
                ${module.commit ? `<div class="meta-item">📋 ${module.commit}</div>` : ''}
                ${module.branch ? `<div class="meta-item">🌿 ${escapeHtml(module.branch)}</div>` : ''}
                ${module.ahead ? `<div class="meta-item">⬆️ ${module.ahead}</div>` : ''}
                ${module.behind ? `<div class="meta-item">⬇️ ${module.behind}</div>` : ''}
                ${module.uncommittedChanges ? `<div class="meta-item">⚠️ 未提交更改</div>` : ''}
            </div>
        </div>
    `).join('');
}

// 更新统计信息
function updateStats(modules) {
    const stats = {
        total: modules.length,
        uptodate: 0,
        modified: 0,
        notinit: 0
    };
    
    modules.forEach(module => {
        if (module.status === 'up-to-date') stats.uptodate++;
        else if (module.status === 'modified') stats.modified++;
        else if (module.status === 'not-initialized') stats.notinit++;
    });
    
    document.getElementById('total-count').textContent = stats.total;
    document.getElementById('uptodate-count').textContent = stats.uptodate;
    document.getElementById('modified-count').textContent = stats.modified;
    document.getElementById('notinit-count').textContent = stats.notinit;
    
    showElement('stats');
}

// 添加子模块
async function handleAddSubmodule(e) {
    e.preventDefault();
    
    const url = document.getElementById('add-url').value;
    const path = document.getElementById('add-path').value;
    const branch = document.getElementById('add-branch').value;
    const force = document.getElementById('add-force').checked;
    
    try {
        const response = await fetch(`${API_BASE}/submodules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, path, branch: branch || undefined, force })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('子模块添加成功', 'success');
            closeModal('add-modal');
            document.getElementById('add-form').reset();
            await loadSubmodules();
        } else {
            showStatus('添加失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('添加失败: ' + error.message, 'error');
    }
}

// 删除子模块
async function removeSubmodule(path) {
    if (!confirm(`确定要删除子模块 "${path}" 吗？`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/submodules/${encodeURIComponent(path)}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('子模块删除成功', 'success');
            await loadSubmodules();
        } else {
            showStatus('删除失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('删除失败: ' + error.message, 'error');
    }
}

// 更新子模块
async function updateSubmodule(path) {
    try {
        const response = await fetch(`${API_BASE}/submodules/${encodeURIComponent(path)}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ init: true, recursive: true })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('子模块更新成功', 'success');
            await loadSubmodules();
        } else {
            showStatus('更新失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('更新失败: ' + error.message, 'error');
    }
}

// 更新所有子模块
async function updateAllSubmodules() {
    if (!confirm('确定要更新所有子模块吗？')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/submodules/update-all`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ init: true, recursive: true })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('所有子模块更新成功', 'success');
            await loadSubmodules();
        } else {
            showStatus('更新失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('更新失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 同步子模块
async function syncSubmodules() {
    try {
        const response = await fetch(`${API_BASE}/submodules/sync`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('同步成功', 'success');
            await loadSubmodules();
        } else {
            showStatus('同步失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('同步失败: ' + error.message, 'error');
    }
}

// 分析子模块
async function analyzeSubmodules() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/analyze`);
        const result = await response.json();
        
        if (result.success) {
            displayAnalysisResult(result.data);
            openModal('analysis-modal');
        } else {
            showStatus('分析失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('分析失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 显示分析结果
function displayAnalysisResult(data) {
    const content = document.getElementById('analysis-content');
    
    content.innerHTML = `
        <div class="analysis-section">
            <h4>概览</h4>
            <div class="analysis-grid">
                <div class="analysis-card">
                    <div class="analysis-card-label">总数</div>
                    <div class="analysis-card-value">${data.total}</div>
                </div>
            </div>
        </div>
        
        <div class="analysis-section">
            <h4>状态分布</h4>
            <div class="analysis-grid">
                ${Object.entries(data.byStatus).map(([status, count]) => `
                    <div class="analysis-card">
                        <div class="analysis-card-label">${getStatusText(status)}</div>
                        <div class="analysis-card-value">${count}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${data.conflicts && data.conflicts.length > 0 ? `
            <div class="analysis-section">
                <h4>⚠️ 检测到冲突</h4>
                <div class="detail-value">${data.conflicts.length} 个冲突</div>
            </div>
        ` : ''}
        
        ${data.circular && data.circular.length > 0 ? `
            <div class="analysis-section">
                <h4>🔄 循环依赖</h4>
                <div class="detail-value">${data.circular.length} 个循环依赖</div>
            </div>
        ` : ''}
        
        ${data.unused && data.unused.length > 0 ? `
            <div class="analysis-section">
                <h4>📦 未使用的子模块</h4>
                <div class="detail-value">${data.unused.join(', ')}</div>
            </div>
        ` : ''}
    `;
}

// 健康检查
async function healthCheck() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/health`);
        const result = await response.json();
        
        if (result.success) {
            displayHealthResult(result.data);
            openModal('health-modal');
        } else {
            showStatus('健康检查失败: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('健康检查失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 显示健康检查结果
function displayHealthResult(data) {
    const content = document.getElementById('health-content');
    
    content.innerHTML = `
        <div class="analysis-section">
            <h4>健康评分: ${data.score.toFixed(1)}/100</h4>
            <p class="text-muted">${data.summary}</p>
        </div>
        
        <div class="analysis-section">
            ${data.checks.map(check => `
                <div class="health-check-item">
                    <div class="health-icon ${check.status}">
                        ${check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌'}
                    </div>
                    <div class="health-info">
                        <div class="health-name">${check.name}</div>
                        <div class="health-message">${check.message}</div>
                        ${check.details ? `
                            <div class="health-details">
                                ${Array.isArray(check.details) ? check.details.join('<br>') : check.details}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 查看详情
async function viewDetails(path) {
    const module = submodules.find(m => m.path === path);
    if (!module) return;
    
    const content = document.getElementById('detail-content');
    document.getElementById('detail-title').textContent = `子模块详情: ${path}`;
    
    content.innerHTML = `
        <div class="detail-section">
            <h4>基本信息</h4>
            ${createDetailRow('路径', module.path)}
            ${module.url ? createDetailRow('URL', module.url) : ''}
            ${module.commit ? createDetailRow('提交', module.commit) : ''}
            ${module.branch ? createDetailRow('分支', module.branch) : ''}
            ${createDetailRow('状态', getStatusText(module.status))}
        </div>
        
        ${module.ahead || module.behind ? `
            <div class="detail-section">
                <h4>同步状态</h4>
                ${module.ahead ? createDetailRow('领先', `${module.ahead} 个提交`) : ''}
                ${module.behind ? createDetailRow('落后', `${module.behind} 个提交`) : ''}
            </div>
        ` : ''}
        
        ${module.uncommittedChanges ? `
            <div class="detail-section">
                <h4>⚠️ 警告</h4>
                ${createDetailRow('未提交更改', '存在未提交的更改')}
            </div>
        ` : ''}
    `;
    
    openModal('detail-modal');
}

// 创建详情行
function createDetailRow(label, value) {
    return `
        <div class="detail-row">
            <div class="detail-label">${label}</div>
            <div class="detail-value">${escapeHtml(String(value))}</div>
        </div>
    `;
}

// 工具函数
function showStatus(message, type = 'info') {
    const statusBar = document.getElementById('status-bar');
    statusBar.className = `status-bar ${type}`;
    statusBar.querySelector('.status-message').textContent = message;
    statusBar.classList.remove('hidden');
    
    setTimeout(() => {
        statusBar.classList.add('hidden');
    }, 5000);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showElement(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideElement(id) {
    document.getElementById(id).classList.add('hidden');
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function getStatusClass(status) {
    const classMap = {
        'up-to-date': 'up-to-date',
        'modified': 'modified',
        'not-initialized': 'not-initialized',
        'merge-conflict': 'merge-conflict'
    };
    return classMap[status] || '';
}

function getStatusText(status) {
    const textMap = {
        'up-to-date': '最新',
        'modified': '已修改',
        'not-initialized': '未初始化',
        'merge-conflict': '合并冲突',
        'ahead': '领先',
        'behind': '落后',
        'diverged': '已分叉'
    };
    return textMap[status] || status;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});