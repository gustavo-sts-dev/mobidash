import { getAllTables, deleteTable } from '../database/storage.js';

const TABLES_CONTAINER_ID = 'tables-container';

function createTableCard(table) {
  const card = document.createElement('div');
  card.className = 'table-card';
  card.dataset.tableId = table.id;
  
  const rowsToShow = table.rows.slice(0, 10);
  const remainingRows = table.rows.length - rowsToShow.length;
  
  const rowsCardsHtml = rowsToShow.map((row, rowIndex) => {
    const firstColumnValue = row[0] || '';
    const escapedFirstColumnValue = escapeHtml(String(firstColumnValue));
    const firstColumnName = table.headers[0] || 'Coluna 1';
    const escapedFirstColumnName = escapeHtml(String(firstColumnName));
    const displayTitle = escapedFirstColumnValue || `${escapedFirstColumnName} não definido`;
    
    const fieldsHtml = table.headers.map((header, colIndex) => {
      const value = row[colIndex] || '';
      const escapedValue = escapeHtml(String(value));
      const escapedHeader = escapeHtml(String(header || `Coluna ${colIndex + 1}`));
      return `
        <div class="table-row-card-field">
          <label class="table-row-card-label">${escapedHeader}</label>
          <div class="table-row-card-value">${escapedValue || '—'}</div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="table-row-card">
        <div class="table-row-card-header">
          <span class="table-row-card-number">${displayTitle}</span>
        </div>
        <div class="table-row-card-body">
          ${fieldsHtml}
        </div>
      </div>
    `;
  }).join('');
  
  card.innerHTML = `
    <div class="table-card-header">
      <h3>${escapeHtml(table.title || 'Tabela sem título')}</h3>
      <div class="table-card-actions">
        <button class="button button-small button-icon" title="Criar gráfico a partir desta tabela" data-action="create-chart">
          <i class="fa-solid fa-chart-line"></i>
        </button>
        <button class="button button-small button-icon" title="Converter para JSON" data-action="convert">
          <i class="fa-solid fa-code"></i>
        </button>
        <button class="button button-small button-icon" title="Editar tabela" data-action="edit">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button class="button button-small button-icon" title="Remover tabela" data-action="delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="table-card-body">
      <div class="table-cards-container">
        ${table.rows.length === 0 ? `
          <div class="table-empty-rows">
            <i class="fa-solid fa-inbox"></i>
            <span>Nenhuma linha adicionada ainda</span>
          </div>
        ` : `
          ${rowsCardsHtml}
          ${remainingRows > 0 ? `
            <div class="table-more-cards">
              <i class="fa-solid fa-ellipsis"></i>
              <span>... e mais ${remainingRows} linha${remainingRows > 1 ? 's' : ''}</span>
            </div>
          ` : ''}
        `}
      </div>
    </div>
    <div class="table-card-footer">
      <span class="table-info">${table.headers.length} colunas, ${table.rows.length} linhas</span>
      <span class="table-date">${formatDate(table.createdAt)}</span>
    </div>
  `;
  
  const createChartBtn = card.querySelector('[data-action="create-chart"]');
  const convertBtn = card.querySelector('[data-action="convert"]');
  const editBtn = card.querySelector('[data-action="edit"]');
  const deleteBtn = card.querySelector('[data-action="delete"]');
  
  createChartBtn.addEventListener('click', () => {
    createChartFromTable(table);
  });
  
  convertBtn.addEventListener('click', () => {
    const json = convertTableToJSON(table.id);
    if (json) {
      showJSONModal(json, table.title);
    }
  });
  
  editBtn.addEventListener('click', () => {
    if (typeof window.openTableEditor === 'function') {
      window.openTableEditor(table.id);
    }
  });
  
  deleteBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja remover esta tabela?')) {
      const result = deleteTable(table.id);
      if (result.success) {
        card.remove();
        if (getAllTables().length === 0) {
          loadAllTables();
        }
      } else {
        alert(`Erro ao remover tabela: ${result.error}`);
      }
    }
  });
  
  return card;
}

