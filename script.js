(function () {
  // 1. Personal portrait drag / contextmenu protection
  const heroCanopy = document.getElementById("heroCanopy");

  document.querySelectorAll(".protected-photo, .brand-slot").forEach((el) => {
    el.addEventListener("contextmenu", (e) => e.preventDefault());
    el.addEventListener("dragstart", (e) => e.preventDefault());
  });

  // 2. Scroll-aware top banner: swap motif -> avatar/name as canopy clears header + swap active project logo
  const kqSection = document.getElementById("kulturaquest");
  const woSection = document.getElementById("weedsout");
  const ctxLogoKq = document.getElementById("ctxLogoKq");
  const ctxLogoWo = document.getElementById("ctxLogoWo");

  if ("IntersectionObserver" in window && heroCanopy) {
    const canopyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          document.body.classList.toggle("is-scrolled-past-hero", !entry.isIntersecting);
        });
      },
      { rootMargin: "-73px 0px 0px 0px", threshold: 0 }
    );
    canopyObserver.observe(heroCanopy);
  }

  if ("IntersectionObserver" in window && kqSection && woSection && ctxLogoKq && ctxLogoWo) {
    const visibleState = { kq: false, wo: false };

    const updateContextLogo = () => {
      ctxLogoKq.classList.toggle("is-visible", visibleState.kq && !visibleState.wo);
      ctxLogoWo.classList.toggle("is-visible", visibleState.wo);
    };

    const projectObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === kqSection) visibleState.kq = entry.isIntersecting;
          if (entry.target === woSection) visibleState.wo = entry.isIntersecting;
        });
        updateContextLogo();
      },
      { rootMargin: "-20% 0px -35% 0px", threshold: 0.05 }
    );

    projectObserver.observe(kqSection);
    projectObserver.observe(woSection);
  }

  // 3. KulturaQuest 9-slide dual-resolution carousel (1440w preview + native 1080p cinema view)
  const kqSlides = [
    {
      preview: "assets/img/kq-exploration.webp",
      full: "assets/img/kq-exploration-full.webp",
      title: "KulturaQuest: Exploration",
      caption: "Third-person exploration in Unity 6 using Universal Render Pipeline and cel-shaded assets."
    },
    {
      preview: "assets/img/kq-puzzles.webp",
      full: "assets/img/kq-puzzles-full.webp",
      title: "KulturaQuest: Puzzles",
      caption: "Slingshot interaction and Baybayin gong puzzle mechanics."
    },
    {
      preview: "assets/img/kq-kwaderno.webp",
      full: "assets/img/kq-kwaderno-full.webp",
      title: "KulturaQuest: Kwaderno Journal",
      caption: "Diegetic two-page journal with interactive 3D artifact inspection and discovery tracking."
    },
    {
      preview: "assets/img/kq-minigames.webp",
      full: "assets/img/kq-minigames-full.webp",
      title: "KulturaQuest: Minigames",
      caption: "Timing-based cultural minigame with custom HUD feedback and progression state."
    },
    {
      preview: "assets/img/kq-adventure.webp",
      full: "assets/img/kq-adventure-full.webp",
      title: "KulturaQuest: Environment & Waterfalls",
      caption: "Stylized environment traversal and level design across the world of Hiraya."
    },
    {
      preview: "assets/img/kq-heritage.webp",
      full: "assets/img/kq-heritage-full.webp",
      title: "KulturaQuest: Heritage & Interactions",
      caption: "Cultural gesture and NPC interaction sequences integrated into quest progression."
    },
    {
      preview: "assets/img/kq-questing.webp",
      full: "assets/img/kq-questing-full.webp",
      title: "KulturaQuest: Questing & Props",
      caption: "Object carrying, village tasks, and interactive world props."
    },
    {
      preview: "assets/img/kq-mechanics.webp",
      full: "assets/img/kq-mechanics-full.webp",
      title: "KulturaQuest: Tools & Mechanics",
      caption: "Charged slingshot targeting and environmental puzzle triggers."
    },
    {
      preview: "assets/img/kq-climbing.webp",
      full: "assets/img/kq-climbing-full.webp",
      title: "KulturaQuest: Traversal & Climbing",
      caption: "Vertical climbing paths and multi-elevation zone navigation."
    }
  ];

  const kqImg = document.getElementById("kqCarouselImg");
  const kqCaption = document.getElementById("kqCarouselCaption");
  const kqCount = document.getElementById("kqCarouselCount");
  const kqTrigger = document.getElementById("kqCarouselTrigger");
  const kqPrevBtn = document.getElementById("kqPrevBtn");
  const kqNextBtn = document.getElementById("kqNextBtn");
  const kqStage = document.querySelector(".carousel-stage");

  let kqIndex = 0;

  function setKqSlide(idx) {
    kqIndex = (idx + kqSlides.length) % kqSlides.length;
    const s = kqSlides[kqIndex];
    if (kqImg) {
      kqImg.src = s.preview;
      kqImg.alt = s.title;
    }
    if (kqCaption) kqCaption.textContent = s.caption;
    if (kqCount) kqCount.textContent = kqIndex + 1 + " / " + kqSlides.length;
    if (kqTrigger) kqTrigger.setAttribute("data-cinema-index", String(kqIndex));
  }

  if (kqPrevBtn) kqPrevBtn.addEventListener("click", () => setKqSlide(kqIndex - 1));
  if (kqNextBtn) kqNextBtn.addEventListener("click", () => setKqSlide(kqIndex + 1));

  if (kqStage) {
    let touchStartX = 0;
    kqStage.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    kqStage.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 45) {
        setKqSlide(dx < 0 ? kqIndex + 1 : kqIndex - 1);
      }
    }, { passive: true });
  }

  // 4. Dedicated Borderless Cinema Lightbox (KulturaQuest Native 1080p)
  const cinemaLightbox = document.getElementById("cinemaLightbox");
  const cinemaImg = document.getElementById("cinemaImg");
  const cinemaCaption = document.getElementById("cinemaCaption");
  const cinemaPrev = document.getElementById("cinemaPrev");
  const cinemaNext = document.getElementById("cinemaNext");

  let cinemaIndex = 0;
  let lastCinemaFocus = null;

  function renderCinema() {
    const s = kqSlides[cinemaIndex];
    cinemaImg.src = s.full;
    cinemaImg.alt = s.title;
    cinemaCaption.textContent = cinemaIndex + 1 + " / " + kqSlides.length + " · " + s.caption;
  }

  function openCinema(index) {
    cinemaIndex = index;
    lastCinemaFocus = document.activeElement;
    renderCinema();
    cinemaLightbox.hidden = false;
    cinemaLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCinema() {
    cinemaLightbox.hidden = true;
    cinemaLightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastCinemaFocus && typeof lastCinemaFocus.focus === "function") {
      lastCinemaFocus.focus();
    }
  }

  if (kqTrigger) {
    kqTrigger.addEventListener("click", () => {
      const idx = parseInt(kqTrigger.getAttribute("data-cinema-index"), 10) || 0;
      openCinema(idx);
    });
  }

  document.querySelectorAll("[data-cinema-close]").forEach((el) => {
    el.addEventListener("click", closeCinema);
  });

  if (cinemaPrev) {
    cinemaPrev.addEventListener("click", () => {
      cinemaIndex = (cinemaIndex - 1 + kqSlides.length) % kqSlides.length;
      renderCinema();
    });
  }

  if (cinemaNext) {
    cinemaNext.addEventListener("click", () => {
      cinemaIndex = (cinemaIndex + 1) % kqSlides.length;
      renderCinema();
    });
  }

  // 5. Dedicated 3D Works Multi-View Lightbox
  const artItems = [
    {
      title: "Stylized Character Study",
      caption: "Subsurface scattering skin shader and forest environment render in Autodesk Maya.",
      views: [
        { label: "Portrait", src: "assets/img/3d-sss-bust.webp" },
        { label: "Environment", src: "assets/img/3d-char-env.webp" }
      ],
      activeView: 0
    },
    {
      title: "Chess Pieces Study",
      caption: "Studio lighting, depth of field, and glass refraction study in Autodesk Maya.",
      views: [
        { label: "Shot 1", src: "assets/img/3d-chess-1.webp" },
        { label: "Shot 2", src: "assets/img/3d-chess-2.webp" }
      ],
      activeView: 0
    },
    {
      title: "Computer Laboratory Interior",
      caption: "Modular workstation modeling and interior lighting in Autodesk Maya.",
      views: [
        { label: "Wide View", src: "assets/img/3d-lab-interior.webp" },
        { label: "Corner View", src: "assets/img/3d-lab-corner.webp" },
        { label: "Desk Close-Up", src: "assets/img/3d-lab-desk.webp" }
      ],
      activeView: 0
    },
    {
      title: "Interior Still Life",
      caption: "Warm lamp lighting, glass shading, and cloth simulation with wireframe topology pass.",
      views: [
        { label: "Render", src: "assets/img/3d-still-render.webp" },
        { label: "Wireframe", src: "assets/img/3d-still-wireframe.webp" }
      ],
      activeView: 0
    }
  ];

  const artLightbox = document.getElementById("artLightbox");
  const artImg = document.getElementById("artLightboxImg");
  const artTitle = document.getElementById("artLightboxTitle");
  const artCaption = document.getElementById("artLightboxCaption");
  const artPrev = document.getElementById("artLightboxPrev");
  const artNext = document.getElementById("artLightboxNext");
  const artSwitch = document.getElementById("artLightboxSwitch");

  let artIndex = 0;
  let lastArtFocus = null;

  function renderArtLightbox() {
    const item = artItems[artIndex];
    artTitle.textContent = item.title;
    artCaption.textContent = item.caption;
    artSwitch.innerHTML = "";

    const views = item.views || [];
    const viewIdx = item.activeView || 0;
    const currentView = views[viewIdx];
    artImg.src = currentView.src;
    artImg.alt = item.title + " (" + currentView.label + ")";

    if (views.length > 1) {
      views.forEach((v, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pass-btn" + (idx === viewIdx ? " is-active" : "");
        b.textContent = v.label;
        b.addEventListener("click", () => {
          item.activeView = idx;
          renderArtLightbox();
        });
        artSwitch.appendChild(b);
      });
      artSwitch.hidden = false;
    } else {
      artSwitch.hidden = true;
    }
  }

  function openArtLightbox(index) {
    artIndex = index;
    lastArtFocus = document.activeElement;
    renderArtLightbox();
    artLightbox.hidden = false;
    artLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeArtLightbox() {
    artLightbox.hidden = true;
    artLightbox.setAttribute("aria-hidden", "true");
    artSwitch.innerHTML = "";
    artSwitch.hidden = true;
    document.body.style.overflow = "";
    if (lastArtFocus && typeof lastArtFocus.focus === "function") {
      lastArtFocus.focus();
    }
  }

  document.querySelectorAll("[data-art-index]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const idx = parseInt(trigger.getAttribute("data-art-index"), 10) || 0;
      openArtLightbox(idx);
    });
  });

  document.querySelectorAll("[data-art-close]").forEach((el) => {
    el.addEventListener("click", closeArtLightbox);
  });

  if (artPrev) {
    artPrev.addEventListener("click", () => {
      artIndex = (artIndex - 1 + artItems.length) % artItems.length;
      renderArtLightbox();
    });
  }

  if (artNext) {
    artNext.addEventListener("click", () => {
      artIndex = (artIndex + 1) % artItems.length;
      renderArtLightbox();
    });
  }

  // Shared keyboard navigation for whichever modal is open
  document.addEventListener("keydown", (e) => {
    if (!cinemaLightbox.hidden) {
      if (e.key === "Escape") closeCinema();
      if (e.key === "ArrowLeft" && cinemaPrev) cinemaPrev.click();
      if (e.key === "ArrowRight" && cinemaNext) cinemaNext.click();
      return;
    }
    if (!artLightbox.hidden) {
      if (e.key === "Escape") closeArtLightbox();
      if (e.key === "ArrowLeft" && artPrev) artPrev.click();
      if (e.key === "ArrowRight" && artNext) artNext.click();
    }
  });
})();
