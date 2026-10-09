/** Illustrative dimension readings for the static mockups. Not live catalog data. */

const DIMENSIONS = [
  ["gameplay", "Gameplay"],
  ["story", "Story"],
  ["music", "Music"],
  ["art-direction", "Art direction"],
  ["technical-quality", "Technical quality"],
  ["performance", "Performance"],
  ["controls", "Controls"],
  ["atmosphere", "Atmosphere"],
  ["game-design", "Game Design"],
];

/** [positive, mixed, negative] */
const works = [
  {
    slug: "baldurs-gate-3",
    title: "Baldur’s Gate 3",
    creators: "Larian Studios",
    year: 2023,
    audience: {
      sample: 88,
      enjoyment: [72, 12, 4],
      execution: [50, 24, 14],
      dimensions: {
        gameplay: [48, 18, 8],
        story: [70, 8, 4],
        music: [50, 16, 6],
        "art-direction": [44, 20, 8],
        "technical-quality": [12, 16, 36],
        performance: [10, 12, 30],
        controls: [30, 22, 16],
        atmosphere: [58, 12, 4],
        "game-design": [40, 22, 10],
      },
    },
    critics: {
      sample: 16,
      enjoyment: [13, 2, 1],
      execution: [9, 5, 2],
      dimensions: {
        gameplay: [10, 4, 2],
        story: [14, 1, 1],
        music: [11, 3, 1],
        "art-direction": [9, 4, 2],
        "technical-quality": [2, 4, 10],
        performance: [2, 3, 8],
        controls: [6, 5, 4],
        atmosphere: [12, 3, 1],
        "game-design": [9, 4, 2],
      },
    },
  },
  {
    slug: "celeste",
    title: "Celeste",
    creators: "Maddy Makes Games",
    year: 2018,
    audience: {
      sample: 48,
      enjoyment: [42, 4, 2],
      execution: [40, 6, 2],
      dimensions: {
        gameplay: [44, 2, 1],
        story: [30, 10, 3],
        music: [40, 4, 1],
        "art-direction": [34, 6, 2],
        "technical-quality": [22, 6, 2],
        performance: [8, 1, 0],
        controls: [40, 4, 2],
        atmosphere: [28, 8, 3],
        "game-design": [42, 3, 1],
      },
    },
    critics: {
      sample: 9,
      enjoyment: [8, 1, 0],
      execution: [7, 2, 0],
      dimensions: {
        gameplay: [8, 1, 0],
        story: [6, 2, 0],
        music: [7, 1, 0],
        "art-direction": [6, 1, 1],
        "technical-quality": [4, 2, 0],
        performance: [2, 1, 0],
        controls: [7, 1, 0],
        atmosphere: [5, 2, 1],
        "game-design": [8, 0, 0],
      },
    },
  },
  {
    slug: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    creators: "CD Projekt Red",
    year: 2020,
    audience: {
      sample: 86,
      enjoyment: [52, 22, 12],
      execution: [14, 24, 48],
      dimensions: {
        gameplay: [28, 24, 18],
        story: [48, 14, 8],
        music: [44, 12, 6],
        "art-direction": [50, 10, 4],
        "technical-quality": [8, 14, 40],
        performance: [6, 10, 36],
        controls: [18, 22, 20],
        atmosphere: [46, 12, 6],
        "game-design": [22, 26, 16],
      },
    },
    critics: {
      sample: 16,
      enjoyment: [7, 5, 4],
      execution: [2, 4, 10],
      dimensions: {
        gameplay: [5, 6, 5],
        story: [11, 3, 2],
        music: [10, 4, 1],
        "art-direction": [13, 2, 1],
        "technical-quality": [1, 3, 12],
        performance: [1, 2, 11],
        controls: [4, 6, 5],
        atmosphere: [12, 3, 1],
        "game-design": [4, 7, 4],
      },
    },
  },
  {
    slug: "death-stranding",
    title: "Death Stranding",
    creators: "Kojima Productions",
    year: 2019,
    audience: {
      sample: 62,
      enjoyment: [40, 14, 8],
      execution: [18, 28, 16],
      dimensions: {
        gameplay: [22, 24, 16],
        story: [34, 18, 8],
        music: [48, 8, 2],
        "art-direction": [44, 10, 4],
        "technical-quality": [18, 16, 14],
        performance: [10, 12, 8],
        controls: [16, 20, 18],
        atmosphere: [52, 6, 2],
        "game-design": [20, 22, 14],
      },
    },
    critics: {
      sample: 14,
      enjoyment: [9, 3, 2],
      execution: [4, 6, 4],
      dimensions: {
        gameplay: [4, 6, 4],
        story: [9, 3, 2],
        music: [12, 1, 1],
        "art-direction": [11, 2, 1],
        "technical-quality": [5, 5, 3],
        performance: [3, 4, 2],
        controls: [3, 6, 4],
        atmosphere: [13, 1, 0],
        "game-design": [4, 7, 3],
      },
    },
  },
  {
    slug: "elden-ring",
    title: "Elden Ring",
    creators: "FromSoftware",
    year: 2022,
    audience: {
      sample: 90,
      enjoyment: [68, 14, 8],
      execution: [52, 24, 14],
      dimensions: {
        gameplay: [58, 10, 6],
        story: [22, 28, 18],
        music: [40, 16, 6],
        "art-direction": [64, 6, 2],
        "technical-quality": [24, 20, 18],
        performance: [12, 14, 28],
        controls: [36, 18, 12],
        atmosphere: [60, 8, 4],
        "game-design": [52, 14, 8],
      },
    },
    critics: {
      sample: 17,
      enjoyment: [14, 2, 1],
      execution: [11, 4, 2],
      dimensions: {
        gameplay: [14, 2, 1],
        story: [4, 8, 3],
        music: [10, 4, 1],
        "art-direction": [15, 1, 1],
        "technical-quality": [6, 5, 4],
        performance: [3, 4, 8],
        controls: [8, 5, 3],
        atmosphere: [14, 2, 1],
        "game-design": [11, 4, 2],
      },
    },
  },
  {
    slug: "hades",
    title: "Hades",
    creators: "Supergiant Games",
    year: 2020,
    audience: {
      sample: 82,
      enjoyment: [70, 8, 4],
      execution: [64, 12, 6],
      dimensions: {
        gameplay: [68, 8, 4],
        story: [60, 12, 4],
        music: [66, 6, 2],
        "art-direction": [62, 8, 2],
        "technical-quality": [36, 18, 8],
        performance: [20, 10, 6],
        controls: [56, 12, 6],
        atmosphere: [58, 12, 4],
        "game-design": [64, 10, 4],
      },
    },
    critics: {
      sample: 15,
      enjoyment: [13, 2, 0],
      execution: [12, 2, 1],
      dimensions: {
        gameplay: [13, 1, 1],
        story: [12, 2, 1],
        music: [14, 1, 0],
        "art-direction": [13, 2, 0],
        "technical-quality": [8, 4, 2],
        performance: [5, 3, 1],
        controls: [12, 2, 1],
        atmosphere: [11, 3, 1],
        "game-design": [13, 1, 1],
      },
    },
  },
];

