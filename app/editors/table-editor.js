import { saveTable, updateTable } from '../database/storage.js';

let currentTableId = null;
let tableData = { headers: [], rows: [] };
let currentTab = 'columns';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createTableEditorModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay table-editor-modal';
  modal.innerHTML = `
    <div class="modal-content modal-table-editor">
      <div class="modal-header">
        <div class="modal-header-left">
          <input type="text" class="table-title-input-modal" id="table-title-input" placeholder="Digite o título da tabela..." value="" />
        </div>
        <div class="modal-header-right">
          <button class="button button-primary" id="save-table-btn">
            <i class="fa-solid fa-check"></i> Salvar
          </button>
          <button class="modal-close" aria-label="Fechar">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="table-editor-tabs">
        <button class="tab-button active" data-tab="columns">
          <i class="fa-solid fa-columns"></i>
          <span>Colunas (Schema)</span>
          <span class="tab-badge" id="columns-count">0</span>
        </button>
        <button class="tab-button" data-tab="rows">
          <i class="fa-solid fa-table"></i>
          <span>Linhas (Dados)</span>
          <span class="tab-badge" id="rows-count">0</span>
        </button>
      </div>
      
      <div class="modal-body table-editor-body">
        <div class="tab-content active" id="tab-columns">
          <div class="tab-content-header">
            <h3>Definir Estrutura da Tabela</h3>
            <p class="tab-description">Adicione e configure as colunas que sua tabela terá</p>
            <button class="button button-primary" id="add-column-btn">
              <i class="fa-solid fa-plus"></i> Adicionar Coluna
            </button>
          </div>
          <div class="schema-columns-container" id="schema-columns">
          </div>
        </div>
        
        <div class="tab-content" id="tab-rows">
          <div class="tab-content-header">
            <h3>Adicionar Dados</h3>
            <p class="tab-description">Preencha os dados da tabela. Cada card representa uma linha.</p>
            <button class="button button-primary" id="add-row-btn">
              <i class="fa-solid fa-plus"></i> Adicionar Linha
            </button>
          </div>
          <div class="rows-cards-container" id="rows-cards-container">
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupTableEditorModalEvents(modal);
  initializeTable();
  renderSchemaColumns();
  renderRowsCards();
  updateTabCounts();
  
  return modal;
}

function setupTableEditorModalEvents(modal) {
  const closeBtn = modal.querySelector('.modal-close');
  const saveBtn = modal.querySelector('#save-table-btn');
  const addColumnBtn = modal.querySelector('#add-column-btn');
  const addRowBtn = modal.querySelector('#add-row-btn');
  const tabButtons = modal.querySelectorAll('.tab-button');
  const titleInput = modal.querySelector('#table-title-input');
  
  closeBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja fechar? As alterações não salvas serão perdidas.')) {
      closeModal(modal);
    }
  });
  
  saveBtn.addEventListener('click', () => {
    saveTableData(modal);
  });
  
  addColumnBtn.addEventListener('click', () => {
    addColumn();
  });
  
  addRowBtn.addEventListener('click', () => {
    addRow();
  });
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName, modal);
    });
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      if (confirm('Tem certeza que deseja fechar? As alterações não salvas serão perdidas.')) {
        closeModal(modal);
      }
    }
  });
  
  titleInput.addEventListener('input', (e) => {
    titleInput.value = e.target.value;
  });
}

function switchTab(tabName, modal) {
  currentTab = tabName;
  
  const tabButtons = modal.querySelectorAll('.tab-button');
  const tabContents = modal.querySelectorAll('.tab-content');
  
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  tabContents.forEach(content => {
    if (content.id === `tab-${tabName}`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

function initializeTable() {
  if (tableData.headers.length === 0) {
    tableData.headers = ['Coluna 1'];
    tableData.rows = [];
  }
}

function addColumn() {
  const columnIndex = tableData.headers.length;
  const columnName = `Coluna ${columnIndex + 1}`;
  
  tableData.headers.push(columnName);
  tableData.rows.forEach(row => {
    if (row.length < tableData.headers.length) {
      row.push('');
    }
  });
  
  renderSchemaColumns();
  renderRowsCards();
  updateTabCounts();
  
  setTimeout(() => {
    const lastInput = document.querySelector('.schema-column-input:last-child');
    if (lastInput) {
      lastInput.focus();
      lastInput.select();
    }
  }, 100);
}

function removeColumn(index) {
  if (tableData.headers.length <= 1) {
    alert('A tabela deve ter pelo menos uma coluna');
    return;
  }
  
  if (confirm('Tem certeza que deseja remover esta coluna? Todos os dados desta coluna serão perdidos.')) {
    tableData.headers.splice(index, 1);
    tableData.rows.forEach(row => row.splice(index, 1));
    renderSchemaColumns();
    renderRowsCards();
    updateTabCounts();
  }
}

function addRow() {
  if (tableData.headers.length === 0) {
    alert('Defina pelo menos uma coluna antes de adicionar linhas');
    switchTab('columns', document.querySelector('.table-editor-modal'));
    return;
  }
  
  const newRow = new Array(tableData.headers.length).fill('');
  tableData.rows.push(newRow);
  renderRowsCards();
  updateTabCounts();
  
  setTimeout(() => {
    const lastCard = document.querySelector('.row-card:last-child');
    if (lastCard) {
      const firstInput = lastCard.querySelector('.row-field-input');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, 100);
}

function removeRow(index) {
  if (confirm('Tem certeza que deseja remover esta linha?')) {
    tableData.rows.splice(index, 1);
    renderRowsCards();
    updateTabCounts();
  }
}

function renderSchemaColumns() {
  const container = document.getElementById('schema-columns');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (tableData.headers.length === 0) {
    container.innerHTML = `
      <div class="empty-schema-message">
        <i class="fa-solid fa-columns"></i>
        <h4>Nenhuma coluna definida</h4>
        <p>Clique em "Adicionar Coluna" para começar a definir a estrutura da sua tabela</p>
      </div>
    `;
    return;
  }
  
  tableData.headers.forEach((header, index) => {
    const columnCard = document.createElement('div');
    columnCard.className = 'schema-column-card';
    columnCard.dataset.columnIndex = index;
    
    columnCard.innerHTML = `
      <div class="schema-column-card-header">
        <div class="schema-column-number">${index + 1}</div>
        <input type="text" class="schema-column-input" value="${header}" data-column-index="${index}" placeholder="Nome da coluna" />
        <button class="button button-small button-icon button-danger" title="Remover coluna" data-action="remove-column">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    
    const input = columnCard.querySelector('.schema-column-input');
    const removeBtn = columnCard.querySelector('[data-action="remove-column"]');
    
    input.addEventListener('input', (e) => {
      tableData.headers[index] = e.target.value;
      renderRowsCards();
    });
    
    input.addEventListener('blur', () => {
      if (!input.value.trim()) {
        input.value = `Coluna ${index + 1}`;
        tableData.headers[index] = input.value;
      }
    });
    
    removeBtn.addEventListener('click', () => removeColumn(index));
    
    container.appendChild(columnCard);
  });
}

