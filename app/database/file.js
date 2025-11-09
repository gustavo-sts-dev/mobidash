import { saveChart } from './storage.js';
import { refreshCharts } from '../charts/chart-manager.js';

function showError(message) {
  alert(`Erro: ${message}`);
}

function showSuccess(message) {
  alert(`Sucesso: ${message}`);
}

function showLoading() {
  const loading = document.createElement('div');
  loading.id = 'upload-loading';
  loading.className = 'upload-loading';
  loading.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Validando arquivo...</p>
  `;
  document.body.appendChild(loading);
  return loading;
}

function hideLoading(loadingElement) {
  if (loadingElement) {
    loadingElement.remove();
  }
}

function validateFileExtension(fileName) {
  if (!fileName) {
    return { valid: false, error: 'Nome do arquivo não fornecido' };
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    return { valid: false, error: 'Arquivo sem extensão' };
  }
  
  if (extension !== 'json') {
    return { valid: false, error: 'Apenas arquivos .json são permitidos' };
  }
  
  return { valid: true };
}

function validateFileSize(file) {
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  
  if (!file) {
    return { valid: false, error: 'Arquivo não fornecido' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Arquivo muito grande. Tamanho máximo: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB` 
    };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'Arquivo está vazio' };
  }
  
  return { valid: true };
}

function validateJSONStructure(fileContent) {
  if (!fileContent || typeof fileContent !== 'string') {
    return { valid: false, error: 'Conteúdo do arquivo inválido' };
  }
  
  if (fileContent.trim().length === 0) {
    return { valid: false, error: 'Arquivo está vazio' };
  }
  
  try {
    const parsed = JSON.parse(fileContent);
    return { valid: true, data: parsed };
  } catch (error) {
    return { 
      valid: false, 
      error: `JSON inválido: ${error.message}` 
    };
  }
}

function validateChartJSON(jsonData) {
  const VALID_CHART_TYPES = ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea', 'bubble', 'scatter'];
  const MAX_DATASETS = 10;
  const MAX_DATA_POINTS = 1000;
  
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, error: 'JSON inválido: deve ser um objeto' };
  }
  
  if (Array.isArray(jsonData)) {
    return { valid: false, error: 'JSON inválido: objeto raiz não pode ser um array' };
  }
  
  if (!jsonData.type || typeof jsonData.type !== 'string') {
    return { valid: false, error: 'Tipo de gráfico não especificado ou inválido' };
  }
  
  if (!VALID_CHART_TYPES.includes(jsonData.type.toLowerCase())) {
    return { 
      valid: false, 
      error: `Tipo de gráfico inválido. Tipos válidos: ${VALID_CHART_TYPES.join(', ')}` 
    };
  }
  
  if (!Array.isArray(jsonData.labels)) {
    return { valid: false, error: 'Labels deve ser um array' };
  }
  
  if (jsonData.labels.length === 0) {
    return { valid: false, error: 'Labels não pode estar vazio' };
  }
  
  if (jsonData.labels.length > MAX_DATA_POINTS) {
    return { valid: false, error: `Labels excede o limite de ${MAX_DATA_POINTS} pontos` };
  }
  
  if (!Array.isArray(jsonData.datasets)) {
    return { valid: false, error: 'Datasets deve ser um array' };
  }
  
  if (jsonData.datasets.length === 0) {
    return { valid: false, error: 'Deve haver pelo menos um dataset' };
  }
  
  if (jsonData.datasets.length > MAX_DATASETS) {
    return { valid: false, error: `Número de datasets excede o limite de ${MAX_DATASETS}` };
  }
  
  for (let i = 0; i < jsonData.datasets.length; i++) {
    const dataset = jsonData.datasets[i];
    
    if (!dataset || typeof dataset !== 'object') {
      return { valid: false, error: `Dataset ${i + 1} não é um objeto válido` };
    }
    
    if (!dataset.label || typeof dataset.label !== 'string') {
      return { valid: false, error: `Dataset ${i + 1} deve ter uma propriedade 'label' do tipo string` };
    }
    
    if (!Array.isArray(dataset.data)) {
      return { valid: false, error: `Dataset ${i + 1} deve ter uma propriedade 'data' do tipo array` };
    }
    
    if (dataset.data.length === 0) {
      return { valid: false, error: `Dataset ${i + 1} não pode ter data vazio` };
    }
    
    if (dataset.data.length > MAX_DATA_POINTS) {
      return { valid: false, error: `Dataset ${i + 1} excede o limite de ${MAX_DATA_POINTS} pontos` };
    }
    
    if (dataset.data.length !== jsonData.labels.length) {
      return { 
        valid: false, 
        error: `Dataset ${i + 1} tem ${dataset.data.length} pontos de dados, mas há ${jsonData.labels.length} labels. Eles devem ter o mesmo tamanho.` 
      };
    }
    
    const validData = dataset.data.every(value => 
      typeof value === 'number' || 
      (typeof value === 'object' && value !== null && (value.x !== undefined || value.y !== undefined))
    );
    
    if (!validData) {
      return { valid: false, error: `Dataset ${i + 1} contém valores de data inválidos` };
    }
  }
  
  return { valid: true, data: jsonData };
}

function initializeFileUpload() {
  const upload_input = document.getElementById("upload-input");
  
  if (!upload_input) {
    console.warn('Upload input não encontrado');
    return;
  }

  upload_input.addEventListener("change", async (ev) => {
    const file = ev.target.files[0];

    if (!file) {
      return;
    }

    const loading = showLoading();

    try {
      const file_name = file.name;
      const file_extension = file_name.split(".").pop()?.toLowerCase();

      const extensionValidation = validateFileExtension(file_name);
      if (!extensionValidation.valid) {
        showError(extensionValidation.error);
        upload_input.value = "";
        hideLoading(loading);
        return;
      }

      const sizeValidation = validateFileSize(file);
      if (!sizeValidation.valid) {
        showError(sizeValidation.error);
        upload_input.value = "";
        hideLoading(loading);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const fileContent = e.target.result;

        const structureValidation = validateJSONStructure(fileContent);
        if (!structureValidation.valid) {
          showError(structureValidation.error);
          upload_input.value = "";
          hideLoading(loading);
          return;
        }

        const chartValidation = validateChartJSON(structureValidation.data);
        if (!chartValidation.valid) {
          showError(`Arquivo JSON inválido para gráfico: ${chartValidation.error}`);
          upload_input.value = "";
          hideLoading(loading);
          return;
        }

        const chartData = {
          type: chartValidation.data.type,
          labels: chartValidation.data.labels,
          datasets: chartValidation.data.datasets,
          title: chartValidation.data.title || file_name.split(".")[0]
        };

        const saveResult = saveChart(chartData);
        
        if (saveResult.success) {
          showSuccess("Gráfico salvo com sucesso!");
          refreshCharts();
        } else {
          showError(`Erro ao salvar gráfico: ${saveResult.error}`);
        }

        upload_input.value = "";
        hideLoading(loading);
      };

      reader.onerror = () => {
        showError("Ocorreu um erro ao ler o arquivo. Tente novamente.");
        upload_input.value = "";
        hideLoading(loading);
      };

      reader.readAsText(file, 'UTF-8');

    } catch (error) {
      console.error("Erro inesperado ao processar arquivo:", error);
      showError("Erro inesperado ao processar o arquivo. Tente novamente.");
      upload_input.value = "";
      hideLoading(loading);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFileUpload);
} else {
  initializeFileUpload();
}