function dominantKey(positive, mixed, negative) {
  const entries = [
    ["positive", positive],
    ["mixed", mixed],
    ["negative", negative],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] === entries[1][1]) return null;
  return entries[0][0];
}

function distributionLabel(positive, mixed, negative) {
  const count = positive + mixed + negative;
  if (count === 0) return "No evaluations";
  const dominant = dominantKey(positive, mixed, negative);
  if (!dominant) return count < 4 ? `Divided · ${count} so far` : "Divided";
  const share = { positive, mixed, negative }[dominant] / count;
  const word = dominant === "positive" ? "positive" : dominant === "mixed" ? "mixed" : "negative";
  if (count < 4) {
    const titled = word.charAt(0).toUpperCase() + word.slice(1);
    return `${titled} · ${count} so far`;
  }
  if (share >= 0.75) return `Mostly ${word}`;
  if (share >= 0.5) return `Leaning ${word}`;
  return "Divided";
}

function percentages(positive, mixed, negative) {
  const count = positive + mixed + negative;
  if (count === 0) return { positive: 0, mixed: 0, negative: 0 };
  const raw = [
    { key: "positive", value: (positive / count) * 100 },
    { key: "mixed", value: (mixed / count) * 100 },
    { key: "negative", value: (negative / count) * 100 },
  ];
  const floors = raw.map((item) => ({ ...item, floor: Math.floor(item.value), fraction: item.value % 1 }));
  let remainder = 100 - floors.reduce((sum, item) => sum + item.floor, 0);
  floors.sort((a, b) => b.fraction - a.fraction);
  const awarded = new Map();
  for (const item of floors) {
    const extra = remainder > 0 ? 1 : 0;
    if (extra) remainder -= 1;
    awarded.set(item.key, item.floor + extra);
  }
  return {
    positive: awarded.get("positive") ?? 0,
    mixed: awarded.get("mixed") ?? 0,
    negative: awarded.get("negative") ?? 0,
  };
}

