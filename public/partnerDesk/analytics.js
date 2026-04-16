/**
 * analytics.js
 * Charts and analytics using Chart.js
 */

let analyticsCharts = {};

function initAnalytics() {
  destroyAnalyticsCharts();
  setTimeout(() => {
	  const data = getMonthlyAnalyticsData();
     initAnalyticsRevenue(data);
    initAnalyticsOrders(data);
    initStatusPie();
    initGrowthChart(data);
	  
	  console.log(data.labels);
console.log(data.orders);
  }, 100);
}

function destroyAnalyticsCharts() {
  Object.values(analyticsCharts).forEach(c => { try { c.destroy(); } catch(e){} });
  analyticsCharts = {};
}

function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: isDark ? '#5a5a78' : '#8a8aaa',
    accent: '#7c6ef0',
    green: '#2dca73',
    blue: '#3ba8ef',
    yellow: '#f5c542',
    red: '#ef4747'
  };
}

// ─── Revenue Chart ───
function initAnalyticsRevenue(data) {
  const canvas = document.getElementById('analyticsRevenueChart');
  if (!canvas) return;

  const c = getChartColors();
  analyticsCharts.revenue = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Revenue (₹)',
        data: data.revenue,
        borderColor: c.accent,
        backgroundColor: 'rgba(124,110,240,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: c.accent,
        pointRadius: 4,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => '₹' + ctx.raw.toLocaleString('en-IN')
          }
        }
      },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'DM Mono', size: 11 } } },
        y: {
          grid: { color: c.grid },
          ticks: {
            color: c.text,
            font: { family: 'DM Mono', size: 11 },
            callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)
          }
        }
      }
    }
  });
}

// ─── Orders Chart ───
function initAnalyticsOrders(data) {
  const canvas = document.getElementById('analyticsOrdersChart');
  if (!canvas) return;

  const c = getChartColors();
  analyticsCharts.orders = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Orders',
        data: data.orders,
        backgroundColor: data.orders.map((_, i) =>
          i === data.orders.length - 1 ? c.accent : 'rgba(124,110,240,0.4)'
        ),
        borderColor: c.accent,
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'DM Mono', size: 11 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'DM Mono', size: 11 } } }
      }
    }
  });
}

// ─── Status Pie Chart ───
function initStatusPie() {
  const canvas = document.getElementById('statusPieChart');
  if (!canvas) return;

  const c = getChartColors();
  const orders = IS_DEMO_MODE ? MOCK_ORDERS : (window._orders || []);
  const newCount = orders.filter(o => !o.vendorId).length;
  const acceptedCount = orders.filter(o => o.vendorId === currentVendor.uid).length;

  analyticsCharts.pie = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['New Orders', 'Accepted'],
      datasets: [{
        data: [newCount || 2, acceptedCount || 6],
        backgroundColor: [c.yellow, c.green],
        borderColor: 'transparent',
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: c.text, font: { family: 'DM Mono', size: 11 }, padding: 16 }
        }
      }
    }
  });
}

// ─── Revenue Growth Chart ───
function initGrowthChart(data) {
  const canvas = document.getElementById('growthChart');
  if (!canvas) return;

  const c = getChartColors();
  const rev = data.revenue;
  const growth = rev.map((v, i) => i === 0 ? 0 : Math.round(((v - rev[i-1]) / rev[i-1]) * 100));

  analyticsCharts.growth = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Growth %',
        data: growth,
        borderColor: c.green,
        backgroundColor: 'rgba(45,202,115,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: growth.map(v => v >= 0 ? c.green : c.red),
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ctx.raw + '%' } }
      },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.text, font: { family: 'DM Mono', size: 11 } } },
        y: {
          grid: { color: c.grid },
          ticks: { color: c.text, font: { family: 'DM Mono', size: 11 }, callback: v => v + '%' }
        }
      }
    }
  });
}
function getMonthlyAnalyticsData() {
  const orders = window._orders || [];

  const months = [];
  const revenue = [];
  const ordersCount = [];

  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);

    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const key = `${month} ${year}`;

    months.push(key);

    const filtered = orders.filter(o => {
      const date = new Date(o.createdAt);
      return date.getMonth() === d.getMonth() &&
             date.getFullYear() === year;
    });

    ordersCount.push(filtered.length);

    const totalRevenue = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
    revenue.push(totalRevenue);
  }

  return { labels: months, revenue, orders: ordersCount };
}