function renderRowsCards() {
  const container = document.getElementById('rows-cards-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (tableData.headers.length === 0) {
    container.innerHTML = `
      <div class="empty-rows-message">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <h4>Defina as colunas primeiro</h4>
        <p>Vá para a aba "Colunas" e adicione pelo menos uma coluna antes de adicionar dados</p>
        <button class="button button-primary" onclick="document.querySelector('[data-tab=columns]').click()">
          Ir para Colunas
        </button>
      </div>
    `;
    return;
  }
  
  if (tableData.rows.length === 0) {
    container.innerHTML = `
      <div class="empty-rows-message">
        <i class="fa-solid fa-table"></i>
        <h4>Nenhuma linha adicionada</h4>
        <p>Clique em "Adicionar Linha" para começar a preencher os dados da tabela</p>
      </div>
    `;
    return;
  }
  
  tableData.rows.forEach((row, rowIndex) => {
    const rowCard = document.createElement('div');
    rowCard.className = 'row-card';
    rowCard.dataset.rowIndex = rowIndex;
    
    const firstColumnValue = row[0] || '';
    const firstColumnName = tableData.headers[0] || 'Coluna 1';
    const displayTitle = escapeHtml(firstColumnValue || `${firstColumnName} não definido`);
    
    const fieldsHtml = tableData.headers.map((header, colIndex) => {
      const escapedHeader = escapeHtml(header || `Coluna ${colIndex + 1}`);
      const escapedValue = escapeHtml(row[colIndex] || '');
      return `
        <div class="row-field">
          <label class="row-field-label">${escapedHeader}</label>
          <input 
            type="text" 
            class="row-field-input" 
            value="${escapedValue}" 
            data-row-index="${rowIndex}" 
            data-col-index="${colIndex}"
            placeholder="Digite o valor para ${escapedHeader}..." 
          />
        </div>
      `;
    }).join('');
    
    rowCard.innerHTML = `
      <div class="row-card-header">
        <div class="row-card-title">
          <span class="row-number">${displayTitle}</span>
        </div>
        <button class="button button-small button-icon button-danger" title="Remover linha" data-action="remove-row">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="row-card-body">
        ${fieldsHtml}
      </div>
    `;
    
    const removeBtn = rowCard.querySelector('[data-action="remove-row"]');
    removeBtn.addEventListener('click', () => removeRow(rowIndex));
    
    const titleSpan = rowCard.querySelector('.row-number');
    const inputs = rowCard.querySelectorAll('.row-field-input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const rowIdx = parseInt(e.target.dataset.rowIndex);
        const colIdx = parseInt(e.target.dataset.colIndex);
        tableData.rows[rowIdx][colIdx] = e.target.value;
        
        if (colIdx === 0 && titleSpan) {
          const newValue = e.target.value.trim();
          const firstColumnName = tableData.headers[0] || 'Coluna 1';
          titleSpan.textContent = newValue || `${firstColumnName} não definido`;
        }
      });
    });
    
    container.appendChild(rowCard);
  });
}

