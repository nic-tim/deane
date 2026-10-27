(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- header border once the page scrolls ---- */
  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile menu ---- */
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");
  let closeTimer;

  const setMenu = (open) => {
    clearTimeout(closeTimer);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => {
        menu.classList.add("is-open");
        // focusable only once the panel is visible
        menu.querySelector("a").focus({ preventScroll: true });
      });
    } else {
      menu.classList.remove("is-open");
      closeTimer = setTimeout(() => { menu.hidden = true; }, reduceMotion ? 0 : 320);
    }
  };

  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width: 880px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  /* ---- hero call: reveal the exchange in order ---- */
  const seq = [...document.querySelectorAll(".stage .seq")];
  if (reduceMotion) {
    seq.forEach((el) => el.classList.add("is-on"));
  } else {
    const delays = [250, 1150, 2000, 2650, 3350, 3850, 4350];
    seq.forEach((el, i) => setTimeout(() => el.classList.add("is-on"), delays[i] ?? 4350 + i * 400));
  }

  /* ---- scroll reveal ----
     A geometry check on scroll rather than IntersectionObserver: it can't
     leave content stuck invisible if observer callbacks are throttled. */
  let pending = [...document.querySelectorAll(".reveal")];
  if (reduceMotion) {
    pending.forEach((el) => el.classList.add("in"));
    return;
  }
  let ticking = false;
  const check = () => {
    ticking = false;
    const line = window.innerHeight * 0.92;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < line) {
        el.classList.add("in");
        return false;
      }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener("scroll", onReveal);
      window.removeEventListener("resize", onReveal);
    }
  };
  const onReveal = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(check);
    }
  };
  window.addEventListener("scroll", onReveal, { passive: true });
  window.addEventListener("resize", onReveal);
  check();
})();
