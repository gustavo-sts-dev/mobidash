const STORAGE_PREFIX = 'mobidash_';
const CHARTS_KEY = `${STORAGE_PREFIX}charts`;
const TABLES_KEY = `${STORAGE_PREFIX}tables`;

function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function saveChart(chartData) {
  try {
    const charts = getAllCharts();
    const chartId = generateId();
    const chartWithId = {
      id: chartId,
      ...chartData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    charts.push(chartWithId);
    localStorage.setItem(CHARTS_KEY, JSON.stringify(charts));
    
    return { success: true, id: chartId, chart: chartWithId };
  } catch (error) {
    console.error('Erro ao salvar gráfico:', error);
    return { success: false, error: error.message };
  }
}

export function getAllCharts() {
  try {
    const chartsJson = localStorage.getItem(CHARTS_KEY);
    return chartsJson ? JSON.parse(chartsJson) : [];
  } catch (error) {
    console.error('Erro ao recuperar gráficos:', error);
    return [];
  }
}

export function getChartById(id) {
  try {
    const charts = getAllCharts();
    return charts.find(chart => chart.id === id) || null;
  } catch (error) {
    console.error('Erro ao buscar gráfico:', error);
    return null;
  }
}

export function updateChart(id, chartData) {
  try {
    const charts = getAllCharts();
    const index = charts.findIndex(chart => chart.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Gráfico não encontrado' };
    }
    
    charts[index] = {
      ...charts[index],
      ...chartData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(CHARTS_KEY, JSON.stringify(charts));
    
    return { success: true, chart: charts[index] };
  } catch (error) {
    console.error('Erro ao atualizar gráfico:', error);
    return { success: false, error: error.message };
  }
}

export function deleteChart(id) {
  try {
    const charts = getAllCharts();
    const filteredCharts = charts.filter(chart => chart.id !== id);
    
    if (filteredCharts.length === charts.length) {
      return { success: false, error: 'Gráfico não encontrado' };
    }
    
    localStorage.setItem(CHARTS_KEY, JSON.stringify(filteredCharts));
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar gráfico:', error);
    return { success: false, error: error.message };
  }
}

export function saveTable(tableData) {
  try {
    const tables = getAllTables();
    const tableId = generateId();
    const tableWithId = {
      id: tableId,
      ...tableData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tables.push(tableWithId);
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    
    return { success: true, id: tableId, table: tableWithId };
  } catch (error) {
    console.error('Erro ao salvar tabela:', error);
    return { success: false, error: error.message };
  }
}

export function getAllTables() {
  try {
    const tablesJson = localStorage.getItem(TABLES_KEY);
    return tablesJson ? JSON.parse(tablesJson) : [];
  } catch (error) {
    console.error('Erro ao recuperar tabelas:', error);
    return [];
  }
}

export function getTableById(id) {
  try {
    const tables = getAllTables();
    return tables.find(table => table.id === id) || null;
  } catch (error) {
    console.error('Erro ao buscar tabela:', error);
    return null;
  }
}

export function updateTable(id, tableData) {
  try {
    const tables = getAllTables();
    const index = tables.findIndex(table => table.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Tabela não encontrada' };
    }
    
    tables[index] = {
      ...tables[index],
      ...tableData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    
    return { success: true, table: tables[index] };
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
    return { success: false, error: error.message };
  }
}

export function deleteTable(id) {
  try {
    const tables = getAllTables();
    const filteredTables = tables.filter(table => table.id !== id);
    
    if (filteredTables.length === tables.length) {
      return { success: false, error: 'Tabela não encontrada' };
    }
    
    localStorage.setItem(TABLES_KEY, JSON.stringify(filteredTables));
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar tabela:', error);
    return { success: false, error: error.message };
  }
}

export function clearAllData() {
  try {
    localStorage.removeItem(CHARTS_KEY);
    localStorage.removeItem(TABLES_KEY);
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    return { success: false, error: error.message };
  }
}