function convertTableToJSON(tableId) {
  const table = getAllTables().find(t => t.id === tableId);
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

function showJSONModal(json, title) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content modal-medium">
      <div class="modal-header">
        <h2>JSON - ${title || 'Tabela'}</h2>
        <button class="modal-close" aria-label="Fechar">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="json-viewer">
          <pre><code>${escapeHtml(json)}</code></pre>
        </div>
        <div class="json-actions">
          <button class="button button-primary" id="copy-json-btn">
            <i class="fa-solid fa-copy"></i> Copiar JSON
          </button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="button button-secondary" id="close-json-modal">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeBtn = modal.querySelector('.modal-close');
  const closeFooterBtn = modal.querySelector('#close-json-modal');
  const copyBtn = modal.querySelector('#copy-json-btn');
  
  closeBtn.addEventListener('click', () => modal.remove());
  closeFooterBtn.addEventListener('click', () => modal.remove());
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(json);
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar JSON';
      }, 2000);
    } catch (error) {
      alert('Erro ao copiar para a área de transferência');
    }
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function ensureTablesContainer() {
  let container = document.getElementById(TABLES_CONTAINER_ID);
  
  if (!container) {
    container = document.createElement('div');
    container.id = TABLES_CONTAINER_ID;
    container.className = 'tables-container';
    
    const main = document.querySelector('main');
    if (main) {
      main.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }
  
  return container;
}

export function loadAllTables() {
  const tables = getAllTables();
  const container = ensureTablesContainer();
  
  container.innerHTML = '';
  container.classList.remove('single-item', 'two-items');
  
  if (tables.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-table"></i>
        <p>Nenhuma tabela criada ainda</p>
        <p class="empty-state-subtitle">Use o editor de tabelas para criar sua primeira tabela</p>
      </div>
    `;
    return;
  }
  
  tables.forEach(table => {
    const card = createTableCard(table);
    container.appendChild(card);
  });
  
  if (tables.length === 1) {
    container.classList.add('single-item');
  } else if (tables.length === 2) {
    container.classList.add('two-items');
  }
  
  setTimeout(() => {
    if (typeof window.updateGrid === 'function') {
      window.updateGrid();
    }
  }, 100);
}

export function refreshTables() {
  loadAllTables();
}

function createChartFromTable(table) {
  if (!table || !table.headers || table.headers.length === 0) {
    alert('Tabela inválida para criar gráfico');
    return;
  }
  
  if (table.rows.length === 0) {
    alert('A tabela não possui dados. Adicione linhas antes de criar um gráfico.');
    return;
  }
  
  const firstColumnIsNumeric = table.rows.every(row => {
    const value = row[0];
    return !isNaN(parseFloat(value)) && isFinite(value);
  });
  
  let labels = [];
  let datasets = [];
  
  if (firstColumnIsNumeric && table.headers.length > 1) {
    labels = table.rows.map((row, index) => `Item ${index + 1}`);
    
    table.headers.slice(1).forEach((header, headerIndex) => {
      const data = table.rows.map(row => {
        const value = parseFloat(row[headerIndex + 1]);
        return isNaN(value) ? 0 : value;
      });
      
      datasets.push({
        label: header,
        data: data
      });
    });
  } else {
    labels = table.rows.map(row => String(row[0] || ''));
    
    if (table.headers.length > 1) {
      table.headers.slice(1).forEach((header, headerIndex) => {
        const data = table.rows.map(row => {
          const value = parseFloat(row[headerIndex + 1]);
          return isNaN(value) ? 0 : value;
        });
        
        datasets.push({
          label: header,
          data: data
        });
      });
    } else {
      const data = table.rows.map((row, index) => {
        const value = parseFloat(row[0]);
        return isNaN(value) ? 0 : value;
      });
      
      datasets.push({
        label: table.headers[0] || 'Valores',
        data: data
      });
      
      labels = table.rows.map((row, index) => `Item ${index + 1}`);
    }
  }
  
  if (labels.length === 0 || datasets.length === 0) {
    alert('Não foi possível converter a tabela em gráfico. Verifique se há dados numéricos.');
    return;
  }
  
  if (typeof window.openChartEditorFromData === 'function') {
    window.openChartEditorFromData({
      title: `${table.title || 'Gráfico'} - ${new Date().toLocaleDateString()}`,
      labels: labels,
      datasets: datasets
    });
  }
}