function describe(triple) {
  const [positive, mixed, negative] = triple;
  const count = positive + mixed + negative;
  const label = distributionLabel(positive, mixed, negative);
  const dominant = dominantKey(positive, mixed, negative);
  const share = count === 0 || !dominant ? 0 : { positive, mixed, negative }[dominant] / count;
  let tone = "divided";
  if (count === 0) tone = "empty";
  else if (count < 4) tone = "early";
  else if (!dominant || share < 0.5) tone = "divided";
  else if (share >= 0.75) tone = `mostly-${dominant}`;
  else tone = `leaning-${dominant}`;
  return {
    positive,
    mixed,
    negative,
    count,
    label,
    tone,
    positiveShare: count === 0 ? 0 : positive / count,
    dominantCount: dominant ? { positive, mixed, negative }[dominant] : 0,
  };
}

function workBySlug(slug) {
  return works.find((work) => work.slug === slug);
}

function populationsFor(mode) {
  if (mode === "critics") return ["critics"];
  if (mode === "audience") return ["audience"];
  return ["audience", "critics"];
}

function countPhrase(reading, unit) {
  if (reading.count === 0) return unit === "outlet" ? "0 outlets" : "0 judgments";
  if (reading.count === 1) return unit === "outlet" ? "1 outlet" : "1 judgment";
  return unit === "outlet" ? `${reading.count} outlets` : `${reading.count} judgments`;
}

function cellCount(reading, unit) {
  if (reading.tone === "early" || reading.tone === "divided" || reading.tone === "empty") {
    return countPhrase(reading, unit);
  }
  return `${reading.dominantCount} of ${reading.count}`;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== null && value !== undefined) node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function polar(cx, cy, radius, index, total, value) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: cx + Math.cos(angle) * radius * value,
    y: cy + Math.sin(angle) * radius * value,
    angle,
  };
}

function toneColor(tone) {
  if (tone.includes("positive")) return "var(--positive)";
  if (tone.includes("mixed")) return "var(--caution)";
  if (tone.includes("negative")) return "var(--negative)";
  if (tone === "early") return "var(--text-muted)";
  return "var(--border-strong)";
}

