const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Цели Яндекс Метрики: идентификаторы совпадают с целями, заведёнными в интерфейсе Метрики
const goal = (name, params) => window.ym?.(113889488, "reachGoal", name, params);
document.addEventListener("click", (e) => {
  const href = e.target.closest("a[href]")?.getAttribute("href") || "";
  if (href.startsWith("https://t.me/")) goal("telegram");
  else if (href.includes("docs.google.com")) goal("resume");
  else if (href.startsWith("mailto:")) goal("email");
  else if (/behance\.net|dribbble\.com/.test(href)) goal("portfolio_link");
});

// Плавное появление плиток и строк при скролле
const revealIO = new IntersectionObserver(
  (entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, i) => {
      const el = e.target;
      el.style.transitionDelay = `${Math.min(i, 7) * 60}ms`;
      el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true });
      el.classList.add("is-in");
      revealIO.unobserve(el);
    });
  },
  { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
);
document.querySelectorAll(".case, .bento figure, .row, .photos img, .cols p, .tools").forEach((el) => {
  el.classList.add("reveal");
  revealIO.observe(el);
});
// Первые плитки видны сразу
requestAnimationFrame(() => document.querySelectorAll(".case").forEach((el) => {
  if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in");
}));

// Паучок повисает чуть выше заголовка, где бы тот ни оказался при текущей высоте экрана
const spider = document.querySelector(".spider");
const greeting = document.querySelector(".profile h1");
const placeSpider = () => spider?.style.setProperty("--drop", `${greeting.offsetTop - 36 - 26}px`);
placeSpider();
addEventListener("resize", placeSpider);
document.fonts?.ready.then(placeSpider);

// Диалоги закрываются тем же движением обратно, на ступень быстрее открытия
const closeAnimated = (dialog) => {
  if (!dialog.open || dialog.classList.contains("is-closing")) return;
  dialog.classList.add("is-closing");
  const onEnd = (e) => e.animationName.endsWith("Out") && done();
  const done = () => {
    clearTimeout(fallback);
    dialog.removeEventListener("animationend", onEnd);
    dialog.classList.remove("is-closing");
    dialog.close();
  };
  const fallback = setTimeout(done, 400);
  dialog.addEventListener("animationend", onEnd);
};
const closeOnEsc = (dialog) => dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeAnimated(dialog);
});

// Любая кнопка при нажатии проседает на одни и те же 3px, а не на долю своей ширины
document.addEventListener("pointerdown", (e) => {
  const b = e.target.closest(".btn, .sheet__btn, .sheet__nav button, .sheet__close, .chip--btn, .demo__close");
  if (b) b.style.setProperty("--press", (1 - 6 / b.offsetWidth).toFixed(4));
});

// Список работ: одна подложка скользит за курсором от строки к строке
const index = document.querySelector(".index");
if (index && matchMedia("(hover: hover)").matches) {
  const hl = document.createElement("span");
  hl.className = "index__hl";
  index.prepend(hl);
  const moveTo = (a) => {
    // Первое появление — сразу на месте, без проезда от прошлой строки
    if (!index.classList.contains("is-hover")) {
      hl.style.transition = "none";
      requestAnimationFrame(() => (hl.style.transition = ""));
    }
    hl.style.transform = `translateY(${a.offsetTop}px)`;
    hl.style.height = `${a.offsetHeight}px`;
    index.classList.add("is-hover");
  };
  index.querySelectorAll("a").forEach((a) => a.addEventListener("mouseenter", () => moveTo(a)));
  index.addEventListener("mouseleave", () => index.classList.remove("is-hover"));
}

// Видео грузятся и играют только в зоне видимости
const videoIO = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (!v.src) v.src = v.dataset.src;
        if (!reduceMotion) v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  },
  { rootMargin: "200px 0px", threshold: 0.15 }
);
const watchVideos = (root) => root.querySelectorAll("video.lazy-video").forEach((v) => videoIO.observe(v));
watchVideos(document);

