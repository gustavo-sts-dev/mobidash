let chartInstances = new Map();

export function renderChart(containerId, chartConfig) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com id "${containerId}" não encontrado`);
    return null;
  }
  
  const canvas = document.createElement('canvas');
  container.innerHTML = '';
  container.appendChild(canvas);
  
  if (chartInstances.has(containerId)) {
    chartInstances.get(containerId).destroy();
  }
  
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
      },
      title: {
        display: chartConfig.title ? true : false,
        text: chartConfig.title || '',
        color: getComputedStyle(document.body).color,
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: chartConfig.type !== 'pie' && chartConfig.type !== 'doughnut' && chartConfig.type !== 'polarArea' ? {
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
  
  const chartData = {
    labels: chartConfig.labels || [],
    datasets: chartConfig.datasets || []
  };
  
  const chart = new Chart(ctx, {
    type: chartConfig.type || 'bar',
    data: chartData,
    options: chartOptions
  });
  
  chartInstances.set(containerId, chart);
  
  return chart;
}

export function destroyChart(containerId) {
  if (chartInstances.has(containerId)) {
    chartInstances.get(containerId).destroy();
    chartInstances.delete(containerId);
  }
}

export function destroyAllCharts() {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances.clear();
}

export function updateChart(containerId, chartConfig) {
  if (chartInstances.has(containerId)) {
    const chart = chartInstances.get(containerId);
    chart.data.labels = chartConfig.labels || [];
    chart.data.datasets = chartConfig.datasets || [];
    chart.type = chartConfig.type || chart.type;
    chart.update();
    return chart;
  } else {
    return renderChart(containerId, chartConfig);
  }
}

