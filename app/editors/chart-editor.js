import { saveChart, updateChart, getChartById } from '../database/storage.js';

let currentChartId = null;
let chartData = {
  type: 'bar',
  title: '',
  labels: [],
  datasets: []
};
let currentTab = 'config';

const CHART_TYPES = [
  { value: 'bar', label: 'Barras', icon: 'fa-chart-bar' },
  { value: 'line', label: 'Linha', icon: 'fa-chart-line' },
  { value: 'pie', label: 'Pizza', icon: 'fa-chart-pie' },
  { value: 'doughnut', label: 'Rosca', icon: 'fa-chart-pie' },
  { value: 'radar', label: 'Radar', icon: 'fa-chart-area' },
  { value: 'polarArea', label: 'Polar', icon: 'fa-chart-area' }
];

function createChartEditorModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay chart-editor-modal';
  modal.innerHTML = `
    <div class="modal-content modal-chart-editor">
      <div class="modal-header">
        <div class="modal-header-left">
          <input type="text" class="chart-title-input-modal" id="chart-title-input" placeholder="Digite o título do gráfico..." value="" />
        </div>
        <div class="modal-header-right">
          <button class="button button-primary" id="save-chart-btn">
            <i class="fa-solid fa-check"></i> Salvar
          </button>
          <button class="modal-close" aria-label="Fechar">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="chart-editor-tabs">
        <button class="tab-button active" data-tab="config">
          <i class="fa-solid fa-cog"></i>
          <span>Configuração</span>
        </button>
        <button class="tab-button" data-tab="labels">
          <i class="fa-solid fa-tags"></i>
          <span>Labels</span>
          <span class="tab-badge" id="labels-count">0</span>
        </button>
        <button class="tab-button" data-tab="datasets">
          <i class="fa-solid fa-database"></i>
          <span>Datasets</span>
          <span class="tab-badge" id="datasets-count">0</span>
        </button>
        <button class="tab-button" data-tab="preview">
          <i class="fa-solid fa-eye"></i>
          <span>Preview</span>
        </button>
      </div>
      
      <div class="modal-body chart-editor-body">
        <div class="tab-content active" id="tab-config">
          <div class="tab-content-header">
            <h3>Configuração do Gráfico</h3>
            <p class="tab-description">Escolha o tipo de gráfico que deseja criar</p>
          </div>
          <div class="chart-types-grid" id="chart-types-grid">
          </div>
        </div>
        
        <div class="tab-content" id="tab-labels">
          <div class="tab-content-header">
            <h3>Labels do Gráfico</h3>
            <p class="tab-description">Adicione os labels (rótulos) que aparecerão no eixo X</p>
            <button class="button button-primary" id="add-label-btn">
              <i class="fa-solid fa-plus"></i> Adicionar Label
            </button>
          </div>
          <div class="labels-container" id="labels-container">
          </div>
        </div>
        
        <div class="tab-content" id="tab-datasets">
          <div class="tab-content-header">
            <h3>Datasets (Séries de Dados)</h3>
            <p class="tab-description">Adicione séries de dados para o gráfico. Cada dataset representa uma série.</p>
            <button class="button button-primary" id="add-dataset-btn">
              <i class="fa-solid fa-plus"></i> Adicionar Dataset
            </button>
          </div>
          <div class="datasets-container" id="datasets-container">
          </div>
        </div>
        
        <div class="tab-content" id="tab-preview">
          <div class="tab-content-header">
            <h3>Preview do Gráfico</h3>
            <p class="tab-description">Visualize como seu gráfico ficará</p>
          </div>
          <div class="chart-preview-container">
            <div class="chart-preview" id="chart-preview">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupChartEditorModalEvents(modal);
  initializeChart();
  renderChartTypes();
  renderLabels();
  renderDatasets();
  updateTabCounts();
  
  return modal;
}

function setupChartEditorModalEvents(modal) {
  const closeBtn = modal.querySelector('.modal-close');
  const saveBtn = modal.querySelector('#save-chart-btn');
  const addLabelBtn = modal.querySelector('#add-label-btn');
  const addDatasetBtn = modal.querySelector('#add-dataset-btn');
  const tabButtons = modal.querySelectorAll('.tab-button');
  const titleInput = modal.querySelector('#chart-title-input');
  
  closeBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja fechar? As alterações não salvas serão perdidas.')) {
      closeModal(modal);
    }
  });
  
  saveBtn.addEventListener('click', () => {
    saveChartData(modal);
  });
  
  addLabelBtn.addEventListener('click', () => {
    addLabel();
  });
  
  addDatasetBtn.addEventListener('click', () => {
    addDataset();
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
    chartData.title = e.target.value;
    updatePreview(modal);
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
  
  if (tabName === 'preview') {
    updatePreview(modal);
  }
}

function initializeChart() {
  if (chartData.labels.length === 0) {
    chartData.labels = ['Label 1', 'Label 2', 'Label 3'];
  }
  if (chartData.datasets.length === 0) {
    chartData.datasets = [{
      label: 'Dataset 1',
      data: [10, 20, 30]
    }];
  }
}

function renderChartTypes() {
  const container = document.getElementById('chart-types-grid');
  if (!container) return;
  
  container.innerHTML = '';
  
  CHART_TYPES.forEach(type => {
    const typeCard = document.createElement('div');
    typeCard.className = `chart-type-card ${chartData.type === type.value ? 'active' : ''}`;
    typeCard.dataset.type = type.value;
    
    typeCard.innerHTML = `
      <i class="fa-solid ${type.icon}"></i>
      <span>${type.label}</span>
    `;
    
    typeCard.addEventListener('click', () => {
      chartData.type = type.value;
      renderChartTypes();
      updatePreview(document.querySelector('.chart-editor-modal'));
    });
    
    container.appendChild(typeCard);
  });
}

function addLabel() {
  const labelIndex = chartData.labels.length;
  const newLabel = `Label ${labelIndex + 1}`;
  chartData.labels.push(newLabel);
  
  chartData.datasets.forEach(dataset => {
    if (dataset.data.length < chartData.labels.length) {
      dataset.data.push(0);
    }
  });
  
  renderLabels();
  renderDatasets();
  updateTabCounts();
  
  setTimeout(() => {
    const lastInput = document.querySelector('.label-input:last-child');
    if (lastInput) {
      lastInput.focus();
      lastInput.select();
    }
  }, 100);
}

function removeLabel(index) {
  if (chartData.labels.length <= 1) {
    alert('O gráfico deve ter pelo menos um label');
    return;
  }
  
  if (confirm('Tem certeza que deseja remover este label? Os dados correspondentes também serão removidos.')) {
    chartData.labels.splice(index, 1);
    chartData.datasets.forEach(dataset => {
      dataset.data.splice(index, 1);
    });
    renderLabels();
    renderDatasets();
    updateTabCounts();
  }
}

function renderLabels() {
  const container = document.getElementById('labels-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (chartData.labels.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        <i class="fa-solid fa-tags"></i>
        <h4>Nenhum label adicionado</h4>
        <p>Clique em "Adicionar Label" para começar</p>
      </div>
    `;
    return;
  }
  
  chartData.labels.forEach((label, index) => {
    const labelCard = document.createElement('div');
    labelCard.className = 'label-card';
    
    labelCard.innerHTML = `
      <div class="label-card-content">
        <span class="label-number">${index + 1}</span>
        <input type="text" class="label-input" value="${label}" data-label-index="${index}" placeholder="Nome do label" />
        <button class="button button-small button-icon button-danger" title="Remover label" data-action="remove-label">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    
    const input = labelCard.querySelector('.label-input');
    const removeBtn = labelCard.querySelector('[data-action="remove-label"]');
    
    input.addEventListener('input', (e) => {
      chartData.labels[index] = e.target.value;
    });
    
    removeBtn.addEventListener('click', () => removeLabel(index));
    
    container.appendChild(labelCard);
  });
}

function addDataset() {
  const datasetIndex = chartData.datasets.length;
  const newDataset = {
    label: `Dataset ${datasetIndex + 1}`,
    data: new Array(chartData.labels.length).fill(0)
  };
  
  chartData.datasets.push(newDataset);
  renderDatasets();
  updateTabCounts();
}

function removeDataset(index) {
  if (chartData.datasets.length <= 1) {
    alert('O gráfico deve ter pelo menos um dataset');
    return;
  }
  
  if (confirm('Tem certeza que deseja remover este dataset?')) {
    chartData.datasets.splice(index, 1);
    renderDatasets();
    updateTabCounts();
  }
}

function renderDatasets() {
  const container = document.getElementById('datasets-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (chartData.labels.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <h4>Adicione labels primeiro</h4>
        <p>Vá para a aba "Labels" e adicione pelo menos um label antes de criar datasets</p>
      </div>
    `;
    return;
  }
  
  if (chartData.datasets.length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        <i class="fa-solid fa-database"></i>
        <h4>Nenhum dataset adicionado</h4>
        <p>Clique em "Adicionar Dataset" para começar</p>
      </div>
    `;
    return;
  }
  
  chartData.datasets.forEach((dataset, datasetIndex) => {
    const datasetCard = document.createElement('div');
    datasetCard.className = 'dataset-card';
    
    const dataInputs = chartData.labels.map((label, labelIndex) => {
      return `
        <div class="dataset-data-field">
          <label class="dataset-data-label">${label}</label>
          <input type="number" class="dataset-data-input" value="${dataset.data[labelIndex] || 0}" 
                 data-dataset-index="${datasetIndex}" data-label-index="${labelIndex}" 
                 placeholder="0" step="any" />
        </div>
      `;
    }).join('');
    
    datasetCard.innerHTML = `
      <div class="dataset-card-header">
        <input type="text" class="dataset-label-input" value="${dataset.label}" 
               data-dataset-index="${datasetIndex}" placeholder="Nome do dataset" />
        <button class="button button-small button-icon button-danger" title="Remover dataset" data-action="remove-dataset">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="dataset-card-body">
        <div class="dataset-data-grid">
          ${dataInputs}
        </div>
      </div>
    `;
    
    const labelInput = datasetCard.querySelector('.dataset-label-input');
    const removeBtn = datasetCard.querySelector('[data-action="remove-dataset"]');
    const dataInputElements = datasetCard.querySelectorAll('.dataset-data-input');
    
    labelInput.addEventListener('input', (e) => {
      chartData.datasets[datasetIndex].label = e.target.value;
      updatePreview(document.querySelector('.chart-editor-modal'));
    });
    
    dataInputElements.forEach(input => {
      input.addEventListener('input', (e) => {
        const dsIdx = parseInt(e.target.dataset.datasetIndex);
        const lblIdx = parseInt(e.target.dataset.labelIndex);
        const value = parseFloat(e.target.value) || 0;
        chartData.datasets[dsIdx].data[lblIdx] = value;
        updatePreview(document.querySelector('.chart-editor-modal'));
      });
    });
    
    removeBtn.addEventListener('click', () => removeDataset(datasetIndex));
    
    container.appendChild(datasetCard);
  });
}

function updatePreview(modal) {
  if (!modal) return;
  
  const previewContainer = document.getElementById('chart-preview');
  if (!previewContainer) return;
  
  previewContainer.innerHTML = '';
  
  if (chartData.labels.length === 0 || chartData.datasets.length === 0) {
    previewContainer.innerHTML = `
      <div class="empty-preview-message">
        <i class="fa-solid fa-chart-line"></i>
        <p>Configure labels e datasets para ver o preview</p>
      </div>
    `;
    return;
  }
  
  const canvas = document.createElement('canvas');
  canvas.id = 'chart-preview-canvas';
  previewContainer.appendChild(canvas);
  
  setTimeout(() => {
    if (typeof Chart !== 'undefined') {
      const ctx = canvas.getContext('2d');
      
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: getComputedStyle(document.body).color
            }
          }
        },
        scales: chartData.type !== 'pie' && chartData.type !== 'doughnut' && chartData.type !== 'polarArea' ? {
          x: {
            ticks: {
              color: getComputedStyle(document.body).color
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            ticks: {
              color: getComputedStyle(document.body).color
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        } : {}
      };
      
      new Chart(ctx, {
        type: chartData.type,
        data: {
          labels: chartData.labels,
          datasets: chartData.datasets
        },
        options: chartOptions
      });
    }
  }, 100);
}

function updateTabCounts() {
  const labelsCount = document.getElementById('labels-count');
  const datasetsCount = document.getElementById('datasets-count');
  
  if (labelsCount) {
    labelsCount.textContent = chartData.labels.length;
  }
  
  if (datasetsCount) {
    datasetsCount.textContent = chartData.datasets.length;
  }
}

function saveChartData(modal) {
  const titleInput = modal.querySelector('#chart-title-input');
  const title = titleInput?.value?.trim() || 'Gráfico sem título';
  
  if (chartData.labels.length === 0) {
    alert('O gráfico deve ter pelo menos um label');
    switchTab('labels', modal);
    return;
  }
  
  if (chartData.datasets.length === 0) {
    alert('O gráfico deve ter pelo menos um dataset');
    switchTab('datasets', modal);
    return;
  }
  
  const chartToSave = {
    type: chartData.type,
    title: title,
    labels: [...chartData.labels],
    datasets: chartData.datasets.map(ds => ({
      label: ds.label,
      data: [...ds.data]
    }))
  };
  
  let result;
  if (currentChartId) {
    result = updateChart(currentChartId, chartToSave);
  } else {
    result = saveChart(chartToSave);
  }
  
  if (result.success) {
    closeModal(modal);
    if (typeof window.loadCharts === 'function') {
      window.loadCharts();
    }
  } else {
    alert(`Erro ao salvar gráfico: ${result.error}`);
  }
}

function closeModal(modal) {
  modal.remove();
  resetChartEditor();
}

function resetChartEditor() {
  currentChartId = null;
  chartData = {
    type: 'bar',
    title: '',
    labels: [],
    datasets: []
  };
  currentTab = 'config';
}

export function openChartEditor(existingChartId = null) {
  if (existingChartId) {
    const existingChart = getChartById(existingChartId);
    if (existingChart) {
      currentChartId = existingChartId;
      chartData = {
        type: existingChart.type || 'bar',
        title: existingChart.title || '',
        labels: [...(existingChart.labels || [])],
        datasets: existingChart.datasets.map(ds => ({
          label: ds.label,
          data: [...ds.data]
        }))
      };
    }
  }
  
  const modal = createChartEditorModal();
  
  if (existingChartId && chartData.title) {
    const titleInput = modal.querySelector('#chart-title-input');
    if (titleInput) {
      titleInput.value = chartData.title;
    }
  }
  
  return modal;
}

export function openChartEditorFromData(data) {
  if (!data || !data.labels || !data.datasets) {
    console.error('Dados inválidos para criar gráfico');
    return;
  }
  
  currentChartId = null;
  chartData = {
    type: data.type || 'bar',
    title: data.title || 'Gráfico sem título',
    labels: [...data.labels],
    datasets: data.datasets.map(ds => ({
      label: ds.label,
      data: [...ds.data]
    }))
  };
  
  const modal = createChartEditorModal();
  
  const titleInput = modal.querySelector('#chart-title-input');
  if (titleInput) {
    titleInput.value = chartData.title;
  }
  
  renderChartTypes();
  renderLabels();
  renderDatasets();
  updateTabCounts();
  
  switchTab('preview', modal);
  
  return modal;
}

