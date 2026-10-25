const roles = [
  "IT Student",
  "Web Developer",
  "Videographer",
  "Photographer",
  "Video Editor",
  "Music Producer"
];

const typingText = document.getElementById("typingText");
let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeRole() {
  const currentRole = roles[roleIndex];
  typingText.textContent = currentRole.slice(0, charIndex);

  if (!deleting && charIndex < currentRole.length) {
    charIndex++;
    setTimeout(typeRole, 95);
  } else if (!deleting && charIndex === currentRole.length) {
    deleting = true;
    setTimeout(typeRole, 1300);
  } else if (deleting && charIndex > 0) {
    charIndex--;
    setTimeout(typeRole, 45);
  } else {
    deleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    setTimeout(typeRole, 300);
  }
}
typeRole();

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const sections = navLinks
  .map(link => document.getElementById(link.getAttribute("href").slice(1)))
  .filter(section => section);
let scrollAnimationFrame = 0;
let activeSectionFrame = 0;
let previousScrollBehavior = "";

function setActiveNav(sectionId) {
  navLinks.forEach(link => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateActiveNav() {
  if (activeSectionFrame) {
    return;
  }

  activeSectionFrame = requestAnimationFrame(() => {
    const header = document.querySelector(".site-header");
    const activationLine = window.scrollY + header.offsetHeight
      + (window.innerHeight - header.offsetHeight) / 2;
    let activeSection = sections[0];

    sections.forEach(section => {
      if (section.getBoundingClientRect().top + window.scrollY <= activationLine) {
        activeSection = section;
      }
    });

    setActiveNav(activeSection.id);
    activeSectionFrame = 0;
  });
}

function cancelScrollAnimation() {
  if (!scrollAnimationFrame) {
    return;
  }

  cancelAnimationFrame(scrollAnimationFrame);
  scrollAnimationFrame = 0;
  document.documentElement.style.scrollBehavior = previousScrollBehavior;
}

function scrollToSection(target) {
  cancelScrollAnimation();

  const root = document.documentElement;
  const start = window.scrollY;
  const scrollPadding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  const targetTop = target.getBoundingClientRect().top + start - scrollPadding;
  const maxScroll = root.scrollHeight - window.innerHeight;
  const end = Math.max(0, Math.min(targetTop, maxScroll));
  const distance = end - start;

  if (distance === 0) {
    return;
  }

  previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  const duration = Math.min(1000, Math.max(450, Math.abs(distance) * 0.35));
  const startTime = performance.now();

  function animateScroll(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const easedProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo(0, start + distance * easedProgress);

    if (progress < 1) {
      scrollAnimationFrame = requestAnimationFrame(animateScroll);
      return;
    }

    scrollAnimationFrame = 0;
    root.style.scrollBehavior = previousScrollBehavior;
  }

  scrollAnimationFrame = requestAnimationFrame(animateScroll);
}

window.addEventListener("wheel", cancelScrollAnimation, { passive: true });
window.addEventListener("touchstart", cancelScrollAnimation, { passive: true });
window.addEventListener("pointerdown", cancelScrollAnimation, { passive: true });
window.addEventListener("keydown", event => {
  if (["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "].includes(event.key)) {
    cancelScrollAnimation();
  }
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});

window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("resize", updateActiveNav);
updateActiveNav();

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", event => {
    const href = link.getAttribute("href");
    const target = document.getElementById(href.slice(1));

    if (!target) {
      return;
    }

    event.preventDefault();
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
    setActiveNav(href.slice(1));

    if (window.location.hash !== href) {
      history.pushState(null, "", href);
    }

    scrollToSection(target);
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

const audioPlayer = document.getElementById("audioPlayer");
const musicControl = document.getElementById("musicControl");
const musicControlIcon = document.getElementById("musicControlIcon");
const musicStatus = document.getElementById("musicStatus");
const canvas = document.getElementById("visualizerCanvas");
const canvasContext = canvas.getContext("2d");
let audioContext;
let analyser;
let frequencyData;
let smoothedLevels = [];
let previousBassLevel = 0;
let kickPulse = 0;
let previousHighLevel = 0;
let snarePulse = 0;
let animationFrame;

function resizeVisualizer() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawVisualizer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvasContext.clearRect(0, 0, width, height);
  const centerX = width / 2;
  const centerY = height * 0.42;
  const waveHeight = 35;
  const edgeClearance = waveHeight + 10;
  const canvasBounds = canvas.getBoundingClientRect();
  const heroBounds = document.querySelector(".hero").getBoundingClientRect();
  const screenCenterX = canvasBounds.left + centerX;
  const screenCenterY = canvasBounds.top + centerY;
  const baseRadius = Math.min(
    width * 0.46,
    height * 0.37,
    290,
    width / 2 - edgeClearance,
    centerY - edgeClearance,
    height - centerY - edgeClearance,
    screenCenterX - heroBounds.left - edgeClearance,
    heroBounds.right - screenCenterX - edgeClearance,
    screenCenterY - heroBounds.top - edgeClearance,
    heroBounds.bottom - screenCenterY - edgeClearance
  );
  const safeBaseRadius = Math.max(0, baseRadius);
  const isPlaying = !audioPlayer.paused && !audioPlayer.ended && analyser;

  if (isPlaying) {
    analyser.getByteFrequencyData(frequencyData);
  }

  const pointCount = 200;
  const halfPointCount = pointCount / 2;
  const contourColors = ["#d026ff", "#a325ff", "#763bff", "#5b43ff", "#4248ff", "#3268ff", "#1684ff"];
  const animationTime = Date.now() / 700;
  const binFrequency = analyser ? audioContext.sampleRate / analyser.fftSize : 1;
  const frequencyBin = frequency => analyser
    ? Math.max(1, Math.min(frequencyData.length - 1, Math.round(frequency / binFrequency)))
    : 1;
  const bassStartBin = frequencyBin(28);
  const bassEndBin = frequencyBin(180);
  const kickStartBin = frequencyBin(35);
  const kickEndBin = frequencyBin(120);
  const highStartBin = frequencyBin(800);
  const highEndBin = frequencyBin(10000);
  const bandEnergy = (startBin, endBin) => {
    let total = 0;
    for (let index = startBin; index <= endBin; index++) {
      total += frequencyData[index] / 255;
    }
    return total / Math.max(1, endBin - startBin + 1);
  };

  if (smoothedLevels.length !== pointCount) {
    smoothedLevels = new Array(pointCount).fill(0);
  }

  if (isPlaying) {
    const kickEnergy = bandEnergy(kickStartBin, kickEndBin);
    const highEnergy = bandEnergy(highStartBin, highEndBin);
    if (kickEnergy > 0.11 && kickEnergy - previousBassLevel > 0.012) {
      kickPulse = Math.min(1, kickPulse + 0.85);
    }
    previousBassLevel += (kickEnergy - previousBassLevel) * 0.07;
    if (highEnergy > 0.09 && highEnergy - previousHighLevel > 0.025) {
      snarePulse = Math.min(1, snarePulse + 0.7);
    }
    previousHighLevel += (highEnergy - previousHighLevel) * 0.16;
    kickPulse *= 0.92;
    snarePulse *= 0.86;
  } else {
    previousBassLevel *= 0.9;
    previousHighLevel *= 0.9;
    kickPulse *= 0.92;
    snarePulse *= 0.86;
  }

  const levels = new Array(pointCount);
  for (let index = 0; index < pointCount; index++) {
    const angle = -Math.PI / 2 + index / pointCount * Math.PI * 2;
    const isUpper = Math.sin(angle) < 0;
    const halfPosition = Math.acos(Math.cos(angle)) / Math.PI;
    const startBin = isUpper ? bassStartBin : highStartBin;
    const endBin = isUpper ? bassEndBin : highEndBin;
    const frequencyIndex = Math.round(startBin + halfPosition * (endBin - startBin));
    const frequencyLevel = isPlaying ? frequencyData[frequencyIndex] / 255 : 0;
    const normalizedFrequency = Math.max(0, Math.min(1, (frequencyLevel - 0.18) / 0.5));
    const pulse = isUpper ? kickPulse : snarePulse;
    const peakPosition = isUpper ? 0.24 : 0.32;
    const peakWidth = isUpper ? 0.2 : 0.18;
    const peak = Math.max(0, 1 - Math.abs(halfPosition - peakPosition) / peakWidth);
    const mirroredPeak = Math.max(0, 1 - Math.abs(halfPosition - (1 - peakPosition)) / peakWidth);
    const pulseShape = Math.pow(Math.max(peak, mirroredPeak), 0.7);
    const rawLevel = isPlaying
      ? Math.min(1, normalizedFrequency * (isUpper ? 0.42 : 0.52) + pulse * pulseShape * (isUpper ? 1.2 : 0.85))
      : 0.08 + (Math.sin(animationTime + halfPosition * 8) + 1) * 0.055;
    const smoothing = rawLevel > smoothedLevels[index] ? 0.38 : 0.12;
    smoothedLevels[index] += (rawLevel - smoothedLevels[index]) * smoothing;
    levels[index] = smoothedLevels[index];
  }

  const contourLevels = levels.map((_, index) => {
    let weightedLevel = 0;
    let totalWeight = 0;
    for (let offset = -6; offset <= 6; offset++) {
      const weight = 7 - Math.abs(offset);
      const levelIndex = (index + offset + pointCount) % pointCount;
      weightedLevel += levels[levelIndex] * weight;
      totalWeight += weight;
    }
    return weightedLevel / totalWeight;
  });

  function buildContourPath(outset = 0) {
    const points = [];
    for (let index = 0; index < pointCount; index++) {
      const angle = -Math.PI / 2 + index / pointCount * Math.PI * 2;
      const radius = safeBaseRadius + outset + contourLevels[index] * waveHeight;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }

    canvasContext.beginPath();
    const first = points[0];
    const last = points[pointCount - 1];
    canvasContext.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
    for (let index = 0; index < pointCount; index++) {
      const point = points[index];
      const nextPoint = points[(index + 1) % pointCount];
      canvasContext.quadraticCurveTo(
        point.x,
        point.y,
        (point.x + nextPoint.x) / 2,
        (point.y + nextPoint.y) / 2
      );
    }
    canvasContext.closePath();
  }

  const spectrumFill = canvasContext.createLinearGradient(centerX - safeBaseRadius, centerY, centerX + safeBaseRadius, centerY);
  contourColors.forEach((color, index) => {
    spectrumFill.addColorStop(index / (contourColors.length - 1), color);
  });

  canvasContext.save();
  canvasContext.shadowColor = "#6544ff";
  canvasContext.shadowBlur = isPlaying ? 8 : 5;
  buildContourPath();
  canvasContext.arc(centerX, centerY, safeBaseRadius, 0, Math.PI * 2, true);
  canvasContext.fillStyle = spectrumFill;
  canvasContext.fill("evenodd");

  canvasContext.shadowBlur = isPlaying ? 6 : 4;
  canvasContext.beginPath();
  canvasContext.arc(centerX, centerY, safeBaseRadius, 0, Math.PI * 2);
  canvasContext.strokeStyle = "#a325ff";
  canvasContext.lineWidth = 3;
  canvasContext.stroke();

  buildContourPath();
  canvasContext.strokeStyle = spectrumFill;
  canvasContext.lineWidth = 1.5;
  canvasContext.stroke();
  canvasContext.restore();

  animationFrame = requestAnimationFrame(drawVisualizer);
}

resizeVisualizer();
drawVisualizer();
window.addEventListener("resize", resizeVisualizer);

function connectAudioVisualizer() {
  if (!audioContext) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.35;
    analyser.minDecibels = -85;
    analyser.maxDecibels = -20;
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    audioContext.createMediaElementSource(audioPlayer).connect(analyser);
    analyser.connect(audioContext.destination);
  }
}

