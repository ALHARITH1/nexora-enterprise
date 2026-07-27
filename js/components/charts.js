window.NEXORA = window.NEXORA || {};

NEXORA.Components = NEXORA.Components || {};

NEXORA.Components.Charts = {
  instances: {},

  destroyAll: function() {
    var self = this;
    Object.keys(self.instances).forEach(function(k) {
      if (self.instances[k] && typeof self.instances[k].destroy === 'function') {
        self.instances[k].destroy();
        delete self.instances[k];
      }
    });
  },

  createProgress: function(canvasId, projects) {
    if (typeof Chart === 'undefined') return null;
    var canvas = document.getElementById(canvasId);
    if (!canvas || !projects || !projects.length) return null;
    var H = NEXORA.Helpers;
    var labels = projects.slice(0, 10).map(function(p) { return p.name.substring(0, 12); });
    var progressData = projects.slice(0, 10).map(function(p) { return H.projProgress(p.id); });
    var bgColors = progressData.map(function(pr) {
      return pr >= 75 ? 'rgba(34,197,94,.7)' : pr >= 40 ? 'rgba(212,175,55,.7)' : 'rgba(30,58,138,.7)';
    });
    var borderColors = progressData.map(function(pr) {
      return pr >= 75 ? 'rgba(34,197,94,1)' : pr >= 40 ? 'rgba(212,175,55,1)' : 'rgba(30,58,138,1)';
    });
    try {
      this.instances.progress = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'نسبة الإنجاز %',
            data: progressData,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
      return this.instances.progress;
    } catch (e) {
      return null;
    }
  },

  createTasks: function(canvasId, taskData) {
    if (typeof Chart === 'undefined') return null;
    var canvas = document.getElementById(canvasId);
    if (!canvas || !taskData) return null;
    var todo = taskData.todo || 0;
    var progress = taskData.inProgress || 0;
    var done = taskData.done || 0;
    var pending = taskData.pending || 0;
    try {
      this.instances.tasks = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['معلق', 'قيد العمل', 'مكتمل', 'بانتظار الاعتماد'],
          datasets: [{
            data: [todo, progress, done, pending],
            backgroundColor: ['rgba(254,243,199,.9)', 'rgba(219,234,254,.9)', 'rgba(220,252,231,.9)', 'rgba(254,202,202,.9)'],
            borderColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: 'IBM Plex Sans Arabic' }, padding: 12 }
            }
          }
        }
      });
      return this.instances.tasks;
    } catch (e) {
      return null;
    }
  }
};

window.destroyCharts = function() {
  NEXORA.Components.Charts.destroyAll();
};
