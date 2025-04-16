let sessions = [];
let currentSession = {};
let startTime = 0;
let pausedTime = 0;
let timerInterval;
let isRunning = false;
let isPaused = false;
let estimatedTime = 0;


function initHelpModal() {
    const helpBtn = document.getElementById("helpBtn");
    const helpModal = document.getElementById("helpModal");
    const closeModal = document.getElementById("closeModal");
  
    if (helpBtn && helpModal && closeModal) {
      helpBtn.onclick = () => {
        helpModal.style.display = "block";
      };
  
      closeModal.onclick = () => {
        helpModal.style.display = "none";
      };
  
      window.onclick = (e) => {
        if (e.target === helpModal) {
          helpModal.style.display = "none";
        }
      };
    }
  }
  
  // Espera a que el DOM esté listo para asignar los eventos
  window.onload = () => {
    initHelpModal();
  };

  
// 👇 Aquí sigue tu función de cálculo normalmente
function calculate() {
    const pieces = parseFloat(document.getElementById('pieces').value);
    const goal = parseFloat(document.getElementById('goal').value);
    
    if (isNaN(pieces) || isNaN(goal) || goal <= 0) {
        showAlert('⚠️ Ingresa valores válidos!', 'danger');
        return;
    }
    
    estimatedTime = (pieces / goal) * 60;
    const hours = Math.floor(estimatedTime / 60);
    const minutes = Math.floor(estimatedTime % 60);
    const seconds = Math.round((estimatedTime % 1) * 60);

    document.getElementById('result').innerHTML = `
        <h3>📊 Resultados en Tiempo Real</h3>
        <div class="session-card">
            <span>⏳ Tiempo estimado:</span>
            <div class="time-display">
                ${hours.toString().padStart(2, '0')}h 
                ${minutes.toString().padStart(2, '0')}m 
                ${seconds.toString().padStart(2, '0')}s
            </div>
            <small>${pieces} piezas / ${goal} por hora</small>
        </div>
    `;
}

function toggleTimer() {
    const toggleBtn = document.getElementById('toggleBtn');
    const alarmSound = document.getElementById('alarmSound');
    const timerContainer = document.querySelector('.timer-container');

    if (!isRunning) {
        // Solo permitir iniciar si ya se ha calculado
        if (!estimatedTime || estimatedTime <= 0) {
            showAlert("⚠️ Debes calcular primero el tiempo", "danger");
            return;
        }

        // Si es reanudación de una sesión pausada
        if (isPaused) {
            startTime = Date.now() - pausedTime;
            isPaused = false;
        } else {
            // Crear nueva sesión
            const workerName = document.getElementById('workerName').value || 'Anónimo';
            currentSession = {
                name: workerName,
                startTime: new Date(),
                endTime: null,
                estimatedTime: estimatedTime,
                actualTime: 0
            };
            startTime = Date.now();
        }

        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);

        // Cambiar visualmente a modo pausa
        toggleBtn.innerHTML = "⏸ Pausar";
        toggleBtn.classList.remove('btn-paused');
        toggleBtn.classList.add('btn-primary');

    } else {
        // PAUSAR
        clearInterval(timerInterval);
        currentSession.endTime = new Date();
        currentSession.actualTime = (Date.now() - startTime) / 1000 / 60;

        sessions.push(currentSession);
        updateSessionDetails();
        saveToLocal(currentSession);

        isRunning = false;
        isPaused = true;
        pausedTime = Date.now() - startTime;

        // Cambiar visualmente a modo reanudar
        toggleBtn.innerHTML = "▶ Reanudar";
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-paused');

        document.getElementById('productivityEvaluation').style.display = 'block';


        // Limpiar alarma si está activa
        timerContainer.classList.remove('alert-effect');
        timerContainer.classList.remove('played-alarm');
    }
}



