(() => {
  const data = universeData;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function create(tag, className, text) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
  }

  function number(value) {
    return String(value).padStart(2, "0");
  }

  function textSection(title, text) {
    const section = create("section", "dossier-section");

    section.append(
      create("h3", "", title),
      create("p", "muted", text)
    );

    return section;
  }

  function renderRoute() {
    const list = document.getElementById("planet-list");
    const detail = document.getElementById("planet-detail");
    const count = document.getElementById("route-count");

    if (!list || !detail) return;

    const planets = data.planets;
    const opened = planets.filter(planet => planet.unlocked);

    if (count) {
      count.textContent = `Открыто: ${opened.length} / ${planets.length}`;
    }

    if (!planets.length) {
      detail.append(
        create("p", "muted", "Координаты маршрута пока не получены.")
      );
      return;
    }

    // Панель карты создаётся внутри существующей страницы.
    const consolePanel = create("div", "route-console");
    list.before(consolePanel);

    const toolbar = create("div", "route-toolbar");
    const currentPlanet = planets.find(planet => planet.current);

    const location = create(
      "p",
      "course-location",
      currentPlanet
        ? `Положение корабля → ${currentPlanet.name || "Неизвестный сектор"}`
        : "Положение корабля → уточняется"
    );

    const navigation = create("div", "route-navigation");

    const previous = create("button", "route-arrow", "←");
    previous.type = "button";
    previous.setAttribute("aria-label", "Предыдущая точка маршрута");
    previous.setAttribute("aria-controls", "planet-list");

    const next = create("button", "route-arrow", "→");
    next.type = "button";
    next.setAttribute("aria-label", "Следующая точка маршрута");
    next.setAttribute("aria-controls", "planet-list");

    navigation.append(previous, next);
    toolbar.append(location, navigation);

    list.setAttribute("role", "region");
    list.setAttribute("aria-roledescription", "карусель");
    list.setAttribute("aria-label", "Звёздная карта маршрута");
    list.tabIndex = 0;

    const footer = create("div", "route-footer");
    const stage = create("span", "route-stage");

    const progress = create("progress", "route-progress");
    progress.max = planets.length;
    progress.value = 1;
    progress.setAttribute(
      "aria-label",
      "Просматриваемая точка маршрута, не прогресс экспедиции"
    );

    footer.append(
      stage,
      progress,
      create("span", "route-hint", "Листай карту · на телефоне — свайп")
    );

    consolePanel.append(toolbar, list, footer);

    const cards = [];
    let activeIndex = -1;

    function showDetails(planet, index) {
      const heading = create("div");
      const body = create("div");

      if (!planet.unlocked) {
        detail.classList.add("is-locked");

        heading.append(
          create("p", "eyebrow", "Досье недоступно"),
          create("h3", "", "Неизвестный мир"),
          create("span", "badge", `ТОЧКА ${number(index + 1)} / ЗАКРЫТО`)
        );

        body.append(
          create("p", "unknown-signal", planet.signal || "Нет сигнала"),
          create(
            "p",
            "muted",
            "Название, координаты и характеристики объекта пока " +
            "не установлены. Данные появятся после исследования " +
            "предыдущего участка маршрута."
          ),
          create(
            "p",
            "mission",
            "ЭХО → Недостаточно информации для расчёта безопасного сближения."
          )
        );
      } else {
        detail.classList.remove("is-locked");

        heading.append(
          create("p", "eyebrow", "Доступ разрешён"),
          create("h3", "", planet.name || "Без названия"),
          create("span", "badge", planet.coordinates || "Координаты уточняются")
        );

        const facts = create("div", "planet-facts");

        [
          planet.type,
          planet.atmosphere && `Атмосфера: ${planet.atmosphere}`,
          planet.gravity && `Гравитация: ${planet.gravity}`
        ].filter(Boolean).forEach(fact => {
          facts.append(create("span", "badge", fact));
        });

        body.append(
          facts,
          create(
            "p",
            "planet-description",
            planet.description || "Описание будет добавлено."
          )
        );

        if (planet.mission) {
          body.append(
            create("p", "mission", `Текущая задача → ${planet.mission}`)
          );
        }
      }

      detail.replaceChildren(heading, body);
    }

    function activate(index) {
      if (index === activeIndex) return;

      activeIndex = index;

      cards.forEach((card, cardIndex) => {
        const selected = cardIndex === index;

        card.setAttribute("aria-pressed", String(selected));
        card.tabIndex = selected ? 0 : -1;
      });

      previous.disabled = index === 0;
      next.disabled = index === planets.length - 1;

      stage.textContent =
        `Просмотр точки ${number(index + 1)} / ${number(planets.length)}`;

      progress.value = index + 1;

      showDetails(planets[index], index);
    }

    function moveTo(index, focus = false, smooth = true) {
      const targetIndex = Math.max(0, Math.min(index, cards.length - 1));
      const card = cards[targetIndex];

      const viewportRect = list.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      const left =
        list.scrollLeft +
        cardRect.left -
        viewportRect.left -
        (list.clientWidth - cardRect.width) / 2;

      list.scrollTo({
        left,
        behavior: smooth && !reducedMotion.matches ? "smooth" : "auto"
      });

      if (focus) {
        card.focus({ preventScroll: true });
      }
    }

    planets.forEach((planet, index) => {
      // Закрытая точка доступна для просмотра на карте,
      // но её содержимое остаётся закрытым.
      const card = create(
        "button",
        `planet${planet.unlocked ? "" : " is-locked"}`
      );

      card.type = "button";
      card.style.setProperty("--planet-color", planet.color || "#8871d4");
      card.style.setProperty("--float-delay", `${index * -1.8}s`);
      card.setAttribute("aria-controls", "planet-detail");
      card.setAttribute("aria-pressed", "false");

      const displayName = planet.unlocked
        ? planet.name || "Без названия"
        : "Неизвестный мир";

      card.setAttribute(
        "aria-label",
        `Точка ${index + 1}. ${displayName}. ` +
        (planet.unlocked ? "Досье открыто." : "Досье закрыто.")
      );

      const orbit = create("span", "planet-orbit");
      orbit.setAttribute("aria-hidden", "true");

      const orb = create(
        "span",
        "planet-orb",
        planet.unlocked ? "" : "?"
      );

      orbit.append(orb);

      if (planet.current) {
        orbit.append(create("span", "route-ship-marker", "✦"));
      }

      card.append(
        create("span", "planet-number", `ТОЧКА ${number(index + 1)}`),
        orbit,
        create("span", "planet-name", displayName),
        create(
          "span",
          "planet-state",
          planet.current
            ? "✦ Корабль здесь"
            : planet.unlocked
              ? "Досье открыто"
              : "Данные зашифрованы"
        )
      );

      card.addEventListener("click", () => moveTo(index));

      cards.push(card);
      list.append(card);
    });

    // Выбираем ближайшую к центру планету при ручной прокрутке.
    let scrollFrame = 0;

    function updateFromScroll() {
      scrollFrame = 0;

      const viewportRect = list.getBoundingClientRect();
      const center = viewportRect.left + list.clientWidth / 2;

      let nearestIndex = 0;
      let nearestDistance = Infinity;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      activate(nearestIndex);
    }

    list.addEventListener("scroll", () => {
      if (!scrollFrame) {
        scrollFrame = requestAnimationFrame(updateFromScroll);
      }
    }, { passive: true });

    previous.addEventListener("click", () => moveTo(activeIndex - 1));
    next.addEventListener("click", () => moveTo(activeIndex + 1));

    list.addEventListener("keydown", event => {
      let target;

      switch (event.key) {
        case "ArrowRight":
          target = activeIndex + 1;
          break;
        case "ArrowLeft":
          target = activeIndex - 1;
          break;
        case "Home":
          target = 0;
          break;
        case "End":
          target = cards.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      moveTo(target, true);
    });

    const initialIndex = Math.max(
      0,
      planets.findIndex(planet => planet.current)
    );

    activate(initialIndex);

    requestAnimationFrame(() => {
      moveTo(initialIndex, false, false);
    });

    window.addEventListener("resize", () => {
      moveTo(activeIndex, false, false);
    });
  }

  function renderCrew() {
    const tabList = document.getElementById("crew-tabs");
    const panelsRoot = document.getElementById("crew-panels");

    if (!tabList || !panelsRoot) return;

    if (!data.crew.length) {
      tabList.hidden = true;
      panelsRoot.append(
        create("p", "muted", "Досье экипажа пока не добавлены.")
      );
      return;
    }

    const tabs = [];
    const panels = [];

    function activate(index, moveFocus = false) {
      tabs.forEach((tab, tabIndex) => {
        const active = index === tabIndex;

        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[tabIndex].hidden = !active;
      });

      if (moveFocus) tabs[index].focus();
    }

    data.crew.forEach((person, index) => {
      const tabId = `tab-${person.id}`;
      const panelId = `panel-${person.id}`;

      const tab = create("button", "crew-tab", person.name);
      tab.id = tabId;
      tab.type = "button";
      tab.tabIndex = -1;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", "false");
      tab.setAttribute("aria-controls", panelId);
      tab.append(create("span", "", person.role));

      const panel = create("section", "panel person-panel");
      panel.id = panelId;
      panel.hidden = true;
      panel.tabIndex = 0;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);

      const sidebar = create("div", "person-sidebar");
      const portrait = create("div", "portrait");

      const initials = create(
        "span",
        "initials",
        person.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("")
      );
      initials.setAttribute("aria-hidden", "true");

      portrait.append(initials);

      if (person.photo) {
        const image = create("img");

        image.alt = `Иллюстративный портрет: ${person.name}`;
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", () => {
          image.hidden = true;
        });

        image.src = person.photo;
        portrait.append(image);
      }

      sidebar.append(
        portrait,
        create("p", "portrait-caption", `${person.callsign} / ЛИЧНЫЙ АРХИВ`)
      );

      if (person.quote) {
        sidebar.append(
          create("blockquote", "crew-quote", `«${person.quote}»`)
        );
      }

      const info = create("div", "person-info");

      const status = create("span", "status");
      const dot = create("i");
      dot.setAttribute("aria-hidden", "true");

      status.append(dot, document.createTextNode(person.status));

      info.append(
        create(
          "p",
          "eyebrow",
          `Досье ${number(index + 1)} / ${person.role}`
        ),
        create("h2", "", person.name),
        status,
        create("p", "muted person-bio", person.bio)
      );

      const facts = create("dl", "person-facts");

      [
        ["Возраст", person.age],
        ["Родной мир", person.origin],
        ["Позывной", person.callsign],
        ["На борту AURORA", person.service]
      ].forEach(([label, value]) => {
        if (!value) return;

        const item = create("div");
        item.append(create("dt", "", label), create("dd", "", value));
        facts.append(item);
      });

      info.append(facts);

      if (person.history) {
        info.append(textSection("До экспедиции", person.history));
      }

      const dossierGrid = create("div", "dossier-grid");

      if (person.personality) {
        dossierGrid.append(textSection("Характер", person.personality));
      }

      if (person.motivation) {
        dossierGrid.append(textSection("Личная цель", person.motivation));
      }

      info.append(dossierGrid);

      const skills = create("div", "skills");

      (person.skills || []).forEach(skill => {
        skills.append(create("span", "skill", skill));
      });

      info.append(
        create("p", "eyebrow", "Специализация"),
        skills
      );

      if (person.relationships?.length) {
        const relationships = create("details", "archive-entry");
        const relationList = create("ul", "relationships-list");

        person.relationships.forEach(relation => {
          relationList.append(create("li", "", relation));
        });

        relationships.append(
          create("summary", "", "Связи внутри экипажа"),
          relationList
        );

        info.append(relationships);
      }

      if (person.log) {
        const log = create("details", "archive-entry personal-log");

        log.append(
          create("summary", "", "Открыть личную запись"),
          create("p", "", person.log)
        );

        info.append(log);
      }

      panel.append(sidebar, info);
      tabList.append(tab);
      panelsRoot.append(panel);

      tabs.push(tab);
      panels.push(panel);

      tab.addEventListener("click", () => activate(index));

      tab.addEventListener("keydown", event => {
        let nextIndex;

        switch (event.key) {
          case "ArrowRight":
            nextIndex = (index + 1) % data.crew.length;
            break;
          case "ArrowLeft":
            nextIndex = (index - 1 + data.crew.length) % data.crew.length;
            break;
          case "Home":
            nextIndex = 0;
            break;
          case "End":
            nextIndex = data.crew.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();
        activate(nextIndex, true);
      });
    });

    activate(0);
  }

  const crewCount = document.getElementById("crew-count");

  if (crewCount) {
    crewCount.textContent = `${data.crew.length} чел.`;
  }

  renderRoute();
  renderCrew();
})();
