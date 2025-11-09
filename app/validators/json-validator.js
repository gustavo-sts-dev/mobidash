const VALID_CHART_TYPES = ['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea', 'bubble', 'scatter'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DATASETS = 10;
const MAX_DATA_POINTS = 1000;

function validateChartType(type) {
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Tipo de gráfico não especificado ou inválido' };
  }
  
  if (!VALID_CHART_TYPES.includes(type.toLowerCase())) {
    return { 
      valid: false, 
      error: `Tipo de gráfico inválido. Tipos válidos: ${VALID_CHART_TYPES.join(', ')}` 
    };
  }
  
  return { valid: true };
}

function validateLabels(labels) {
  if (!Array.isArray(labels)) {
    return { valid: false, error: 'Labels deve ser um array' };
  }
  
  if (labels.length === 0) {
    return { valid: false, error: 'Labels não pode estar vazio' };
  }
  
  if (labels.length > MAX_DATA_POINTS) {
    return { valid: false, error: `Labels excede o limite de ${MAX_DATA_POINTS} pontos` };
  }
  
  const allStrings = labels.every(label => typeof label === 'string' || typeof label === 'number');
  if (!allStrings) {
    return { valid: false, error: 'Todos os labels devem ser strings ou números' };
  }
  
  return { valid: true };
}

function validateDataset(dataset, index) {
  if (!dataset || typeof dataset !== 'object') {
    return { valid: false, error: `Dataset ${index} não é um objeto válido` };
  }
  
  if (!dataset.label || typeof dataset.label !== 'string') {
    return { valid: false, error: `Dataset ${index} deve ter uma propriedade 'label' do tipo string` };
  }
  
  if (!Array.isArray(dataset.data)) {
    return { valid: false, error: `Dataset ${index} deve ter uma propriedade 'data' do tipo array` };
  }
  
  if (dataset.data.length === 0) {
    return { valid: false, error: `Dataset ${index} não pode ter data vazio` };
  }
  
  if (dataset.data.length > MAX_DATA_POINTS) {
    return { valid: false, error: `Dataset ${index} excede o limite de ${MAX_DATA_POINTS} pontos` };
  }
  
  const validData = dataset.data.every(value => 
    typeof value === 'number' || 
    (typeof value === 'object' && value !== null && (value.x !== undefined || value.y !== undefined))
  );
  
  if (!validData) {
    return { valid: false, error: `Dataset ${index} contém valores de data inválidos` };
  }
  
  return { valid: true };
}

function validateDatasets(datasets) {
  if (!Array.isArray(datasets)) {
    return { valid: false, error: 'Datasets deve ser um array' };
  }
  
  if (datasets.length === 0) {
    return { valid: false, error: 'Deve haver pelo menos um dataset' };
  }
  
  if (datasets.length > MAX_DATASETS) {
    return { valid: false, error: `Número de datasets excede o limite de ${MAX_DATASETS}` };
  }
  
  for (let i = 0; i < datasets.length; i++) {
    const validation = validateDataset(datasets[i], i + 1);
    if (!validation.valid) {
      return validation;
    }
  }
  
  return { valid: true };
}

function validateDataConsistency(labels, datasets) {
  const labelCount = labels.length;
  
  for (let i = 0; i < datasets.length; i++) {
    const dataLength = datasets[i].data.length;
    
    if (dataLength !== labelCount) {
      return { 
        valid: false, 
        error: `Dataset ${i + 1} tem ${dataLength} pontos de dados, mas há ${labelCount} labels. Eles devem ter o mesmo tamanho.` 
      };
    }
  }
  
  return { valid: true };
}

export function validateChartJSON(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    return { valid: false, error: 'JSON inválido: deve ser um objeto' };
  }
  
  if (Array.isArray(jsonData)) {
    return { valid: false, error: 'JSON inválido: objeto raiz não pode ser um array' };
  }
  
  const typeValidation = validateChartType(jsonData.type);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  const labelsValidation = validateLabels(jsonData.labels);
  if (!labelsValidation.valid) {
    return labelsValidation;
  }
  
  const datasetsValidation = validateDatasets(jsonData.datasets);
  if (!datasetsValidation.valid) {
    return datasetsValidation;
  }
  
  const consistencyValidation = validateDataConsistency(jsonData.labels, jsonData.datasets);
  if (!consistencyValidation.valid) {
    return consistencyValidation;
  }
  
  return { valid: true, data: jsonData };
}

export function validateFileSize(file) {
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

export function validateFileExtension(fileName) {
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

export function validateJSONStructure(fileContent) {
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

export function validateCompleteChartFile(file, fileContent) {
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  const extensionValidation = validateFileExtension(file.name);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }
  
  const structureValidation = validateJSONStructure(fileContent);
  if (!structureValidation.valid) {
    return structureValidation;
  }
  
  const chartValidation = validateChartJSON(structureValidation.data);
  if (!chartValidation.valid) {
    return chartValidation;
  }
  
  return { valid: true, data: chartValidation.data };
}

