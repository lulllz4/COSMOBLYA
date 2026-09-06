(() => {
  const data = universeData;

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderRoute() {
    const list = document.getElementById("planet-list");
    const detail = document.getElementById("planet-detail");
    const count = document.getElementById("route-count");

    if (!list || !detail) return;

    const opened = data.planets.filter(planet => planet.unlocked);
    count.textContent = `Открыто: ${opened.length} / ${data.planets.length}`;

    const buttons = new Map();

    function selectPlanet(planet) {
      if (!planet.unlocked) return;

      buttons.forEach((button, id) => {
        if (!button.disabled) {
          button.setAttribute("aria-pressed", String(id === planet.id));
        }
      });

      const heading = create("div");
      heading.append(
        create("p", "eyebrow", "Доступна для исследования"),
        create("h3", "", planet.name),
        create("span", "badge", planet.coordinates)
      );

      const body = create("div");
      const facts = create("div", "planet-facts");

      [
        planet.type,
        `Атмосфера: ${planet.atmosphere}`,
        `Гравитация: ${planet.gravity}`
      ].forEach(fact => {
        facts.append(create("span", "badge", fact));
      });

      body.append(
        facts,
        create("p", "planet-description", planet.description),
        create("p", "mission", `Текущая задача → ${planet.mission}`)
      );

      detail.replaceChildren(heading, body);
    }

    data.planets.forEach((planet, index) => {
      const button = create("button", "planet");
      button.type = "button";
      button.disabled = !planet.unlocked;
      button.style.setProperty("--planet-color", planet.color);

      if (planet.unlocked) {
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-controls", "planet-detail");
      }

      const orb = create("span", "planet-orb");
      orb.setAttribute("aria-hidden", "true");

      button.append(
        create("span", "planet-number", `ТОЧКА ${String(index + 1).padStart(2, "0")}`),
        orb,
        create("span", "planet-name", planet.name),
        create(
          "span",
          "planet-state",
          planet.unlocked ? "● Исследование доступно" : "Закрыта · нет доступа"
        )
      );

      button.addEventListener("click", () => selectPlanet(planet));
      buttons.set(planet.id, button);
      list.append(button);
    });

    if (opened.length) {
      selectPlanet(opened[0]);
    } else {
      detail.append(
        create("p", "muted", "Маршрут ещё не открыт. Ожидается получение координат.")
      );
    }
  }

  function renderCrew() {
    const tabList = document.getElementById("crew-tabs");
    const panelsRoot = document.getElementById("crew-panels");

    if (!tabList || !panelsRoot) return;

    if (!data.crew.length) {
      panelsRoot.append(
        create("p", "muted", "Досье экипажа пока не добавлены.")
      );
      tabList.hidden = true;
      return;
    }

    const tabs = [];
    const panels = [];

    function activate(index, moveFocus = false) {
      tabs.forEach((tab, tabIndex) => {
        const active = tabIndex === index;
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
      tab.type = "button";
      tab.id = tabId;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panelId);
      tab.setAttribute("aria-selected", "false");
      tab.tabIndex = -1;
      tab.append(create("span", "", person.role));

      const panel = create("section", "panel person-panel");
      panel.id = panelId;
      panel.hidden = true;
      panel.tabIndex = 0;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);

      const portrait = create("div", "portrait");
      const initials = create(
        "span",
        "initials",
        person.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("")
      );
      initials.setAttribute("aria-hidden", "true");

      const image = create("img");
      image.alt = `Иллюстративный портрет: ${person.name}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        image.hidden = true;
      });
      image.src = person.photo;

      portrait.append(initials, image);

      const info = create("div", "person-info");
      const status = create("span", "status");
      const dot = create("i");
      dot.setAttribute("aria-hidden", "true");
      status.append(dot, document.createTextNode(person.status));

      const facts = create("dl", "person-facts");

      [
        ["Возраст", person.age],
        ["Родной мир", person.origin],
        ["Позывной", person.callsign]
      ].forEach(([label, value]) => {
        const item = create("div");
        item.append(create("dt", "", label), create("dd", "", value));
        facts.append(item);
      });

      const skills = create("div", "skills");
      person.skills.forEach(skill => {
        skills.append(create("span", "skill", skill));
      });

      info.append(
        create("p", "eyebrow", `Досье ${String(index + 1).padStart(2, "0")} / ${person.role}`),
        create("h2", "", person.name),
        status,
        create("p", "muted", person.bio),
        facts,
        create("p", "eyebrow", "Специализация"),
        skills
      );

      panel.append(portrait, info);
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