async function toggleMusic() {
  try {
    if (audioPlayer.paused) {
      connectAudioVisualizer();
      await audioContext.resume();
      await audioPlayer.play();
    } else if (audioContext && audioContext.state === "suspended") {
      await audioContext.resume();
    } else {
      audioPlayer.pause();
    }
  } catch (error) {
    musicStatus.textContent = error.name === "NotAllowedError"
      ? "Your browser blocked autoplay. Press the floating play button to start the track."
      : "The audio could not load. Open the portfolio with VS Code Live Server and try again.";
    console.error("Unable to play the music visualizer track.", error);
  }
}

musicControl.addEventListener("click", toggleMusic);

audioPlayer.addEventListener("play", () => {
  musicControlIcon.textContent = "Ⅱ";
  musicControl.setAttribute("aria-pressed", "true");
  musicControl.setAttribute("aria-label", "Pause music");
  musicControl.title = "Pause music";
  musicStatus.textContent = "";
});

audioPlayer.addEventListener("pause", () => {
  musicControlIcon.textContent = "▶";
  musicControl.setAttribute("aria-pressed", "false");
  musicControl.setAttribute("aria-label", "Play music");
  musicControl.title = "Play music";
});

audioPlayer.addEventListener("ended", () => {
  musicControlIcon.textContent = "▶";
  musicControl.setAttribute("aria-pressed", "false");
  musicControl.setAttribute("aria-label", "Play music");
  musicControl.title = "Play music";
});

window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(animationFrame);
});

connectAudioVisualizer();
audioPlayer.play().then(() => {
  audioContext.resume().catch(error => {
    console.error("Unable to resume the audio visualizer.", error);
  });
}).catch(error => {
  if (error.name !== "NotAllowedError") {
    musicStatus.textContent = "The audio could not load. Open the portfolio with VS Code Live Server and try again.";
    console.error("Unable to autoplay the music visualizer track.", error);
    return;
  }

  musicStatus.textContent = "Autoplay was blocked. Press the floating play button to start the track.";
});
