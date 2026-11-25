(function () {
  // 1. All-image drag / right-click protection (text and links remain selectable)
  const heroCanopy = document.getElementById("heroCanopy");

  document.querySelectorAll("img").forEach((img) => {
    img.setAttribute("draggable", "false");
  });

  document
    .querySelectorAll(
      ".protected-photo, .brand-slot, .project-emblem, .carousel-viewport, .art-trigger, .cinema-stage, .lightbox-media"
    )
    .forEach((el) => {
      el.addEventListener("contextmenu", (e) => e.preventDefault());
      el.addEventListener("dragstart", (e) => e.preventDefault());
    });

  // 2. Scroll-aware top banner: swap motif -> avatar/name as canopy clears header + swap active project logo
  const kqSection = document.getElementById("projects");
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

  // Mobile hamburger menu drawer + active-section scroll-spy underline
  const siteHeader = document.querySelector(".site-header");
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");
  const brandLink = document.querySelector(".brand-slot");

  const setNavOpen = (open) => {
    if (!navToggle || !primaryNav) return;
    navToggle.classList.toggle("is-open", open);
    primaryNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      setNavOpen(!primaryNav.classList.contains("is-open"));
    });

    document.addEventListener("click", (e) => {
      if (primaryNav.classList.contains("is-open") && siteHeader && !siteHeader.contains(e.target)) {
        setNavOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 680 && primaryNav.classList.contains("is-open")) {
        setNavOpen(false);
      }
    });
  }

  const navTargets = ["projects", "art3d", "background", "contact"]
    .map((id) => ({
      id,
      section: document.getElementById(id),
      link: document.querySelector(`.site-nav a[href="#${id}"]`)
    }))
    .filter((item) => item.section && item.link);

  if (navTargets.length) {
    let navRafPending = false;
    let pinnedNavId = null;

    const updateActiveNav = () => {
      navRafPending = false;
      const headerHeight = siteHeader ? siteHeader.offsetHeight : 73;
      const scrollMarker = window.scrollY + headerHeight + window.innerHeight * 0.42;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;

      let activeId = null;
      if (pinnedNavId) {
        activeId = pinnedNavId;
      } else if (atBottom) {
        activeId = "contact";
      } else {
        for (const item of navTargets) {
          if (item.section.offsetTop <= scrollMarker) {
            activeId = item.id;
          }
        }
      }

      navTargets.forEach((item) => {
        const active = item.id === activeId;
        item.link.classList.toggle("is-active", active);
        if (active) {
          item.link.setAttribute("aria-current", "location");
        } else {
          item.link.removeAttribute("aria-current");
        }
      });
    };

    const requestNavUpdate = () => {
      if (navRafPending) return;
      navRafPending = true;
      window.requestAnimationFrame(updateActiveNav);
    };

    const clearPinnedNav = () => {
      if (!pinnedNavId) return;
      pinnedNavId = null;
      requestNavUpdate();
    };

    navTargets.forEach((item) => {
      item.link.addEventListener("click", (e) => {
        pinnedNavId = item.id;
        setNavOpen(false);
        updateActiveNav();

        if (item.id === "background") {
          e.preventDefault();
          const headerHeight = siteHeader ? siteHeader.offsetHeight : 73;
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
          const clearanceFromBottom = window.innerWidth <= 680 ? 140 : 220;
          const sectionTop = item.section.getBoundingClientRect().top + window.scrollY;
          const defaultTop = Math.max(0, sectionTop - headerHeight);
          const targetY = Math.max(0, Math.min(defaultTop, Math.max(0, maxScroll - clearanceFromBottom)));
          const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          window.scrollTo({ top: targetY, behavior: reducedMotion ? "auto" : "smooth" });
          if (history.replaceState) {
            history.replaceState(null, "", "#background");
          }
        }
      });
    });

    if (brandLink) {
      brandLink.addEventListener("click", (e) => {
        e.preventDefault();
        pinnedNavId = null;
        setNavOpen(false);
        const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
        if (history.replaceState) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        updateActiveNav();
      });
    }

    window.addEventListener("wheel", clearPinnedNav, { passive: true });
    window.addEventListener("touchmove", clearPinnedNav, { passive: true });
    window.addEventListener("keydown", (e) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) {
        clearPinnedNav();
      }
    });

    updateActiveNav();
    window.addEventListener("scroll", requestNavUpdate, { passive: true });
    window.addEventListener("resize", requestNavUpdate);
  }

  // Single-active-video playback manager (hero loop pause + YouTube API mutual exclusion)
  const heroSection = document.getElementById("hero");
  const heroVideo = document.querySelector(".hero-video");
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ytIframeIds = ["ytKqTrailer", "ytWoGameplay"];
  const ytPlayers = new Map();
  let ytApiRequested = false;

  if ("IntersectionObserver" in window && heroSection && heroVideo && !prefersReducedMotion) {
    const heroVideoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            heroVideo.play().catch(() => {});
          } else {
            heroVideo.pause();
          }
        });
      },
      { threshold: 0.05 }
    );
    heroVideoObserver.observe(heroSection);
  }

  function pauseAllYouTube(exceptId) {
    ytPlayers.forEach((player, id) => {
      if (id === exceptId) return;
      try {
        if (typeof player.pauseVideo === "function") {
          player.pauseVideo();
        }
      } catch (_err) {
        // Ignore cross-origin or unready player errors
      }
    });
  }

  function registerYtPlayers() {
    if (!window.YT || !window.YT.Player) return;
    ytIframeIds.forEach((id) => {
      if (ytPlayers.has(id)) return;
      const frame = document.getElementById(id);
      if (!frame) return;
      try {
        const player = new window.YT.Player(id, {
          events: {
            onStateChange: (event) => {
              if (window.YT && event && event.data === window.YT.PlayerState.PLAYING) {
                pauseAllYouTube(id);
                if (heroVideo && !heroVideo.paused) {
                  heroVideo.pause();
                }
              }
            }
          }
        });
        ytPlayers.set(id, player);
      } catch (_err) {
        // Fallback silently if YT script is blocked or iframe is not ready
      }
    });
  }

  function ensureYtApiLoaded() {
    if (ytApiRequested) {
      registerYtPlayers();
      return;
    }
    ytApiRequested = true;

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === "function") prevReady();
      registerYtPlayers();
    };

    if (window.YT && window.YT.Player) {
      registerYtPlayers();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  }

  ytIframeIds.forEach((id) => {
    const frame = document.getElementById(id);
    if (frame) {
      frame.addEventListener("load", () => {
        if (window.YT && window.YT.Player) registerYtPlayers();
      });
    }
  });

  if ("IntersectionObserver" in window && kqSection) {
    const ytTriggerObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          ensureYtApiLoaded();
          ytTriggerObserver.disconnect();
        }
      },
      { rootMargin: "350px 0px" }
    );
    ytTriggerObserver.observe(kqSection);
  } else {
    ensureYtApiLoaded();
  }

  // Image preloading + decode-before-swap + delayed blur/loading pill
  const decodedSet = new Set();
  const preloadPromises = new Map();

  function preloadImage(src) {
    if (!src) return Promise.resolve();
    if (decodedSet.has(src)) return Promise.resolve();
    if (preloadPromises.has(src)) return preloadPromises.get(src);

    const p = new Promise((resolve) => {
      const loaderImg = new Image();
      const finish = () => {
        decodedSet.add(src);
        resolve();
      };
      loaderImg.onload = () => {
        if (typeof loaderImg.decode === "function") {
          loaderImg.decode().then(finish, finish);
        } else {
          finish();
        }
      };
      loaderImg.onerror = () => resolve();
      loaderImg.src = src;
    });

    preloadPromises.set(src, p);
    return p;
  }

  function swapImageSmooth({ imgEl, loaderEl, src, alt, tokenRef, immediatePreviewSrc }) {
    if (!imgEl || !src) return;
    tokenRef.id += 1;
    const reqId = tokenRef.id;
    clearTimeout(tokenRef.timer);

    const hideLoader = () => {
      if (loaderEl) loaderEl.hidden = true;
    };

    if (decodedSet.has(src)) {
      imgEl.classList.remove("is-media-loading");
      hideLoader();
      if (imgEl.getAttribute("src") === src) {
        imgEl.alt = alt;
        return;
      }
      if (!prefersReducedMotion) imgEl.classList.add("is-media-swapping");
      imgEl.src = src;
      imgEl.alt = alt;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          imgEl.classList.remove("is-media-swapping");
        });
      });
      return;
    }

    if (immediatePreviewSrc && !imgEl.getAttribute("src")) {
      imgEl.src = immediatePreviewSrc;
      imgEl.alt = alt;
    } else {
      imgEl.classList.add("is-media-loading");
    }

    if (loaderEl) {
      hideLoader();
      tokenRef.timer = window.setTimeout(() => {
        if (tokenRef.id === reqId) loaderEl.hidden = false;
      }, 180);
    }

    preloadImage(src).then(() => {
      if (tokenRef.id !== reqId) return;
      clearTimeout(tokenRef.timer);
      hideLoader();
      imgEl.src = src;
      imgEl.alt = alt;
      imgEl.classList.remove("is-media-loading", "is-media-swapping");
    });
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
  const kqLoader = document.getElementById("kqCarouselLoader");
  const kqCaption = document.getElementById("kqCarouselCaption");
  const kqCount = document.getElementById("kqCarouselCount");
  const kqTrigger = document.getElementById("kqCarouselTrigger");
  const kqPrevBtn = document.getElementById("kqPrevBtn");
  const kqNextBtn = document.getElementById("kqNextBtn");
  const kqCarousel = document.getElementById("kqCarousel");
  const kqStage = document.querySelector(".carousel-stage");

  let kqIndex = 0;
  const kqSwapToken = { id: 0, timer: null };

  if (kqImg && kqImg.complete && kqImg.naturalWidth > 0) {
    decodedSet.add(kqSlides[0].preview);
  }

  function preloadCarouselNeighbors(idx) {
    const prevIdx = (idx - 1 + kqSlides.length) % kqSlides.length;
    const nextIdx = (idx + 1) % kqSlides.length;
    preloadImage(kqSlides[prevIdx].preview);
    preloadImage(kqSlides[nextIdx].preview);
  }

  if ("IntersectionObserver" in window && kqCarousel) {
    const carouselPreloadObs = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          preloadCarouselNeighbors(kqIndex);
          carouselPreloadObs.disconnect();
        }
      },
      { rootMargin: "300px 0px" }
    );
    carouselPreloadObs.observe(kqCarousel);
  } else {
    preloadCarouselNeighbors(kqIndex);
  }

  function setKqSlide(idx) {
    kqIndex = (idx + kqSlides.length) % kqSlides.length;
    const s = kqSlides[kqIndex];
    if (kqCaption) kqCaption.textContent = s.caption;
    if (kqCount) kqCount.textContent = kqIndex + 1 + " / " + kqSlides.length;
    if (kqTrigger) kqTrigger.setAttribute("data-cinema-index", String(kqIndex));

    swapImageSmooth({
      imgEl: kqImg,
      loaderEl: kqLoader,
      src: s.preview,
      alt: s.title,
      tokenRef: kqSwapToken
    });
    preloadCarouselNeighbors(kqIndex);
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
  const cinemaLoader = document.getElementById("cinemaLoader");
  const cinemaCaption = document.getElementById("cinemaCaption");
  const cinemaPrev = document.getElementById("cinemaPrev");
  const cinemaNext = document.getElementById("cinemaNext");

  let cinemaIndex = 0;
  let lastCinemaFocus = null;
  const cinemaSwapToken = { id: 0, timer: null };

  function preloadCinemaNeighbors(idx) {
    const prevIdx = (idx - 1 + kqSlides.length) % kqSlides.length;
    const nextIdx = (idx + 1) % kqSlides.length;
    preloadImage(kqSlides[prevIdx].full);
    preloadImage(kqSlides[nextIdx].full);
  }

  function renderCinema() {
    const s = kqSlides[cinemaIndex];
    cinemaCaption.textContent = cinemaIndex + 1 + " / " + kqSlides.length + " · " + s.caption;
    swapImageSmooth({
      imgEl: cinemaImg,
      loaderEl: cinemaLoader,
      src: s.full,
      alt: s.title,
      tokenRef: cinemaSwapToken,
      immediatePreviewSrc: s.preview
    });
    preloadCinemaNeighbors(cinemaIndex);
  }

  function openCinema(index) {
    pauseAllYouTube();
    cinemaIndex = index;
    lastCinemaFocus = document.activeElement;
    renderCinema();
    cinemaLightbox.hidden = false;
    cinemaLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeCinema() {
    cinemaSwapToken.id += 1;
    clearTimeout(cinemaSwapToken.timer);
    if (cinemaLoader) cinemaLoader.hidden = true;
    cinemaImg.classList.remove("is-media-loading", "is-media-swapping");
    cinemaImg.removeAttribute("src");
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
      title: "Diwatres - Character Concept",
      caption: "Character concept portrait, pose, environment, turnaround, and props in Autodesk Maya.",
      views: [
        { label: "Portrait", src: "assets/img/3d-sss-bust.webp" },
        { label: "Pose", src: "assets/img/3d-diwatres-pose.webp" },
        { label: "Environment", src: "assets/img/3d-char-env.webp" },
        { label: "Breakdown", src: "assets/img/3d-diwatres-sheet.webp" }
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
      title: "Computer Laboratory Replica",
      caption: "Modular workstation replica and interior lighting in Autodesk Maya.",
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
  const artLoader = document.getElementById("artLoader");
  const artTitle = document.getElementById("artLightboxTitle");
  const artCaption = document.getElementById("artLightboxCaption");
  const artPrev = document.getElementById("artLightboxPrev");
  const artNext = document.getElementById("artLightboxNext");
  const artSwitch = document.getElementById("artLightboxSwitch");

  let artIndex = 0;
  let lastArtFocus = null;
  const artSwapToken = { id: 0, timer: null };

  function preloadArtContext(idx) {
    const item = artItems[idx];
    (item.views || []).forEach((v) => preloadImage(v.src));

    const prevItem = artItems[(idx - 1 + artItems.length) % artItems.length];
    const nextItem = artItems[(idx + 1) % artItems.length];
    preloadImage(prevItem.views[prevItem.activeView || 0].src);
    preloadImage(nextItem.views[nextItem.activeView || 0].src);
  }

  function renderArtLightbox() {
    const item = artItems[artIndex];
    artTitle.textContent = item.title;
    artCaption.textContent = item.caption;
    artSwitch.innerHTML = "";

    const views = item.views || [];
    const viewIdx = item.activeView || 0;
    const currentView = views[viewIdx];

    swapImageSmooth({
      imgEl: artImg,
      loaderEl: artLoader,
      src: currentView.src,
      alt: item.title + " (" + currentView.label + ")",
      tokenRef: artSwapToken
    });
    preloadArtContext(artIndex);

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
    pauseAllYouTube();
    artIndex = index;
    lastArtFocus = document.activeElement;
    renderArtLightbox();
    artLightbox.hidden = false;
    artLightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeArtLightbox() {
    artSwapToken.id += 1;
    clearTimeout(artSwapToken.timer);
    if (artLoader) artLoader.hidden = true;
    artImg.classList.remove("is-media-loading", "is-media-swapping");
    artImg.removeAttribute("src");
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

  // Shared keyboard navigation for open modals and mobile drawer
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
      return;
    }
    if (e.key === "Escape" && primaryNav && primaryNav.classList.contains("is-open")) {
      setNavOpen(false);
      if (navToggle) navToggle.focus();
    }
  });
})();