// Оглавление слева подсвечивает то, что сейчас в центре экрана
const indexLinks = [...document.querySelectorAll(".intro [data-target]")];
const indexIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      indexLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.target === e.target.id));
    });
  },
  { rootMargin: "-50% 0px -50% 0px" }
);
indexLinks.forEach((a) => {
  const target = document.getElementById(a.dataset.target);
  if (target) indexIO.observe(target);
});

// Живое демо Record Crate в рамке телефона
const demo = document.getElementById("demo");
const frame = demo.querySelector("iframe");
const openDemo = (src) => {
  goal("demo");
  // На телефоне рамка не нужна — открываем демо на весь экран
  if (innerWidth < 640) return void window.open(src, "_blank", "noopener");
  if (!frame.src) frame.src = src;
  demo.showModal();
};
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-demo]");
  if (!btn) return;
  e.stopPropagation();
  openDemo(btn.dataset.demo);
}, true);
demo.querySelector(".demo__close").addEventListener("click", () => closeAnimated(demo));
demo.addEventListener("click", (e) => {
  if (e.target === demo) closeAnimated(demo);
});
closeOnEsc(demo);

// Карточка кейса: открывается по клику на плитку
const cases = [...document.querySelectorAll(".case")];
const sheet = document.getElementById("sheet");
const sheetIndex = sheet.querySelector("[data-sheet-index]");
const sheetMedia = sheet.querySelector("[data-sheet-media]");
const sheetBody = sheet.querySelector("[data-sheet-body]");
const [prevBtn, nextBtn] = sheet.querySelectorAll("[data-sheet-step]");
let openIdx = -1;

const fillSheet = (i) => {
  openIdx = i;
  const c = cases[i];
  sheetIndex.textContent = `${c.dataset.index} / ${String(cases.length).padStart(2, "0")}`;
  const media = c.querySelector(".case__media").cloneNode(true);
  // Фон плитки задан на самой статье — без него в карточке вместо фона пустота
  media.style.setProperty("--bg", c.style.getPropertyValue("--bg"));
  media.querySelectorAll("video").forEach((v) => v.removeAttribute("src"));
  sheetMedia.replaceChildren(media);
  watchVideos(sheetMedia);
  sheetBody.innerHTML = c.querySelector(".case__about").innerHTML;
  prevBtn.disabled = i === 0;
  nextBtn.disabled = i === cases.length - 1;
  sheet.querySelector(".sheet__panel").scrollTop = 0;
};

cases.forEach((c, i) => {
  c.tabIndex = 0;
  c.setAttribute("role", "button");
  c.setAttribute("aria-label", `Открыть проект: ${c.querySelector(".case__about h2").textContent}`);
  // Подсказка «Подробнее» появляется на плитке при наведении
  const more = document.createElement("span");
  more.className = "chip chip--more";
  more.textContent = "Подробнее";
  const bar = c.querySelector(".case__bar");
  bar.insertBefore(more, bar.querySelector(".chip--btn"));

  const open = () => {
    fillSheet(i);
    sheet.showModal();
    goal("case_open", { case: c.querySelector(".case__about h2").textContent });
  };
  c.addEventListener("click", open);
  c.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });
});

sheet.querySelector(".sheet__close").addEventListener("click", () => closeAnimated(sheet));
sheet.addEventListener("click", (e) => {
  if (e.target === sheet) closeAnimated(sheet);
});
closeOnEsc(sheet);
sheet.addEventListener("close", () => {
  sheetMedia.querySelectorAll("video").forEach((v) => v.pause());
  cases[openIdx]?.focus({ preventScroll: true });
});
[prevBtn, nextBtn].forEach((btn) =>
  btn.addEventListener("click", () => fillSheet(openIdx + Number(btn.dataset.sheetStep)))
);
document.addEventListener("keydown", (e) => {
  if (!sheet.open) return;
  if (e.key === "ArrowRight" && openIdx < cases.length - 1) fillSheet(openIdx + 1);
  if (e.key === "ArrowLeft" && openIdx > 0) fillSheet(openIdx - 1);
});