function renderRadar(container, work, mode, activeSlug, onPick) {
  container.replaceChildren();
  const width = 720;
  const height = 680;
  const cx = 360;
  const cy = 328;
  const radius = 188;
  const keys = populationsFor(mode);
  const svg = svgEl("svg", {
    class: "radar-svg",
    viewBox: `0 0 ${width} ${height}`,
    role: "group",
    "aria-label": `${work.title} dimension chart. Distance from the center is the share of positive judgments.`,
  });

  for (const tick of [0.25, 0.5, 0.75, 1]) {
    const ring = svgEl("circle", {
      cx,
      cy,
      r: radius * tick,
      fill: "none",
      stroke: "var(--border)",
      "stroke-width": tick === 1 ? 1.25 : 1,
    });
    svg.append(ring);
    if (tick < 1) {
      const label = svgEl("text", {
        x: cx + 8,
        y: cy - radius * tick + 4,
        class: "ring-label",
      });
      label.textContent = `${tick * 100}%`;
      svg.append(label);
    }
  }

  DIMENSIONS.forEach(([, name], index) => {
    const end = polar(cx, cy, radius, index, DIMENSIONS.length, 1);
    svg.append(
      svgEl("line", {
        x1: cx,
        y1: cy,
        x2: end.x,
        y2: end.y,
        stroke: "var(--border)",
        "stroke-width": DIMENSIONS[index][0] === activeSlug ? 1.5 : 1,
      }),
    );
    const labelAt = polar(cx, cy, radius + 58, index, DIMENSIONS.length, 1);
    const cos = Math.cos(labelAt.angle);
    const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
    const text = svgEl("text", {
      x: labelAt.x,
      y: labelAt.y,
      "text-anchor": anchor,
      "dominant-baseline": "middle",
      class: `spoke-label${DIMENSIONS[index][0] === activeSlug ? " is-active" : ""}`,
    });
    text.textContent = name;
    svg.append(text);
  });

  const drawOrder = ["critics", "audience"].filter((key) => keys.includes(key));
  for (const key of drawOrder) {
    const points = DIMENSIONS.map(([slug], index) => {
      const reading = describe(work[key].dimensions[slug]);
      return polar(cx, cy, radius, index, DIMENSIONS.length, reading.positiveShare);
    });
    const polygon = svgEl("polygon", {
      points: points.map((point) => `${point.x},${point.y}`).join(" "),
      "stroke-width": key === "audience" ? "2.25" : "1.75",
      "stroke-dasharray": key === "critics" ? "5 4" : "0",
      "stroke-linejoin": "round",
    });
    polygon.style.fill = key === "audience" ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "none";
    polygon.style.stroke = key === "audience" ? "var(--accent)" : "var(--text)";
    svg.append(polygon);
  }

  for (const key of drawOrder) {
    DIMENSIONS.forEach(([slug], index) => {
      const reading = describe(work[key].dimensions[slug]);
      const point = polar(cx, cy, radius, index, DIMENSIONS.length, reading.positiveShare);
      const dot = svgEl("circle", {
        cx: point.x,
        cy: point.y,
        r: key === "critics" && keys.length > 1 ? 7 : 5.5,
        "stroke-width": "2.5",
        tabindex: key === drawOrder[drawOrder.length - 1] ? "0" : "-1",
        role: "button",
        "aria-label": `${nameOf(slug)}, ${key}: ${reading.label}, ${reading.positive} positive, ${reading.mixed} mixed, ${reading.negative} negative`,
        "aria-pressed": slug === activeSlug ? "true" : "false",
      });
      dot.style.fill = key === "critics" && keys.length > 1 ? "var(--surface)" : toneColor(reading.tone);
      dot.style.stroke = toneColor(reading.tone);
      dot.addEventListener("click", () => onPick(slug));
      dot.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPick(slug);
        }
      });
      svg.append(dot);
    });
  }

  container.append(svg);
}

function nameOf(slug) {
  return DIMENSIONS.find(([key]) => key === slug)?.[1] ?? slug;
}

function bar(reading) {
  const pct = percentages(reading.positive, reading.mixed, reading.negative);
  const track = el("div", {
    class: "dist-bar",
    role: "img",
    "aria-label": `${reading.label}. Positive ${pct.positive}%, mixed ${pct.mixed}%, negative ${pct.negative}%.`,
  });
  if (reading.count > 0) {
    track.append(el("i", { class: "dist-positive", style: `width:${pct.positive}%` }));
    track.append(el("i", { class: "dist-mixed", style: `width:${pct.mixed}%` }));
    track.append(el("i", { class: "dist-negative", style: `width:${pct.negative}%` }));
  }
  return track;
}