function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isPaused = false;
    startTime = 0;
    pausedTime = 0;
    estimatedTime = 0;
    
    document.getElementById('timer').textContent = '00:00:00';
    document.getElementById('result').innerHTML = '<h3>📊 Resultados en Tiempo Real</h3>';
    document.querySelectorAll('button').forEach(btn => btn.classList.remove('btn-active'));
    document.querySelector('.timer-container').classList.remove('timer-alert');
    document.querySelector('.timer-container').style.boxShadow = '';
    document.getElementById('productivityEvaluation').style.display = 'none';
    document.getElementById('actualPieces').value = '';
    document.getElementById('evaluacionResultado').innerHTML = '';

    sessions = [];
    updateSessionDetails();
}

function updateTimer() {
    const elapsed = Date.now() - startTime;
    const formattedTime = new Date(elapsed).toISOString().substr(11, 8);
    const timerElement = document.getElementById('timer');
    const timerContainer = document.querySelector('.timer-container');
    const alarmSound = document.getElementById('alarmSound');

    timerElement.textContent = formattedTime;

    const estimatedTimeInMs = estimatedTime * 60 * 1000;

    if (elapsed >= estimatedTimeInMs) {
        console.log("⏰ ALERTA ACTIVADA");

        timerContainer.classList.add('alert-effect');

        if (!timerContainer.classList.contains('played-alarm')) {
            alarmSound?.play();
            timerContainer.classList.add('played-alarm');
        }
    } else {
        timerContainer.classList.remove('alert-effect');
        timerContainer.classList.remove('played-alarm');
    }
}



function evaluarProductividad() {
    const realPieces = parseFloat(document.getElementById('actualPieces').value);
    const goal = parseFloat(document.getElementById('goal').value);
    const actualMinutes = currentSession.actualTime;
  
    if (isNaN(realPieces) || realPieces <= 0) {
      showAlert("⚠️ Ingresa la cantidad real de piezas completadas.", "danger");
      return;
    }
  
    let expectedPieces = (goal / 60) * actualMinutes;
    expectedPieces = expectedPieces < 1 ? 1 : expectedPieces;
  
    const productividad = ((realPieces / expectedPieces) * 100).toFixed(1);
    const color = productividad >= 100 ? 'limegreen' : productividad >= 80 ? 'goldenrod' : 'crimson';
  
    // Guardar en currentSession
    currentSession.realPieces = realPieces;
    currentSession.expectedPieces = Math.round(expectedPieces);

    // Asegurar que currentSession tenga toda la info
    currentSession.name = document.getElementById("workerName").value || "Anónimo";
    currentSession.task = document.getElementById("task").value || "Sin tarea";
    currentSession.pieces = parseFloat(document.getElementById("pieces").value) || 0;
    currentSession.goal = parseFloat(document.getElementById("goal").value) || 0;

    currentSession.productividad = {
      realTime: actualMinutes.toFixed(1),
      expected: Math.round(expectedPieces),
      completed: realPieces,
      percent: productividad
    };
  
    // Mostrar resultado visual
    document.getElementById('evaluacionResultado').innerHTML = `
      <div class="session-card" style="background: white; color: black;">
        <p>⏱️ <strong>Tiempo real:</strong> ${actualMinutes.toFixed(1)} min</p>
        <p>🎯 <strong>Piezas esperadas:</strong> ${Math.round(expectedPieces)}</p>
        <p>📦 <strong>Piezas completadas:</strong> ${realPieces}</p>
        <p>📊 <strong style="color: ${color}">Productividad real: ${productividad}%</strong></p>
      </div>
    `;
  
    // Asegurar fecha e intervalos también
    currentSession.date = currentSession.date || new Date().toLocaleString();
    currentSession.start = currentSession.start || new Date(startTime).toLocaleTimeString();
    currentSession.end = currentSession.end || new Date().toLocaleTimeString();

    // Guardar con evaluación en historial
    let history = JSON.parse(localStorage.getItem('history') || '[]');
  
    // Evitar duplicado: si ya existe la sesión, la eliminamos
    if (history.length && history[history.length - 1].date === currentSession.date) {
      history.pop();
    }
  
    history.push(currentSession);
    localStorage.setItem('history', JSON.stringify(history));
  }
  

