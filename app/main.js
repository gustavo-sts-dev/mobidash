import { openTableEditor } from './editors/table-editor.js';
import { openChartEditor, openChartEditorFromData } from './editors/chart-editor.js';
import { loadAllCharts, refreshCharts } from './charts/chart-manager.js';
import { loadAllTables } from './tables/table-manager.js';
import { getTableById } from './database/storage.js';
import './database/file.js';

window.openTableEditor = openTableEditor;
window.openChartEditor = openChartEditor;
window.openChartEditorFromData = openChartEditorFromData;
window.getTableById = getTableById;
window.loadTables = loadAllTables;
window.loadCharts = refreshCharts;

document.addEventListener('DOMContentLoaded', () => {
  const createChartBtn = document.getElementById('create-chart-btn');
  const createTableBtn = document.getElementById('create-table-btn');
  
  if (createChartBtn) {
    createChartBtn.addEventListener('click', () => {
      openChartEditor();
    });
  }
  
  if (createTableBtn) {
    createTableBtn.addEventListener('click', () => {
      openTableEditor();
    });
  }
  
  loadAllCharts();
  loadAllTables();
});