function updateTabCounts() {
  const columnsCount = document.getElementById('columns-count');
  const rowsCount = document.getElementById('rows-count');
  
  if (columnsCount) {
    columnsCount.textContent = tableData.headers.length;
  }
  
  if (rowsCount) {
    rowsCount.textContent = tableData.rows.length;
  }
}

function saveTableData(modal) {
  const titleInput = modal.querySelector('#table-title-input');
  const title = titleInput?.value?.trim() || 'Tabela sem título';
  
  if (tableData.headers.length === 0) {
    alert('A tabela deve ter pelo menos uma coluna');
    switchTab('columns', modal);
    return;
  }
  
  const tableToSave = {
    title,
    headers: [...tableData.headers],
    rows: tableData.rows.map(row => [...row])
  };
  
  let result;
  if (currentTableId) {
    result = updateTable(currentTableId, tableToSave);
  } else {
    result = saveTable(tableToSave);
  }
  
  if (result.success) {
    closeModal(modal);
    if (typeof window.loadTables === 'function') {
      window.loadTables();
    }
  } else {
    alert(`Erro ao salvar tabela: ${result.error}`);
  }
}

function closeModal(modal) {
  modal.remove();
  resetTableEditor();
}

function resetTableEditor() {
  currentTableId = null;
  tableData = { headers: [], rows: [] };
  currentTab = 'columns';
}

export function openTableEditor(existingTableId = null) {
  if (existingTableId) {
    const existingTable = window.getTableById?.(existingTableId);
    if (existingTable) {
      currentTableId = existingTableId;
      tableData = {
        headers: [...existingTable.headers],
        rows: existingTable.rows.map(row => [...row])
      };
    }
  }
  
  const modal = createTableEditorModal();
  
  if (existingTableId && tableData.headers.length > 0) {
    const titleInput = modal.querySelector('#table-title-input');
    const existingTable = window.getTableById?.(existingTableId);
    if (titleInput && existingTable) {
      titleInput.value = existingTable.title || '';
    }
    currentTab = 'rows';
    switchTab('rows', modal);
  }
  
  return modal;
}

export function convertTableToJSON(tableId) {
  if (!window.getTableById) {
    return null;
  }
  
  const table = window.getTableById(tableId);
  if (!table) {
    return null;
  }
  
  const jsonData = {
    type: 'table',
    title: table.title,
    data: {
      headers: table.headers,
      rows: table.rows
    }
  };
  
  return JSON.stringify(jsonData, null, 2);
}