function trackBlock(name, triple, unit) {
  const reading = describe(triple);
  const pct = percentages(reading.positive, reading.mixed, reading.negative);
  const wrap = el("div", { class: "paired-track" });
  wrap.append(el("span", { class: "track-label", text: name }));
  const body = el("div");
  body.append(bar(reading));
  const head = el("div", { class: "dist-head" });
  head.append(el("p", { class: "dist-caption", text: `${reading.label} · ${countPhrase(reading, unit)}` }));
  head.append(el("p", { class: "meta", text: `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%` }));
  body.append(head);
  wrap.append(body);
  return wrap;
}

function renderSummary(container, work, mode) {
  container.replaceChildren();
  const stack = el("div", { class: "summary-stack" });
  for (const [key, title] of [
    ["enjoyment", "Enjoyment"],
    ["execution", "Execution"],
  ]) {
    const block = el("div");
    block.append(el("h3", { text: title }));
    if (mode !== "critics") block.append(trackBlock("Audience", work.audience[key], "judgment"));
    if (mode !== "audience") block.append(trackBlock("Critics", work.critics[key], "outlet"));
    stack.append(block);
  }
  const reading = el("p", { class: "reading", text: workBlurb(work, mode) });
  stack.append(reading);
  container.append(stack);
}

function workBlurb(work, mode) {
  if (work.slug !== "cyberpunk-2077") return "";
  if (mode === "both") {
    return "Audience enjoyment leans positive while execution leans negative. Critics are divided on enjoyment, and their execution leans negative. Art direction is mostly positive in both groups. Technical quality leans negative for the audience and is mostly negative for critics.";
  }
  if (mode === "audience") {
    return "Enjoyment leans positive (52 of 86). Execution leans negative (48 of 86). Art direction is mostly positive. Technical quality and performance lean negative. Gameplay, controls, and Game Design are divided.";
  }
  return "Enjoyment is divided across 16 critic evaluations. Execution leans negative. Art direction and atmosphere are mostly positive. Technical quality and performance are mostly negative.";
}

function renderDimensionList(container, work, mode, activeSlug, onPick) {
  container.replaceChildren();
  const list = el("div", { class: "dim-list" });
  for (const [slug, name] of DIMENSIONS) {
    const row = el("div", { class: `dim-row${slug === activeSlug ? " is-active" : ""}` });
    const button = el("button", {
      type: "button",
      "aria-pressed": slug === activeSlug ? "true" : "false",
      onClick: () => onPick(slug),
    });
    button.append(el("strong", { text: name }));
    const audience = describe(work.audience.dimensions[slug]);
    const critics = describe(work.critics.dimensions[slug]);
    const summary =
      mode === "audience"
        ? audience.label
        : mode === "critics"
          ? critics.label
          : `Audience ${audience.label.toLowerCase()} · Critics ${critics.label.toLowerCase()}`;
    button.append(el("span", { class: "meta", text: summary }));
    row.append(button);
    if (mode !== "critics") row.append(trackBlock("Audience", work.audience.dimensions[slug], "judgment"));
    if (mode !== "audience") row.append(trackBlock("Critics", work.critics.dimensions[slug], "outlet"));
    list.append(row);
  }
  container.append(list);
}

function legend(mode) {
  const row = el("div", { class: "legend" });
  const items = [
    ["swatch swatch-line", "Audience · share of positive judgments"],
    ["swatch", "Positive reading", "var(--positive)"],
    ["swatch", "Mixed reading", "var(--caution)"],
    ["swatch", "Negative reading", "var(--negative)"],
    ["swatch", "Divided, or fewer than 4", "var(--border-strong)"],
  ];
  if (mode !== "audience") items.splice(1, 0, ["swatch swatch-line swatch-dashed", "Critics · share of positive judgments"]);
  if (mode === "critics") items.shift();
  for (const [className, text, color] of items) {
    const item = el("span");
    const swatch = el("i", { class: className });
    if (color) swatch.style.background = color;
    item.append(swatch, text);
    row.append(item);
  }
  return row;
}