function updateSessionDetails() {
    const detailsDiv = document.getElementById('sessionDetails');
    if (!detailsDiv) return; // <- Evita el error si no existe

    detailsDiv.innerHTML = sessions.map((session, index) => `
        <div class="session-card">
            <h4>🧑💼 ${session.name} - Sesión ${index + 1}</h4>
            <p>⏱️ Real: ${session.actualTime.toFixed(1)} min</p>
            <p>📈 Productividad: ${((session.estimatedTime / session.actualTime) * 100).toFixed(1)}%</p>
            <small>${session.startTime.toLocaleTimeString()} - ${session.endTime.toLocaleTimeString()}</small>
        </div>
    `).join('');
}

function showHistory() {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    const historyContainer = document.getElementById('historyContainer');

    if (!historyContainer) {
        const container = document.createElement('div');
        container.id = 'historyContainer';
        container.style.marginTop = '20px';
        document.getElementById('result').appendChild(container);
    }

    const content = history.reverse().map(item => {
        let icon = '';
        let color = '';
      
        if (item.productividad) {
          const pct = item.productividad.percent;
          if (pct >= 100) {
            icon = '✅';
            color = 'limegreen';
          } else if (pct >= 80) {
            icon = '🟡';
            color = 'goldenrod';
          } else {
            icon = '❌';
            color = 'crimson';
          }
        }
      
        return `
          <div class="session-card">
            <p>📅 ${item.date}</p>
            <p>👤 ${item.task}</p>
            <p>📦 Piezas: ${item.pieces}</p>
            <p>🎯 Meta/h: ${item.goal}</p>
            <p>🕐 Inicio: ${item.start}</p>
            <p>🕔 Fin: ${item.end}</p>
      
            ${item.productividad ? `
              <hr>
              <p>⏱️ <strong>Tiempo real:</strong> ${item.productividad.realTime} min</p>
              <p>🎯 <strong>Esperadas:</strong> ${item.productividad.expected}</p>
              <p>📦 <strong>Completadas:</strong> ${item.productividad.completed}</p>
              <p>📊 <strong style="color: ${color};">
                ${icon} Productividad: ${item.productividad.percent}%
              </strong></p>
            ` : ''}
          </div>
        `;
      }).join('');

    document.getElementById('historyContainer').innerHTML = `
        <h4 style="margin-bottom: 15px;">📚 Historial Registrado</h4>
        ${content || '<p>No hay registros históricos</p>'}
    `;
}


function exportToCSV() {
    const history = JSON.parse(localStorage.getItem('history') || '[]');

    if (!history.length) {
        alert("⚠️ No hay datos para exportar.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Fecha,Tarea,Piezas,Meta/h,Inicio,Fin\n";

    csvContent += history.map(entry => [
        entry.date,
        entry.task,
        entry.pieces,
        entry.goal,
        entry.start,
        entry.end
    ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historial_productividad.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const taskGoals = {
        "Recepción APP": 130,
        "Recepción FTW": 90,
        "Recepción HDW": 70,
        "Alarmado y Perchado": 110,
        "Planchado y estándares": 50,
        "Reposición desde Stock": 160
      };
}


function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert-effect session-card`;
    alert.textContent = message;
    document.getElementById('result').appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function clearHistory() {
    if (confirm("¿Borrar todo el historial?")) {
        localStorage.removeItem('history');
        document.getElementById('result').innerHTML = '<h3>📊 Resultados en Tiempo Real</h3>';
    }
}


function saveToLocal(session) {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    history.push({
        date: new Date().toLocaleString(),
        task: session.name,
        pieces: document.getElementById('pieces').value,
        goal: document.getElementById('goal').value,
        start: session.startTime.toLocaleTimeString(),
        end: session.endTime.toLocaleTimeString()
    });
    localStorage.setItem('history', JSON.stringify(history));
}