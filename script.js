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
let scrollAnimationFrame = 0;
let previousScrollBehavior = "";

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
    document.querySelectorAll(".nav-link").forEach(item => {
      item.classList.toggle("active", item.getAttribute("href") === href);
    });

    if (window.location.hash !== href) {
      history.pushState(null, "", href);
    }

    scrollToSection(target);
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