function renderHeatmap(container, { mode, slugs, dimensions, compact, active, onPick }) {
  container.replaceChildren();
  const selected = slugs.map(workBySlug);
  const unit = mode === "critics" ? "outlet" : "judgment";
  const table = el("table", { class: "heat" });
  const caption = el("caption", {
      text:
        mode === "critics"
          ? "Critic readings. Fewer than 4 outlets stay in plain type. Games are alphabetical."
          : "Audience readings. Games are alphabetical. Position is not a rank.",
  });
  table.append(caption);
  const head = el("thead");
  const headRow = el("tr");
  headRow.append(el("th", { scope: "col", text: compact ? "" : "Work" }));
  const dims = dimensions ?? DIMENSIONS;
  for (const [, name] of dims) headRow.append(el("th", { scope: "col", text: name }));
  head.append(headRow);
  table.append(head);
  const body = el("tbody");
  for (const work of selected) {
    const row = el("tr");
    row.append(el("th", { class: "work-name", scope: "row", text: work.title }));
    const group = work[mode];
    for (const [slug, name] of dims) {
      const reading = describe(group.dimensions[slug]);
      const td = el("td");
      const pressed = active && active.slug === work.slug && active.dimension === slug;
      const button = el("button", {
        type: "button",
        class: `cell cell-${reading.tone}${pressed ? " is-active" : ""}`,
        "aria-pressed": pressed ? "true" : "false",
        "aria-label": `${work.title}, ${name}, ${mode}: ${reading.label}. ${reading.positive} positive, ${reading.mixed} mixed, ${reading.negative} negative.`,
        onClick: () => onPick?.({ slug: work.slug, dimension: slug, mode }),
      });
      button.append(el("span", { class: "cell-label", text: reading.label }));
      button.append(el("span", { class: "cell-count", text: cellCount(reading, unit) }));
      td.append(button);
      row.append(td);
    }
    body.append(row);
  }
  table.append(body);
  const wrap = el("div", { class: compact ? "heat-wrap crop" : "heat-wrap" });
  wrap.append(table);
  container.append(wrap);
}

function detailLine(work, dimension, mode) {
  const name = nameOf(dimension);
  const parts = populationsFor(mode).map((key) => {
    const reading = describe(work[key].dimensions[dimension]);
    const who = key === "audience" ? "Audience" : "Critics";
    return `${who}: ${reading.label.toLowerCase()} (${reading.positive} positive, ${reading.mixed} mixed, ${reading.negative} negative).`;
  });
  return `${work.title} · ${name}. ${parts.join(" ")}`;
}

function bindModeToggle() {
  const button = document.getElementById("mode-toggle");
  if (!button) return;
  const sync = () => {
    const mode = document.documentElement.dataset.mode;
    const dark = mode ? mode === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    button.textContent = dark ? "Use light colors" : "Use dark colors";
    button.setAttribute("aria-pressed", dark ? "true" : "false");
  };
  button.addEventListener("click", () => {
    const mode = document.documentElement.dataset.mode;
    const dark = mode ? mode === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.mode = dark ? "light" : "dark";
    sync();
  });
  sync();
}

function bindPopulation(onChange) {
  const group = document.querySelector("[data-population]");
  if (!group) return;
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;
    for (const item of group.querySelectorAll("button")) item.setAttribute("aria-checked", item === button ? "true" : "false");
    onChange(button.dataset.value);
  });
}

