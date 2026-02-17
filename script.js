document.addEventListener("DOMContentLoaded", () => {
  // --- Entrances & UI Logic ---
  const links = document.querySelectorAll(".link-item");
  links.forEach((link, index) => {
    link.style.opacity = "0";
    link.style.transform = "translateY(10px)";
    setTimeout(
      () => {
        link.style.transition = "all 0.4s ease";
        link.style.opacity = "1";
        link.style.transform = "translateY(0)";
      },
      100 + index * 100,
    );
  });

  const cpuEl = document.querySelector(".footer-line span:nth-child(1)");
  const memEl = document.querySelector(".footer-line span:nth-child(2)");
  setInterval(() => {
    const cpuVal = Math.floor(Math.random() * 30) + 5;
    const memVal = Math.floor(Math.random() * 200) + 300;
    cpuEl.textContent = `CPU: ${cpuVal}%`;
    memEl.textContent = `MEM: ${memVal}MB`;
  }, 3000);

  // Theme Switcher
  const themeBtns = document.querySelectorAll(".theme-btn");
  const body = document.body;

  // Check local storage
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.setAttribute("data-theme", savedTheme);
    updateActiveButton(savedTheme);
  }

  // Update canvas colors when theme changes
  function triggerCanvasUpdate() {
    if (window.resizeCanvasAndColors) window.resizeCanvasAndColors();
  }

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme");
      if (theme === "default") {
        body.removeAttribute("data-theme");
      } else {
        body.setAttribute("data-theme", theme);
      }
      localStorage.setItem("theme", theme);
      updateActiveButton(theme);

      // Wait a tick for CSS variables to update
      setTimeout(triggerCanvasUpdate, 50);
    });
  });

  function updateActiveButton(theme) {
    themeBtns.forEach((btn) => {
      if (btn.getAttribute("data-theme") === theme) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // --- Clock & Greeting Logic ---
  function updateTime() {
    const now = new Date();
    const clockEl = document.getElementById("clock-display");
    const timeString = now.toLocaleTimeString("en-US", { hour12: false });
    const dateString = now.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    clockEl.textContent = `${dateString} • ${timeString}`;
  }
  setInterval(updateTime, 1000);
  updateTime();

  // Typing Effect for Greeting
  const greetingEl = document.getElementById("greeting-text");
  const now = new Date();
  const hrs = now.getHours();
  let targetGreeting = "SYSTEM.READY";

  if (hrs >= 5 && hrs < 12) targetGreeting = "GOOD MORNING";
  else if (hrs >= 12 && hrs < 18) targetGreeting = "GOOD AFTERNOON";
  else targetGreeting = "GOOD EVENING";

  const phases = [
    { text: "HELLO WORLD", delay: 0 },
    { text: "> " + targetGreeting, delay: 2500, type: true },
  ];

  async function runGreetingSequence() {
    // Phase 1: Hello World
    greetingEl.textContent = phases[0].text;

    // Wait
    await new Promise((r) => setTimeout(r, phases[1].delay));

    // Phase 2: Typing Effect
    const text = phases[1].text;
    greetingEl.textContent = "";

    for (let i = 0; i < text.length; i++) {
      greetingEl.textContent += text.charAt(i);
      await new Promise((r) => setTimeout(r, 100)); // Typing speed
    }

    // Blinking cursor effect at the end
    setInterval(() => {
      if (greetingEl.textContent.endsWith("_")) {
        greetingEl.textContent = text;
      } else {
        greetingEl.textContent = text + "_";
      }
    }, 800);
  }

  runGreetingSequence();

  // --- Interactive Canvas Grid "Liquid" Effect ---
  const canvas = document.getElementById("grid-canvas");
  const ctx = canvas.getContext("2d");

  let width, height;
  let gridPoints = [];
  // Configuration
  const spacing = 40; // Grid spacing
  const mouseRadius = 200; // Increased radius for glow
  const mouseStrength = 0.4; // How much it pushes
  const viscosity = 0.06; // Resistance (lower = wobblier)
  const damping = 0.12; // bounce factor (0.1 ~ 0.9)

  // Current Mouse Pos
  const mouse = { x: -1000, y: -1000 };

  class Point {
    constructor(x, y) {
      this.ox = x; // original x
      this.oy = y; // original y
      this.x = x; // current x
      this.y = y; // current y
      this.vx = 0; // velocity x
      this.vy = 0; // velocity y
    }

    update() {
      // Mouse Interaction: simple push away based on distance
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouseRadius) {
        const angle = Math.atan2(dy, dx);
        const force = (mouseRadius - dist) / mouseRadius; // 0 to 1 based on nearness
        const moveForce = force * mouseStrength * 1.5;

        // Push points away
        this.vx -= Math.cos(angle) * moveForce;
        this.vy -= Math.sin(angle) * moveForce;
      }

      // Spring back to original position (Hooke's Lawish)
      const dhomex = this.ox - this.x;
      const dhomey = this.oy - this.y;

      this.vx += dhomex * viscosity;
      this.vy += dhomey * viscosity;

      // Damping (friction)
      this.vx *= 1 - damping;
      this.vy *= 1 - damping;

      // Update pos
      this.x += this.vx;
      this.y += this.vy;
    }
  }

  function initGrid() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    gridPoints = [];

    const columns = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;

    for (let i = -1; i < columns; i++) {
      for (let j = -1; j < rows; j++) {
        gridPoints.push(new Point(i * spacing, j * spacing));
      }
    }
  }

  // Get colors from CSS variables
  let gridColorCheck = "rgba(255,255,255,0.05)";
  let accentColorCheck = "#00ff41";
  let spotlightColorCheck = "rgba(0, 255, 65, 0.15)";

  function updateColors() {
    const style = getComputedStyle(document.body);
    gridColorCheck =
      style.getPropertyValue("--grid-color").trim() || "rgba(255,255,255,0.05)";
    accentColorCheck = style.getPropertyValue("--accent").trim() || "#00ff41";
    spotlightColorCheck =
      style.getPropertyValue("--spotlight-color").trim() ||
      "rgba(0, 255, 65, 0.15)";
  }

  // Expose for theme switcher
  window.resizeCanvasAndColors = () => {
    initGrid();
    updateColors();
  };

  function animate() {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = gridColorCheck;
    ctx.lineWidth = 1;

    // Draw Radial Glow
    if (mouse.x > 0) {
      const glowGradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouseRadius * 1.5,
      );
      glowGradient.addColorStop(0, spotlightColorCheck);
      glowGradient.addColorStop(1, "transparent");

      ctx.save();
      ctx.globalCompositeOperation = "lighter"; // Additive blending for glow
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.beginPath();

    // Update points
    for (let p of gridPoints) {
      p.update();
    }

    // Draw Lines - connecting neighbors is tricky with a 1D array loop
    // So we just iterate by Grid Coordinates logic
    const columns = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;

    // We can access point at (i, j) = index i * rows + j ??? No, inner loop was Rows.
    // Construction was: for col { for row { push } }
    // So gridPoints[i * rows + j] is the point at Col i, Row j.

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        const idx = i * rows + j;
        const p = gridPoints[idx];

        if (!p) continue;

        // Connect to right neighbor (i+1, j)
        if (i < columns - 1) {
          const rightIdx = (i + 1) * rows + j;
          const rightP = gridPoints[rightIdx];
          if (rightP) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(rightP.x, rightP.y);
          }
        }

        // Connect to bottom neighbor (i, j+1)
        if (j < rows - 1) {
          const bottomIdx = i * rows + (j + 1);
          const bottomP = gridPoints[bottomIdx];
          if (bottomP) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(bottomP.x, bottomP.y);
          }
        }
      }
    }
    ctx.stroke();

    // Optional: Draw highlighting dots near mouse?
    // Or accent the lines near mouse?
    // Let's just draw the "cursor spotlight" by masking for now or leave it as pure grid deformation?
    // User asked for "background kotak nya juga bergerak" (background boxes also move).
    // The grid deformation achieves this.

    requestAnimationFrame(animate);
  }

  // Events
  window.addEventListener("resize", () => {
    initGrid();
    updateColors();
  });

  window.addEventListener("mousemove", (e) => {
    if (window.innerWidth > 768) {
      // Only enable on PC/Tablet
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
  });

  // Start
  initGrid();
  updateColors();
  animate();
});
