import { getAllCharts, deleteChart } from '../database/storage.js';
import { renderChart, destroyChart } from './chart-renderer.js';

const CHARTS_CONTAINER_ID = 'charts-container';

function createChartCard(chart) {
  const card = document.createElement('div');
  card.className = 'chart-card';
  card.dataset.chartId = chart.id;
  
  const chartId = `chart-${chart.id}`;
  
  card.innerHTML = `
    <div class="chart-card-header">
      <h3>${chart.title || 'Gráfico sem título'}</h3>
      <div class="chart-card-actions">
        <button class="button button-small button-icon" title="Editar gráfico" data-action="edit">
          <i class="fa-solid fa-edit"></i>
        </button>
        <button class="button button-small button-icon" title="Remover gráfico" data-action="delete">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="chart-card-body">
      <div class="chart-container" id="${chartId}"></div>
    </div>
    <div class="chart-card-footer">
      <span class="chart-type-badge">${chart.type || 'bar'}</span>
      <span class="chart-date">${formatDate(chart.createdAt)}</span>
    </div>
  `;
  
  const editBtn = card.querySelector('[data-action="edit"]');
  const deleteBtn = card.querySelector('[data-action="delete"]');
  
  editBtn.addEventListener('click', () => {
    if (typeof window.openChartEditor === 'function') {
      window.openChartEditor(chart.id);
    }
  });
  
  deleteBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja remover este gráfico?')) {
      const result = deleteChart(chart.id);
      if (result.success) {
        destroyChart(chartId);
        card.remove();
        const remainingCharts = getAllCharts();
        if (remainingCharts.length === 0) {
          loadAllCharts();
        }
      } else {
        alert(`Erro ao remover gráfico: ${result.error}`);
      }
    }
  });
  
  setTimeout(() => {
    renderChart(chartId, {
      type: chart.type,
      labels: chart.labels,
      datasets: chart.datasets,
      title: chart.title
    });
  }, 100);
  
  return card;
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

function ensureChartsContainer() {
  let container = document.getElementById(CHARTS_CONTAINER_ID);
  
  if (!container) {
    container = document.createElement('div');
    container.id = CHARTS_CONTAINER_ID;
    container.className = 'charts-container';
    
    const main = document.querySelector('main');
    if (main) {
      main.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  }
  
  return container;
}

export function loadAllCharts() {
  const charts = getAllCharts();
  const container = ensureChartsContainer();
  
  container.innerHTML = '';
  container.classList.remove('single-item', 'two-items');
  
  if (charts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-chart-line"></i>
        <p>Nenhum gráfico criado ainda</p>
        <p class="empty-state-subtitle">Clique em "Criar Gráfico" ou faça upload de um arquivo JSON para começar</p>
      </div>
    `;
    return;
  }
  
  charts.forEach(chart => {
    const card = createChartCard(chart);
    container.appendChild(card);
  });
  
  if (charts.length === 1) {
    container.classList.add('single-item');
  } else if (charts.length === 2) {
    container.classList.add('two-items');
  }
  
  setTimeout(() => {
    if (typeof window.updateGrid === 'function') {
      window.updateGrid();
    }
  }, 100);
}

export function refreshCharts() {
  loadAllCharts();
}

