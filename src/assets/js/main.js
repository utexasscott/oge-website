/* Office of Global Engagement — progressive enhancement
   1. Navigation (mobile toggle, submenus, escape/outside close)
   2. On-this-page table of contents
   3. Stories archive filtering (region / initiative / audience, URL-synced)
   4. Forms (client-side validation + success state; wire to a form handler in production)
   5. World map tooltip edge handling
*/
(function () {
  "use strict";

  /* 1. Navigation ------------------------------------------------- */
  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const desktop = window.matchMedia("(min-width: 64rem)");
  const items = document.querySelectorAll(".primary-nav__item.has-children");

  function setMobileNav(open) {
    if (!navToggle || !nav) return;
    navToggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    document.body.style.overflow = open && !desktop.matches ? "hidden" : "";
    if (!open) closeAllSubmenus();
  }

  function closeAllSubmenus(except) {
    items.forEach((i) => {
      if (i === except) return;
      i.classList.remove("is-open");
      const b = i.querySelector("[data-submenu-toggle]");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }

  function openSubmenu(item) {
    closeAllSubmenus(item);
    item.classList.add("is-open");
    item.classList.remove("is-closed");
    const b = item.querySelector("[data-submenu-toggle]");
    if (b) b.setAttribute("aria-expanded", "true");
    // Desktop: flip the panel to open leftward if it would run past the viewport edge.
    if (desktop.matches) {
      const sub = item.querySelector(".submenu");
      if (sub) {
        item.classList.remove("submenu--end");
        if (sub.getBoundingClientRect().right > document.documentElement.clientWidth - 8) item.classList.add("submenu--end");
      }
    }
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      setMobileNav(navToggle.getAttribute("aria-expanded") !== "true");
    });
  }

  items.forEach((item) => {
    const btn = item.querySelector("[data-submenu-toggle]");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (item.classList.contains("is-open")) {
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        // Keep it closed even though focus is still inside (desktop :focus-within rule).
        item.classList.add("is-closed");
      } else {
        openSubmenu(item);
      }
    });
    // Desktop: submenus are reachable with Tab via :focus-within. When focus leaves the item,
    // reset its state. On mobile the submenu is an accordion and should stay as the user left it.
    item.addEventListener("focusout", (e) => {
      if (!desktop.matches) return;
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove("is-open", "is-closed");
        btn.setAttribute("aria-expanded", "false");
      }
    });
    item.addEventListener("focusin", (e) => {
      if (!desktop.matches) return;
      // Focus arriving from outside the item starts fresh (a previous Escape no longer applies).
      if (!item.contains(e.relatedTarget)) item.classList.remove("is-closed");
      if (!item.classList.contains("is-closed")) btn.setAttribute("aria-expanded", "true");
    });
    // Pointer leaves the item on desktop: clear any keyboard state so the next hover works normally.
    item.addEventListener("mouseleave", () => {
      if (desktop.matches && !item.contains(document.activeElement)) item.classList.remove("is-closed");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openItem = Array.from(items).find((i) => i.classList.contains("is-open") || (desktop.matches && i.contains(document.activeElement) && !i.classList.contains("is-closed")));
    if (openItem && desktop.matches) {
      // Close the submenu; if focus is inside it, return focus to the parent link and set
      // `is-closed` so :focus-within does not immediately re-open the panel.
      closeAllSubmenus();
      const link = openItem.querySelector(".primary-nav__link");
      if (openItem.contains(document.activeElement)) {
        openItem.classList.add("is-closed");
        if (link) link.focus();
      }
      return;
    }
    if (nav && nav.classList.contains("is-open")) {
      setMobileNav(false);
      navToggle.focus();
    } else {
      closeAllSubmenus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!header || header.contains(e.target)) return;
    closeAllSubmenus();
    // Tapping the page behind the open mobile panel closes it.
    if (nav && nav.classList.contains("is-open") && !desktop.matches) setMobileNav(false);
  });

  // Crossing the desktop breakpoint: drop the mobile panel state and the scroll lock.
  const onBreakpoint = () => {
    if (desktop.matches) {
      document.body.style.overflow = "";
      if (nav && nav.classList.contains("is-open")) setMobileNav(false);
    } else {
      items.forEach((i) => i.classList.remove("is-closed", "submenu--end"));
      if (nav && nav.classList.contains("is-open")) document.body.style.overflow = "hidden";
    }
  };
  if (desktop.addEventListener) desktop.addEventListener("change", onBreakpoint);
  else desktop.addListener(onBreakpoint);

  /* 2. Table of contents ------------------------------------------ */
  const toc = document.querySelector("[data-toc]");
  const tocList = document.querySelector("[data-toc-list]");
  const content = document.getElementById("content");
  if (toc && tocList && content) {
    const headings = Array.from(content.querySelectorAll("h2[id]"));
    if (headings.length >= 2) {
      headings.forEach((h) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        tocList.appendChild(li);
      });
      toc.hidden = false;
      if ("IntersectionObserver" in window) {
        const links = tocList.querySelectorAll("a");
        const setActive = (id) => links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + id));
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) setActive(en.target.id);
            });
          },
          { rootMargin: "-20% 0px -70% 0px" }
        );
        headings.forEach((h) => io.observe(h));
        // Highlight immediately when a TOC link is used (the observer may not fire for short sections).
        links.forEach((l) => l.addEventListener("click", () => setActive(l.getAttribute("href").slice(1))));
      }
    }
  }

  /* 3. Stories filtering ------------------------------------------ */
  const filterForm = document.querySelector("[data-story-filters]");
  if (filterForm) {
    const grid = document.querySelector("[data-story-grid]") || document;
    const cards = Array.from(grid.querySelectorAll("[data-story]"));
    const summary = filterForm.querySelector("[data-filter-summary]");
    const empty = document.querySelector("[data-filter-empty]");
    const selects = Array.from(filterForm.querySelectorAll("select"));
    const reset = filterForm.querySelector("[data-filter-reset]");
    const slug = (s) =>
      String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    function readURL() {
      const params = new URLSearchParams(window.location.search);
      selects.forEach((s) => {
        const v = params.get(s.name);
        s.value = "";
        if (v) {
          const opt = Array.from(s.options).find((o) => slug(o.value) === v || o.value === v);
          if (opt) s.value = opt.value;
        }
      });
    }

    function writeURL() {
      const params = new URLSearchParams();
      selects.forEach((s) => {
        if (s.value) params.set(s.name, slug(s.value));
      });
      const qs = params.toString();
      const next = window.location.pathname + (qs ? "?" + qs : "");
      if (next !== window.location.pathname + window.location.search) history.pushState(null, "", next);
    }

    function apply(syncURL) {
      const active = {};
      selects.forEach((s) => {
        if (s.value) active[s.name] = s.value;
      });
      let shown = 0;
      cards.forEach((card) => {
        const ok = Object.keys(active).every((key) => {
          const attr = card.getAttribute("data-" + (key === "region" ? "regions" : key === "initiative" ? "initiatives" : "audiences")) || "";
          return attr.split("|").includes(active[key]);
        });
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (summary) {
        const parts = Object.values(active);
        summary.textContent = parts.length
          ? `Showing ${shown} ${shown === 1 ? "story" : "stories"} tagged ${parts.join(" · ")}.`
          : `Showing all ${shown} stories.`;
      }
      if (empty) empty.hidden = shown !== 0;
      if (syncURL !== false) writeURL();
    }

    selects.forEach((s) => s.addEventListener("change", () => apply()));
    // A (possibly hidden) submit button lets keyboard users apply filters explicitly; never reload the page.
    filterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      apply();
    });
    if (reset) {
      reset.addEventListener("click", () => {
        selects.forEach((s) => (s.value = ""));
        apply();
      });
    }
    window.addEventListener("popstate", () => {
      readURL();
      apply(false);
    });
    readURL();
    apply(false);
  }

  /* 4. Forms ------------------------------------------------------ */
  document.querySelectorAll("form[data-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]");
    const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

    function clearErrors() {
      form.querySelectorAll(".field--error").forEach((f) => f.classList.remove("field--error"));
      form.querySelectorAll(".field__error").forEach((p) => p.remove());
      form.querySelectorAll("[aria-invalid]").forEach((el) => {
        el.removeAttribute("aria-invalid");
        el.removeAttribute("aria-describedby");
      });
    }

    function flag(input, message) {
      const field = input.closest(".field");
      input.setAttribute("aria-invalid", "true");
      if (!field) return;
      field.classList.add("field--error");
      const p = document.createElement("p");
      p.className = "field__error";
      p.id = (input.id || input.name) + "-error";
      p.textContent = message;
      field.appendChild(p);
      input.setAttribute("aria-describedby", p.id);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      clearErrors();
      form.querySelectorAll("[required]").forEach((input) => {
        let message = "";
        if (input.type === "checkbox") {
          if (!input.checked) message = "Please check this box.";
        } else if (!input.value.trim()) {
          message = input.tagName === "SELECT" ? "Please choose an option." : "This field is required.";
        } else if (input.type === "email" && !emailOk(input.value.trim())) {
          message = "Enter a valid email address, like name@example.com.";
        }
        if (message) {
          valid = false;
          flag(input, message);
        }
      });
      if (!valid) {
        const count = form.querySelectorAll(".field--error").length;
        if (status) {
          status.hidden = false;
          status.className = "form__status form__status--error";
          status.setAttribute("role", "alert");
          status.setAttribute("aria-live", "assertive");
          status.textContent = count === 1 ? "Please complete the highlighted required field." : `Please complete the ${count} highlighted required fields.`;
        }
        const first = form.querySelector(".field--error input, .field--error select, .field--error textarea");
        if (first) first.focus();
        return;
      }
      // Honeypot: bots that fill the hidden field get the same success screen, but nothing is sent.
      const honeypot = form.querySelector('[name="website"]');
      const isBot = honeypot && honeypot.value.trim() !== "";
      // Production: POST to the WordPress form handler (Gravity Forms / WPForms) or a mailto fallback.
      // This local build simulates a successful submission.
      const name = (form.querySelector('[name="name"]') || form.querySelector('[name="first_name"]') || {}).value || "";
      form.querySelectorAll("input, select, textarea, button").forEach((el) => (el.disabled = true));
      if (status) {
        status.hidden = false;
        status.className = "form__status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.innerHTML =
          "<strong>Thank you" + (name ? ", " + name.trim().split(/\s+/)[0] : "") + ".</strong> " +
          (form.getAttribute("data-form-success") || "We've received your message and will be in touch soon.");
        status.focus();
      }
      if (isBot) return;
    });
  });

  /* 5. Map tooltip edge handling ---------------------------------- */
  const mapPins = document.querySelectorAll("[data-world-map] .world-map__pin");
  if (mapPins.length) {
    const TIP_HALF = 140; // px: half the widest tooltip plus a little margin
    const placeTips = () => {
      mapPins.forEach((pin) => {
        const canvas = pin.closest(".world-map__canvas");
        if (!canvas) return;
        const cw = canvas.clientWidth;
        const x = (parseFloat(pin.style.left) / 100) * cw;
        const left = canvas.getBoundingClientRect().left;
        pin.classList.toggle("world-map__pin--edge-left", left + x < TIP_HALF);
        pin.classList.toggle("world-map__pin--edge-right", document.documentElement.clientWidth - (left + x) < TIP_HALF);
      });
    };
    placeTips();
    let raf = 0;
    window.addEventListener("resize", () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(placeTips);
    });
    // Escape hides the open tooltip (WCAG 1.4.13 dismissable); it comes back on the next hover/focus.
    mapPins.forEach((pin) => {
      const clear = () => pin.classList.remove("is-dismissed");
      pin.addEventListener("mouseenter", clear);
      pin.addEventListener("focusin", clear);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      mapPins.forEach((pin) => {
        if (pin.matches(":hover, :focus-within")) pin.classList.add("is-dismissed");
      });
    });
  }

  /* 6. Events: highlight event targeted by hash --------------------- */
  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && target.classList.contains("event-detail")) target.style.borderColor = "#bf5700";
  }
})();
