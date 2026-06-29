/* index.js - Interactive Simulations & E-Book Navigation Logic */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Navigation & Theme Logic
  // ==========================================================================
  
  const body = document.body;
  const sidebar = document.getElementById('sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnPrint = document.getElementById('btn-print');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const progressBar = document.getElementById('progress-bar');
  const readerPages = document.getElementById('book-pages');
  const chapterTitleIndicator = document.getElementById('chapter-title-indicator');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');
  
  // Navigation State
  const navItems = Array.from(document.querySelectorAll('.sidebar-nav .nav-item'));
  const chapters = Array.from(document.querySelectorAll('.book-chapter'));
  let currentChapterIndex = 0;
  
  // Sidebar Toggle on mobile
  btnToggleSidebar.addEventListener('click', () => {
    document.querySelector('.app-container').classList.toggle('sidebar-open');
  });
  
  // Theme Toggle (Dark vs Light)
  btnThemeToggle.addEventListener('click', () => {
    if (body.classList.contains('theme-dark')) {
      body.classList.replace('theme-dark', 'theme-light');
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
      localStorage.setItem('theme', 'light');
    } else {
      body.classList.replace('theme-light', 'theme-dark');
      iconSun.classList.add('hidden');
      iconMoon.classList.remove('hidden');
      localStorage.setItem('theme', 'dark');
    }
  });

  // Load Saved Theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    body.classList.replace('theme-dark', 'theme-light');
    iconMoon.classList.add('hidden');
    iconSun.classList.remove('hidden');
  }

  // Print PDF Trigger
  btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Chapter Navigation Handler
  function navigateToChapter(targetId) {
    const activeChapter = document.getElementById(targetId);
    if (!activeChapter) return;
    
    // Smooth scroll to the chapter
    activeChapter.scrollIntoView({ behavior: 'smooth' });
    
    // Update indicator immediately for feedback
    const chapterTitleText = activeChapter.querySelector('.chapter-title').textContent;
    chapterTitleIndicator.textContent = `Reading: ${chapterTitleText}`;
  }

  // Bind Sidebar Nav Click
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      navigateToChapter(targetId);
      // Close sidebar on mobile after clicking
      document.querySelector('.app-container').classList.remove('sidebar-open');
    });
  });

  // Hide the prev/next buttons as we are now scrolling
  if (btnPrev) btnPrev.style.display = 'none';
  if (btnNext) btnNext.style.display = 'none';

  // Progress Bar update
  function updateProgressBar() {
    const scrollableHeight = body.scrollHeight - window.innerHeight;
    if (scrollableHeight <= 0) {
      progressBar.style.width = '100%';
      return;
    }
    const scrolled = (window.scrollY / scrollableHeight) * 100;
    progressBar.style.width = `${scrolled}%`;
  }
  
  window.addEventListener('scroll', updateProgressBar);
  window.addEventListener('resize', updateProgressBar);

  // ==========================================================================
  // 2. Simulation Handlers & Intersection Observer
  // ==========================================================================
  
  // Track active simulations to avoid drawing loops in the background
  const activeLoops = {
    electricity: false,
    doping: false,
    mosfet: false,
    cmos: false
  };

  function triggerSimInitialization(chapterId) {
    if (chapterId === 'ch-electricity') {
      activeLoops.electricity = true;
      initElectricitySim();
    } else if (chapterId === 'ch-semiconductors') {
      activeLoops.doping = true;
      initDopingSim();
    } else if (chapterId === 'ch-mosfets') {
      activeLoops.mosfet = true;
      initMOSFETSim();
    } else if (chapterId === 'ch-cmos') {
      activeLoops.cmos = true;
      initCMOSSim();
    }
  }

  function stopSimInitialization(chapterId) {
    if (chapterId === 'ch-electricity') activeLoops.electricity = false;
    else if (chapterId === 'ch-semiconductors') activeLoops.doping = false;
    else if (chapterId === 'ch-mosfets') activeLoops.mosfet = false;
    else if (chapterId === 'ch-cmos') activeLoops.cmos = false;
  }

  // Set up Intersection Observer for scrolling chapters
  const observerOptions = {
    root: null, // observe viewport
    rootMargin: '0px',
    threshold: 0.2 // Trigger when 20% of chapter is visible
  };

  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const chapterId = entry.target.id;
      if (entry.isIntersecting) {
        // Update sidebar
        navItems.forEach(item => {
          if (item.getAttribute('data-target') === chapterId) {
            item.classList.add('active');
            
            // Update Top Header
            const chapterTitleText = entry.target.querySelector('.chapter-title').textContent;
            chapterTitleIndicator.textContent = `Reading: ${chapterTitleText}`;
          } else {
            item.classList.remove('active');
          }
        });

        // Start/resume simulation if present
        triggerSimInitialization(chapterId);
      } else {
        // Stop simulator if chapter scrolled out of view
        stopSimInitialization(chapterId);
      }
    });
  }, observerOptions);

  chapters.forEach(ch => chapterObserver.observe(ch));

  // --------------------------------------------------------------------------
  // A. Electricity Drift Simulator
  // --------------------------------------------------------------------------
  function initElectricitySim() {
    const canvas = document.getElementById('canvas-electricity');
    if (!canvas) return;
    if (canvas.dataset.initialized) {
      if (canvas.restartAnimation) canvas.restartAnimation();
      return;
    }
    canvas.dataset.initialized = 'true';
    const ctx = canvas.getContext('2d');
    
    const slider = document.getElementById('slide-voltage');
    const valVoltage = document.getElementById('val-voltage');
    const statField = document.getElementById('stat-field');
    const statDrift = document.getElementById('stat-drift');
    
    activeLoops.electricity = true;
    
    // Free electrons parameters
    const electrons = [];
    const numElectrons = 35;
    
    // Initialize random positions inside the wire (x: 50 to 550, y: 35 to 115)
    for (let i = 0; i < numElectrons; i++) {
      electrons.push({
        x: 60 + Math.random() * 480,
        y: 40 + Math.random() * 70,
        vx: (Math.random() - 0.5) * 1.5, // thermal velocity component
        vy: (Math.random() - 0.5) * 1.5
      });
    }

    // Static copper ions (fixed lattice)
    const ions = [];
    const rows = 3;
    const cols = 9;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ions.push({
          x: 80 + c * 55,
          y: 45 + r * 30
        });
      }
    }

    function animate() {
      if (!activeLoops.electricity) return;
      
      const voltage = parseFloat(slider.value);
      valVoltage.textContent = `${voltage > 0 ? '+' : ''}${voltage.toFixed(1)} V`;
      
      // Calculate physics values
      const driftSpeed = voltage * 0.4; // Scaled drift velocity
      
      // Update UI displays
      if (voltage === 0) {
        statField.textContent = 'None';
        statField.style.color = '';
        statDrift.textContent = '0.00 mm/s (Thermal Random Walk)';
        statDrift.style.color = '';
      } else {
        statField.textContent = voltage > 0 ? 'Left-to-Right (-->)' : 'Right-to-Left (<--)';
        statField.style.color = '#f59e0b';
        statDrift.textContent = `${Math.abs(driftSpeed * 1.2).toFixed(2)} mm/s (Drifting ${voltage > 0 ? 'Left' : 'Right'})`;
        statDrift.style.color = '#06b6d4';
      }

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw wire bounds
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#0e172a';
      ctx.beginPath();
      ctx.rect(50, 25, 500, 100);
      ctx.fill();
      ctx.stroke();

      // Draw terminals / battery connections
      // Negative terminal is blue/grey, Positive is red/amber
      let leftColor = '#475569';
      let rightColor = '#475569';
      if (voltage > 0) {
        leftColor = '#ef4444'; // Positive (+)
        rightColor = '#3b82f6'; // Negative (-)
      } else if (voltage < 0) {
        leftColor = '#3b82f6'; // Negative (-)
        rightColor = '#ef4444'; // Positive (+)
      }

      // Left cap
      ctx.fillStyle = leftColor;
      ctx.fillRect(35, 45, 15, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(voltage > 0 ? '+' : (voltage < 0 ? '-' : ' '), 42, 79);
      
      // Right cap
      ctx.fillStyle = rightColor;
      ctx.fillRect(550, 45, 15, 60);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(voltage > 0 ? '-' : (voltage < 0 ? '+' : ' '), 558, 79);

      // Draw fixed Copper Ions (+)
      ions.forEach(ion => {
        ctx.beginPath();
        ctx.arc(ion.x, ion.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', ion.x, ion.y);
      });

      // Update and Draw mobile Valence Electrons (-)
      electrons.forEach(el => {
        // Physics update: Thermal speed + voltage drift
        // Electrons flow opposite to the electric field (drift to left when voltage is positive)
        el.x -= driftSpeed;
        
        // Random walk component (thermal movement)
        el.x += (Math.random() - 0.5) * 1.0;
        el.y += (Math.random() - 0.5) * 1.0;
        
        // Bounds checking (wrap around x, bounce in y)
        if (el.x < 52) {
          el.x = 548; // Wrap electron
        }
        if (el.x > 548) {
          el.x = 52;
        }
        if (el.y < 28) { el.y = 28; el.vy = -el.vy; }
        if (el.y > 122) { el.y = 122; el.vy = -el.vy; }
        
        // Draw Electron glow
        ctx.beginPath();
        ctx.arc(el.x, el.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });
      
      requestAnimationFrame(animate);
    }
    
    canvas.restartAnimation = function() {
      if (activeLoops.electricity) requestAnimationFrame(animate);
    };
    animate();
  }

  // --------------------------------------------------------------------------
  // B. Silicon Lattice Doping Grid Simulator
  // --------------------------------------------------------------------------
  function initDopingSim() {
    const canvas = document.getElementById('canvas-doping');
    if (!canvas) return;
    if (canvas.dataset.initialized) {
      if (canvas.restartAnimation) canvas.restartAnimation();
      return;
    }
    canvas.dataset.initialized = 'true';
    const ctx = canvas.getContext('2d');
    
    const btnIntrinsic = document.getElementById('btn-dope-intrinsic');
    const btnNType = document.getElementById('btn-dope-ntype');
    const btnPType = document.getElementById('btn-dope-ptype');
    const dopingDesc = document.getElementById('doping-desc');
    
    activeLoops.doping = true;
    let mode = 'intrinsic'; // intrinsic, ntype, ptype
    
    // Physics variables for free carriers floating around
    const freeCarriers = [];
    
    btnIntrinsic.addEventListener('click', () => {
      mode = 'intrinsic';
      updateButtons(btnIntrinsic);
      dopingDesc.innerHTML = '<strong>Intrinsic Silicon:</strong> Every silicon atom is covalently bonded to 4 neighbors. All valence electrons are locked in bonds, making the crystal a very poor electrical conductor.';
      freeCarriers.length = 0;
    });
    
    btnNType.addEventListener('click', () => {
      mode = 'ntype';
      updateButtons(btnNType);
      dopingDesc.innerHTML = '<strong>N-Type Silicon (+ Phosphorus):</strong> Doped with a group V element (Phosphorus). 4 of its valence electrons bond, leaving 1 extra electron completely unbound. This free electron floats loosely, creating a negative charge carrier that boosts conductivity.';
      
      // Create a mobile electron
      freeCarriers.length = 0;
      freeCarriers.push({
        x: 300,
        y: 120,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        type: 'electron',
        color: '#06b6d4'
      });
    });
    
    btnPType.addEventListener('click', () => {
      mode = 'ptype';
      updateButtons(btnPType);
      dopingDesc.innerHTML = '<strong>P-Type Silicon (+ Boron):</strong> Doped with a group III element (Boron). It only has 3 valence electrons, leaving 1 bond incomplete. This creates a positive electron vacancy, or <strong>hole</strong>. Nearby electrons can slide into this hole, moving the hole around like a positive charge carrier.';
      
      // Create a mobile hole
      freeCarriers.length = 0;
      freeCarriers.push({
        x: 340,
        y: 120,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        type: 'hole',
        color: '#f59e0b'
      });
    });
    
    function updateButtons(activeBtn) {
      [btnIntrinsic, btnNType, btnPType].forEach(btn => btn.classList.remove('active'));
      activeBtn.classList.add('active');
    }
    
    // Lattice positions (5 cols, 3 rows)
    const cols = 5;
    const rows = 3;
    const spacingX = 110;
    const spacingY = 70;
    const startX = 80;
    const startY = 50;
    
    function animate() {
      if (!activeLoops.doping) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 1. Draw covalent bonding lines (double lines to show shared pairs)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * spacingX;
          const y = startY + r * spacingY;
          
          // Horizontal connections
          if (c < cols - 1) {
            ctx.beginPath();
            ctx.moveTo(x + 20, y - 3);
            ctx.lineTo(x + spacingX - 20, y - 3);
            ctx.moveTo(x + 20, y + 3);
            ctx.lineTo(x + spacingX - 20, y + 3);
            ctx.stroke();
            
            // Draw shared bonding electrons
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(x + spacingX / 2 - 8, y, 3, 0, Math.PI * 2);
            ctx.arc(x + spacingX / 2 + 8, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          // Vertical connections
          if (r < rows - 1) {
            ctx.beginPath();
            ctx.moveTo(x - 3, y + 20);
            ctx.lineTo(x - 3, y + spacingY - 20);
            ctx.moveTo(x + 3, y + 20);
            ctx.lineTo(x + 3, y + spacingY - 20);
            ctx.stroke();
            
            // Draw shared bonding electrons
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(x, y + spacingY / 2 - 6, 3, 0, Math.PI * 2);
            ctx.arc(x, y + spacingY / 2 + 6, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      // 2. Draw Atoms
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = startX + c * spacingX;
          const y = startY + r * spacingY;
          
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          
          // Center atom (2, 1) is doped
          if (c === 2 && r === 1) {
            if (mode === 'ntype') {
              ctx.fillStyle = '#b91c1c'; // Phosphorus
              ctx.fill();
              ctx.strokeStyle = '#ef4444';
              ctx.stroke();
              
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 11px Outfit';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('P (Group V)', x, y);
            } else if (mode === 'ptype') {
              ctx.fillStyle = '#1e3a8a'; // Boron
              ctx.fill();
              ctx.strokeStyle = '#3b82f6';
              ctx.stroke();
              
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 11px Outfit';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('B (Group III)', x, y);
            } else {
              // Intrinsic
              ctx.fillStyle = '#1e293b'; // Silicon
              ctx.fill();
              ctx.strokeStyle = '#475569';
              ctx.stroke();
              
              ctx.fillStyle = '#94a3b8';
              ctx.font = 'bold 11px Outfit';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('Si (Group IV)', x, y);
            }
          } else {
            // Ordinary Silicon Atom
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.stroke();
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 11px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Si', x, y);
          }
        }
      }
      
      // 3. Draw Doping Anomalies (Incomplete bond representing hole/extra electron)
      if (mode === 'ptype') {
        // Draw the missing bonding electron in central right bond
        // We overwrite the right bonding electron with a dashed circle (hole)
        const holeX = startX + 2.5 * spacingX + 8;
        const holeY = startY + 1 * spacingY;
        
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(holeX, holeY, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // reset
        
        ctx.fillStyle = '#f59e0b';
        ctx.font = '8px monospace';
        ctx.fillText('+', holeX, holeY);
      }
      
      // 4. Update and animate floating carriers (if any)
      freeCarriers.forEach(carrier => {
        // Random walk motion inside the lattice area
        carrier.x += carrier.vx;
        carrier.y += carrier.vy;
        
        // Bounce off canvas edges
        if (carrier.x < 20 || carrier.x > canvas.width - 20) carrier.vx = -carrier.vx;
        if (carrier.y < 20 || carrier.y > canvas.height - 20) carrier.vy = -carrier.vy;
        
        ctx.beginPath();
        ctx.arc(carrier.x, carrier.y, carrier.type === 'electron' ? 5 : 7, 0, Math.PI * 2);
        
        if (carrier.type === 'electron') {
          ctx.fillStyle = carrier.color;
          ctx.shadowColor = carrier.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Hole
          ctx.strokeStyle = carrier.color;
          ctx.setLineDash([1.5, 1.5]);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.fillStyle = carrier.color;
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('+', carrier.x, carrier.y);
        }
      });
      
      requestAnimationFrame(animate);
    }
    
    canvas.restartAnimation = function() {
      if (activeLoops.doping) requestAnimationFrame(animate);
    };
    animate();
  }

  // --------------------------------------------------------------------------
  // C. MOSFET Transistor Channel Simulator
  // --------------------------------------------------------------------------
  function initMOSFETSim() {
    const canvas = document.getElementById('canvas-mosfet');
    if (!canvas) return;
    if (canvas.dataset.initialized) {
      if (canvas.restartAnimation) canvas.restartAnimation();
      return;
    }
    canvas.dataset.initialized = 'true';
    const ctx = canvas.getContext('2d');
    
    const slider = document.getElementById('slide-gate-v');
    const valGateV = document.getElementById('val-gate-v');
    const statState = document.getElementById('stat-transistor-state');
    const statResistance = document.getElementById('stat-resistance');
    
    activeLoops.mosfet = true;
    
    // Electrons flowing from source to drain (when channel is active)
    const currentElectrons = [];
    for (let i = 0; i < 20; i++) {
      currentElectrons.push({
        x: 100 + Math.random() * 400,
        y: 110 + Math.random() * 30,
        speed: 1 + Math.random() * 2
      });
    }

    // Static substrate holes (orange circles with '+' signs)
    const holes = [];
    const numHoles = 15;
    for (let i = 0; i < numHoles; i++) {
      holes.push({
        x: 200 + Math.random() * 200,
        y: 150 + Math.random() * 70,
        baseY: 150 + Math.random() * 70 // Remember base position to repel them relative to it
      });
    }

    function animate() {
      if (!activeLoops.mosfet) return;
      
      const vGate = parseFloat(slider.value);
      valGateV.textContent = `${vGate.toFixed(1)} V`;
      
      const thresholdV = 1.8;
      const isON = vGate > thresholdV;
      
      // Update UI Statuses
      if (isON) {
        statState.textContent = 'ON (Saturation / Conducting)';
        statState.className = 'stat-value state-on';
        
        // Calculate dynamic resistance based on gate voltage
        const resistance = Math.round(5000 / (vGate - thresholdV));
        statResistance.textContent = `${resistance} Ω`;
      } else {
        statState.textContent = 'OFF (Cut-off)';
        statState.className = 'stat-value state-off';
        statResistance.textContent = 'Infinite (Mega-Ohms)';
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Drawing Coordinates of Transistor Layers
      // P-Substrate: full bottom region
      ctx.fillStyle = '#1c1b22'; // Dark deep purple-brown
      ctx.fillRect(80, 100, 440, 140);
      
      // Source & Drain: heavily N-doped wells (Source left, Drain right)
      ctx.fillStyle = '#1e2e38'; // Dark steel blue
      ctx.fillRect(80, 100, 100, 60);  // Source (N+)
      ctx.fillRect(420, 100, 100, 60); // Drain (N+)
      
      // Thin Oxide Layer (Insulator): sits between Source and Drain wells
      ctx.fillStyle = '#94a3b8'; // Grey insulating oxide
      ctx.fillRect(180, 90, 240, 10);
      
      // Gate Electrode: placed on top of oxide
      ctx.fillStyle = '#475569'; // Metal Gate
      ctx.fillRect(180, 70, 240, 20);

      // Gate Terminals
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(300, 70);
      ctx.lineTo(300, 30);
      ctx.stroke();
      
      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('GATE (G)', 300, 25);
      ctx.fillText('SOURCE (S) - 0V', 130, 90);
      ctx.fillText('DRAIN (D) - +5V', 470, 90);
      ctx.fillStyle = '#64748b';
      ctx.fillText('P-Substrate / Body', 300, 230);
      
      // Draw static wells markers
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('N+', 130, 135);
      ctx.fillText('N+', 470, 135);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('P', 300, 180);

      // Physics animation: repel holes under the gate based on Gate Voltage
      // Repulsion force is proportional to Vgate
      const maxRepelDistance = 60;
      const repelScale = Math.min(vGate / 5.0, 1.0);
      const repelRegionXStart = 180;
      const repelRegionXEnd = 420;
      
      holes.forEach(hole => {
        if (hole.x > repelRegionXStart && hole.x < repelRegionXEnd) {
          // Push y down based on voltage
          hole.y = hole.baseY + (repelScale * maxRepelDistance);
        }
        
        // Draw Hole (Orange circle with '+')
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = '8px monospace';
        ctx.fillText('+', hole.x, hole.y + 1);
      });

      // Charge build-up on the Gate (show small red pluses as voltage goes up)
      if (vGate > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px sans-serif';
        const numPluses = Math.floor(vGate * 3);
        for (let i = 0; i < numPluses; i++) {
          const px = 190 + (i * (220 / (numPluses - 1 || 1)));
          ctx.fillText('+', px, 80);
        }
      }

      // Draw the Channel creation (Inversion Layer)
      if (isON) {
        // Draw glowing channel connection from Source to Drain
        const channelIntensity = Math.min((vGate - thresholdV) / (5 - thresholdV), 1.0);
        ctx.fillStyle = `rgba(6, 182, 212, ${0.1 + channelIntensity * 0.25})`;
        ctx.fillRect(180, 100, 240, 20);
        
        ctx.strokeStyle = `rgba(6, 182, 212, ${channelIntensity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(180, 100);
        ctx.lineTo(420, 100);
        ctx.stroke();
        
        // Accumulate channel electrons under the gate oxide
        ctx.fillStyle = '#06b6d4';
        const numChannelElec = Math.floor((vGate - thresholdV) * 6);
        for (let i = 0; i < numChannelElec; i++) {
          const ex = 190 + Math.random() * 220;
          const ey = 101 + Math.random() * 5;
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Flow Current Electrons if transistor is ON
      currentElectrons.forEach(el => {
        if (isON) {
          // Accelerate drift rate depending on gate voltage level
          const currentDrift = (vGate - thresholdV) * 1.5;
          el.x += el.speed + currentDrift;
          
          // Confine to channel height
          el.y = 104 + Math.random() * 12;
          
          // Loop electron wrap
          if (el.x > 500) {
            el.x = 100;
          }
          
          // Draw moving electrons
          ctx.beginPath();
          ctx.arc(el.x, el.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Draw random static layout in N+ source and drain regions
          if (el.x > 180 && el.x < 420) {
            // Put it back into Source
            el.x = 90 + Math.random() * 80;
            el.y = 105 + Math.random() * 50;
          }
          
          ctx.beginPath();
          ctx.arc(el.x, el.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#06b6d4';
          ctx.fill();
        }
      });
      
      requestAnimationFrame(animate);
    }
    
    canvas.restartAnimation = function() {
      if (activeLoops.mosfet) requestAnimationFrame(animate);
    };
    animate();
  }

  // --------------------------------------------------------------------------
  // D. CMOS Inverter Circuit Simulator
  // --------------------------------------------------------------------------
  function initCMOSSim() {
    const canvas = document.getElementById('canvas-cmos');
    if (!canvas) return;
    if (canvas.dataset.initialized) {
      if (canvas.restartAnimation) canvas.restartAnimation();
      return;
    }
    canvas.dataset.initialized = 'true';
    const ctx = canvas.getContext('2d');
    
    const btnLow = document.getElementById('btn-cmos-in-low');
    const btnHigh = document.getElementById('btn-cmos-in-high');
    const cmosDesc = document.getElementById('cmos-desc');
    
    activeLoops.cmos = true;
    let inputState = 'low'; // low, high

    btnLow.addEventListener('click', () => {
      inputState = 'low';
      updateCMOSButtons(btnLow);
      cmosDesc.innerHTML = '<strong>Input is LOW (0V):</strong> Gate voltage is low. The PMOS transistor (top) is ON, creating a conductive path to VDD. The NMOS transistor (bottom) is OFF. The output is pulled up to VDD (HIGH, Logic 1). Static current is zero.';
    });

    btnHigh.addEventListener('click', () => {
      inputState = 'high';
      updateCMOSButtons(btnHigh);
      cmosDesc.innerHTML = '<strong>Input is HIGH (5V):</strong> Gate voltage is high. The PMOS transistor (top) is OFF. The NMOS transistor (bottom) is ON, creating a conductive path to Ground. The output is pulled down to Ground (LOW, Logic 0). Static current is zero.';
    });

    function updateCMOSButtons(activeBtn) {
      [btnLow, btnHigh].forEach(btn => btn.classList.remove('active'));
      activeBtn.classList.add('active');
    }

    // Animation details: electron packets moving along current paths
    const flowPackets = [];
    for (let i = 0; i < 8; i++) {
      flowPackets.push({
        t: Math.random() // Parametric position along active path [0, 1]
      });
    }

    function animate() {
      if (!activeLoops.cmos) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const inLow = inputState === 'low';
      
      // Wire colors
      const colorActive = '#e11d48'; // Red/amber for active power paths
      const colorGround = '#475569'; // Dull blue-grey for ground/low paths
      const colorControl = inLow ? '#475569' : '#06b6d4'; // gate wire color
      
      ctx.lineWidth = 3;
      
      // 1. Draw Power Rails
      // VDD Rail (Top)
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(100, 40);
      ctx.lineTo(500, 40);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Outfit';
      ctx.fillText('VDD (+5V / Logic 1)', 105, 30);
      
      // GND Rail (Bottom)
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(100, 300);
      ctx.lineTo(500, 300);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.fillText('GND (0V / Logic 0)', 105, 315);

      // 2. Draw Transistor Boxes
      // PMOS (Top box)
      ctx.strokeStyle = inLow ? '#22c55e' : '#475569'; // Green if ON, Grey if OFF
      ctx.strokeRect(260, 60, 80, 70);
      ctx.fillStyle = inLow ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.01)';
      ctx.fillRect(260, 60, 80, 70);
      ctx.fillStyle = inLow ? '#22c55e' : '#475569';
      ctx.font = 'bold 11px Outfit';
      ctx.fillText(`PMOS: ${inLow ? 'ON' : 'OFF'}`, 270, 100);
      
      // PMOS inversion bubble circle
      ctx.beginPath();
      ctx.arc(254, 95, 4, 0, Math.PI * 2);
      ctx.stroke();

      // NMOS (Bottom box)
      ctx.strokeStyle = !inLow ? '#22c55e' : '#475569'; // Green if ON, Grey if OFF
      ctx.strokeRect(260, 170, 80, 70);
      ctx.fillStyle = !inLow ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.01)';
      ctx.fillRect(260, 170, 80, 70);
      ctx.fillStyle = !inLow ? '#22c55e' : '#475569';
      ctx.fillText(`NMOS: ${!inLow ? 'ON' : 'OFF'}`, 270, 210);

      // 3. Draw Gate Input Wires
      ctx.strokeStyle = colorControl;
      ctx.beginPath();
      ctx.moveTo(120, 95); // Branch to PMOS
      ctx.lineTo(250, 95);
      ctx.moveTo(120, 205); // Branch to NMOS
      ctx.lineTo(260, 205);
      ctx.moveTo(120, 95); // Vertical connect Input
      ctx.lineTo(120, 205);
      ctx.moveTo(80, 150); // main input
      ctx.lineTo(120, 150);
      ctx.stroke();

      // Label Vin
      ctx.fillStyle = colorControl;
      ctx.font = 'bold 12px Outfit';
      ctx.fillText(`Vin = ${inLow ? '0' : '1'}`, 60, 145);

      // 4. Draw Source/Drain Connections to Rails and Output
      // PMOS Source to VDD
      ctx.strokeStyle = inLow ? colorActive : colorActive; // stays linked to power
      ctx.beginPath();
      ctx.moveTo(300, 40);
      ctx.lineTo(300, 60);
      ctx.stroke();
      
      // NMOS Source to GND
      ctx.strokeStyle = colorGround;
      ctx.beginPath();
      ctx.moveTo(300, 240);
      ctx.lineTo(300, 300);
      ctx.stroke();

      // Drains Connection to Output
      const pathColor = inLow ? colorActive : colorGround;
      ctx.strokeStyle = pathColor;
      ctx.beginPath();
      ctx.moveTo(300, 130); // PMOS Drain to output junction
      ctx.lineTo(300, 170); // NMOS Drain to output junction
      ctx.moveTo(300, 150); // Output horizontal line
      ctx.lineTo(440, 150);
      ctx.stroke();

      // Output Indicator bulb (LED)
      ctx.beginPath();
      ctx.arc(460, 150, 20, 0, Math.PI * 2);
      ctx.fillStyle = inLow ? '#f59e0b' : '#334155'; // Glows yellow if HIGH output
      ctx.shadowColor = inLow ? '#f59e0b' : 'transparent';
      ctx.shadowBlur = inLow ? 15 : 0;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
      
      ctx.strokeStyle = inLow ? '#f59e0b' : '#475569';
      ctx.stroke();

      ctx.fillStyle = inLow ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 11px Outfit';
      ctx.fillText(inLow ? '1' : '0', 457, 154);
      ctx.fillText(`Vout = ${inLow ? 'HIGH (1)' : 'LOW (0)'}`, 415, 190);

      // 5. Animate Current Flow Packets
      // Packets drift along conductive paths
      flowPackets.forEach(p => {
        p.t += 0.01;
        if (p.t > 1.0) p.t = 0;
        
        let px = 0;
        let py = 0;
        
        if (inLow) {
          // Flow: VDD (300, 40) -> PMOS Source (300, 60) -> PMOS Box -> PMOS Drain (300, 130) -> Junction (300, 150) -> Out (460, 150)
          const segments = [
            { x1: 300, y1: 40, x2: 300, y2: 60, len: 20 },
            { x1: 300, y1: 60, x2: 300, y2: 130, len: 70 }, // goes through PMOS
            { x1: 300, y1: 130, x2: 300, y2: 150, len: 20 },
            { x1: 300, y1: 150, x2: 440, y2: 150, len: 140 }
          ];
          
          // Locate segment
          const totalLength = 250;
          let currentLen = p.t * totalLength;
          
          for (let seg of segments) {
            if (currentLen <= seg.len) {
              const ratio = currentLen / seg.len;
              px = seg.x1 + (seg.x2 - seg.x1) * ratio;
              py = seg.y1 + (seg.y2 - seg.y1) * ratio;
              break;
            }
            currentLen -= seg.len;
          }
        } else {
          // Flow: Out (460, 150) -> Junction (300, 150) -> NMOS Drain (300, 170) -> NMOS Box -> NMOS Source (300, 240) -> GND (300, 300)
          const segments = [
            { x1: 440, y1: 150, x2: 300, y2: 150, len: 140 },
            { x1: 300, y1: 150, x2: 300, y2: 170, len: 20 },
            { x1: 300, y1: 170, x2: 300, y2: 240, len: 70 }, // goes through NMOS
            { x1: 300, y1: 240, x2: 300, y2: 300, len: 60 }
          ];
          
          const totalLength = 290;
          let currentLen = p.t * totalLength;
          
          for (let seg of segments) {
            if (currentLen <= seg.len) {
              const ratio = currentLen / seg.len;
              px = seg.x1 + (seg.x2 - seg.x1) * ratio;
              py = seg.y1 + (seg.y2 - seg.y1) * ratio;
              break;
            }
            currentLen -= seg.len;
          }
        }
        
        // Draw Drift Packet (Yellow glow dot)
        if (px !== 0 && py !== 0) {
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = inLow ? '#f59e0b' : '#38bdf8';
          ctx.fill();
        }
      });
      
      requestAnimationFrame(animate);
    }
    
    canvas.restartAnimation = function() {
      if (activeLoops.cmos) requestAnimationFrame(animate);
    };
    animate();
  }

  // ==========================================================================
  // 3. AI Chatbot Integration
  // ==========================================================================

  const chatbotWidget = document.getElementById('chatbot-widget');
  const chatbotHeader = document.getElementById('chatbot-header');
  const chatbotMessages = document.getElementById('chatbot-messages');
  const explainTooltip = document.getElementById('explain-tooltip');
  
  let selectedTextForAI = '';
  let selectedContextForAI = '';

  // Toggle chatbot
  chatbotHeader.addEventListener('click', () => {
    chatbotWidget.classList.toggle('collapsed');
  });

  // Handle text selection for tooltip
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text.length > 0 && text.length < 200) {
        selectedTextForAI = text;
        
        // Try to get surrounding paragraph for context
        let contextNode = selection.anchorNode;
        while (contextNode && contextNode.nodeType !== Node.ELEMENT_NODE) {
          contextNode = contextNode.parentNode;
        }
        if (contextNode) {
          selectedContextForAI = contextNode.textContent.trim().substring(0, 500); // 500 chars max context
        } else {
          selectedContextForAI = text;
        }

        // Position tooltip
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        explainTooltip.style.left = `${rect.left + rect.width / 2}px`;
        explainTooltip.style.top = `${rect.top + window.scrollY}px`;
        explainTooltip.style.display = 'flex';
        return;
      }
    }
    
    // Hide tooltip if no selection or selection is too large
    explainTooltip.style.display = 'none';
  });

  // Handle tooltip click
  explainTooltip.addEventListener('click', () => {
    // Hide tooltip and clear selection visually
    explainTooltip.style.display = 'none';
    window.getSelection().removeAllRanges();

    // Open chatbot
    chatbotWidget.classList.remove('collapsed');
    
    // Append user message
    appendMessage(`Explain: "${selectedTextForAI}"`, 'user');
    
    // Append loading bubble
    const loadingId = 'loading-' + Date.now();
    appendMessage(`<div class="chat-loading"><span></span><span></span><span></span></div>`, 'ai', loadingId);

    // Fetch explanation from API
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: selectedTextForAI,
        context: selectedContextForAI
      })
    })
    .then(response => response.json())
    .then(data => {
      removeMessage(loadingId);
      if (data.explanation) {
        // Simple formatting to add paragraphs
        const formatted = data.explanation.replace(/\\n/g, '<br/>');
        appendMessage(formatted, 'ai');
      } else {
        appendMessage('Sorry, I encountered an error explaining that.', 'ai');
      }
    })
    .catch(err => {
      console.error(err);
      removeMessage(loadingId);
      appendMessage('Connection error. Is the server running?', 'ai');
    });
  });

  function appendMessage(htmlContent, type, id = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${type}`;
    if (id) msgDiv.id = id;
    msgDiv.innerHTML = htmlContent;
    chatbotMessages.appendChild(msgDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function removeMessage(id) {
    const msg = document.getElementById(id);
    if (msg) msg.remove();
  }

});