function initWork() {
  const work = workBySlug("cyberpunk-2077");
  const card = document.getElementById("share-card");
  const stage = document.getElementById("work-stage");
  const list = document.getElementById("dimension-list");
  let mode = "both";
  let active = "technical-quality";

  const paintCard = () => {
    card.replaceChildren();
    const frame = el("article", { class: "share-card" });
    const header = el("header");
    const mark = el("p", { class: "wordmark", text: "FRAME" });
    mark.append(el("small", { text: "Evaluations, not scores" }));
    header.append(mark, el("p", { class: "meta", text: "Audience · 86 evaluations" }));
    frame.append(header);
    frame.append(el("h2", { class: "work-title", text: work.title }));
    frame.append(el("p", { class: "meta", text: `${work.creators} · ${work.year}` }));
    const chart = el("div");
    renderRadar(chart, work, "audience", active, (slug) => {
      active = slug;
      paint();
    });
    frame.append(chart);
    frame.append(legend("audience"));
    frame.append(
      el("p", {
        class: "reading",
        text: "Art direction is mostly positive (50 of 64). Technical quality leans negative (40 of 62). Enjoyment leans positive. Execution leans negative. Those last two are not on the chart.",
      }),
    );
    frame.append(
      el("p", {
        class: "fine",
        text: "Distance from the center is the share of positive judgments among people who judged that dimension. Dot color is the stance reading. A divided dimension can still sit away from the center. Illustrative counts.",
      }),
    );
    card.append(frame);
  };

  const paint = () => {
    paintCard();
    const chart = el("div");
    renderRadar(chart, work, mode, active, (slug) => {
      active = slug;
      paint();
    });
    const summary = el("div", { class: "panel" });
    renderSummary(summary, work, mode);
    stage.replaceChildren(chart, summary);
    document.getElementById("radar-legend").replaceChildren(legend(mode));
    renderDimensionList(list, work, mode, active, (slug) => {
      active = slug;
      paint();
    });
  };

  bindPopulation((next) => {
    mode = next;
    paint();
  });
  paint();
}

const CROP_DIMENSIONS = DIMENSIONS.filter(([slug]) =>
  ["gameplay", "story", "art-direction", "atmosphere", "technical-quality"].includes(slug),
);

function initCompare() {
  const card = document.getElementById("share-card");
  const stage = document.getElementById("heat-stage");
  const detail = document.getElementById("heat-detail");
  let mode = "audience";
  let active = { slug: "cyberpunk-2077", dimension: "technical-quality" };

  const paintCard = () => {
    card.replaceChildren();
    const frame = el("article", { class: "share-card crop" });
    const header = el("header");
    const mark = el("p", { class: "wordmark", text: "FRAME" });
    mark.append(el("small", { text: "Evaluations, not scores" }));
    header.append(mark, el("p", { class: "meta", text: "Audience crop" }));
    frame.append(header);
    frame.append(el("h2", { text: "Three games, five dimensions" }));
    frame.append(
      el("p", {
        class: "reading",
        text: "Hades leans positive on technical quality. Death Stranding is divided there. Cyberpunk 2077 leans negative. Art direction is mostly positive for all three.",
      }),
    );
    const mount = el("div");
    renderHeatmap(mount, {
      mode: "audience",
      slugs: ["cyberpunk-2077", "death-stranding", "hades"],
      dimensions: CROP_DIMENSIONS,
      compact: true,
      active,
      onPick: (next) => {
        active = { slug: next.slug, dimension: next.dimension };
        paint();
      },
    });
    frame.append(mount);
    frame.append(
      el("p", {
        class: "fine",
        text: "Each cell is the stance reading for that dimension, plus how many of the judgments went to the leading stance. Divided cells stay neutral. Illustrative counts. Alphabetical, not a ranking.",
      }),
    );
    card.append(frame);
  };

  const paint = () => {
    paintCard();
    renderHeatmap(stage, {
      mode,
      slugs: works.map((work) => work.slug),
      compact: false,
      active,
      onPick: (next) => {
        active = next;
        paint();
      },
    });
    const work = workBySlug(active.slug);
    detail.textContent = detailLine(work, active.dimension, mode);
  };

  bindPopulation((next) => {
    mode = next;
    paint();
  });
  paint();
}

function init() {
  bindModeToggle();
  const page = document.body.dataset.page;
  if (page === "work") initWork();
  if (page === "compare") initCompare();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { distributionLabel, describe, works, DIMENSIONS, percentages };
}
