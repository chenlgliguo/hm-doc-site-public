const markdownPath = "../management_evaluation_indicators_pro_v3_2.md";

const contentEl = document.querySelector("#content");
const tocEl = document.querySelector("#toc");
const pageTitleEl = document.querySelector("#page-title");
const pageSummaryEl = document.querySelector("#page-summary");
const metaChipsEl = document.querySelector("#meta-chips");
const summaryCardsEl = document.querySelector("#summary-cards");
const statusEl = document.querySelector("#render-status");
const searchInputEl = document.querySelector("#toc-search");
const searchStatusEl = document.querySelector("#toc-search-status");
const contentSearchInputEl = document.querySelector("#content-search");
const contentSearchStatusEl = document.querySelector("#content-search-status");
const matchOnlyToggleEl = document.querySelector("#match-only-toggle");
const prevResultBtnEl = document.querySelector("#prev-result");
const nextResultBtnEl = document.querySelector("#next-result");
const expandAllBtnEl = document.querySelector("#expand-all");
const collapseAllBtnEl = document.querySelector("#collapse-all");
const jumpFirstResultBtnEl = document.querySelector("#jump-first-result");
const selectionCartEl = document.querySelector("#selection-cart");
const selectionCartListEl = document.querySelector("#selection-cart-list");
const selectionCartStatusEl = document.querySelector("#selection-cart-status");
const selectionCartCountEl = document.querySelector("#selection-cart-count");
const selectionCartToggleBtnEl = document.querySelector("#selection-cart-toggle");
const selectionCartExportTxtBtnEl = document.querySelector("#selection-cart-export-txt");
const selectionCartExportJsonBtnEl = document.querySelector("#selection-cart-export-json");
const selectionCartClearBtnEl = document.querySelector("#selection-cart-clear");
const tocItemTemplate = document.querySelector("#toc-item-template");
const sectionFilterButtons = Array.from(
  document.querySelectorAll(".section-filter")
);
const SELECTION_STORAGE_KEY = "hm-selection-cart-v1";
let contentSearchMatches = [];
let activeSearchMatchIndex = -1;
let selectedItems = loadSelectionCart();

bootstrap().catch((error) => {
  console.error(error);
  showStatus("Markdown 解析失败，请检查文件路径或浏览器控制台。", "error");
});

async function bootstrap() {
  const response = await fetch(markdownPath);
  if (!response.ok) {
    throw new Error(`Failed to load markdown: ${response.status}`);
  }

  const markdown = await response.text();
  const { frontmatter, body } = splitFrontmatter(markdown);
  const parsed = renderMarkdown(body);
  const summaryData = buildSummaryData(body);

  pageTitleEl.textContent = frontmatter.title || "管理人员评价指标体系";
  pageSummaryEl.textContent =
    frontmatter.summary || "基于 Markdown 渲染的单页知识库原型。";

  renderMetaChips(frontmatter);
  renderSummaryCards(summaryData);
  contentEl.innerHTML = parsed.html;
  enhanceCollapsibleGroups();
  wrapTopLevelSections();
  enhanceFeatureSections();
  enhanceSelectableItems();
  indexSearchableNodes();
  buildToc(parsed.toc);
  bindSearch();
  bindContentSearch();
  bindCollapseControls();
  bindSectionFilters();
  bindActiveToc();
  bindSelectionCart();
  renderSelectionCart();
  syncSelectableItems();

  showStatus(
    `已加载 ${parsed.toc.length} 个导航节点，适合继续验证单页信息架构与阅读体验。`,
    "success"
  );
}

function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: markdown };
  }

  return {
    frontmatter: parseFrontmatter(match[1]),
    body: match[2],
  };
}

function parseFrontmatter(raw) {
  const result = {};
  let currentKey = null;

  for (const line of raw.split(/\r?\n/)) {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      const [, key, value] = keyMatch;
      if (value) {
        result[key] = value.trim();
        currentKey = null;
      } else {
        result[key] = [];
        currentKey = key;
      }
      continue;
    }

    const arrayMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayMatch && currentKey) {
      result[currentKey].push(arrayMatch[1].trim());
    }
  }

  return result;
}

function renderMetaChips(frontmatter) {
  const chips = [];
  if (frontmatter.version) chips.push(`版本：${frontmatter.version}`);
  if (frontmatter.section) chips.push(`栏目：${frontmatter.section}`);
  if (frontmatter.topic) chips.push(`主题：${frontmatter.topic}`);
  if (frontmatter.audience) chips.push(`对象：${frontmatter.audience}`);
  if (Array.isArray(frontmatter.tags)) chips.push(...frontmatter.tags);

  metaChipsEl.innerHTML = chips
    .map((chip) => `<span class="meta-chip">${escapeHtml(chip)}</span>`)
    .join("");
}

function renderSummaryCards(summaryData) {
  const cards = [
    {
      label: "主指标总数",
      value: summaryData.mainIndicators,
      hint: "用于岗位评价、干部盘点和管理者画像的核心能力池",
    },
    {
      label: "高危反向指标",
      value: summaryData.riskIndicators,
      hint: "适合作为一票否决、风险预警和背调排查重点",
    },
    {
      label: "一级分类数量",
      value: summaryData.classCount,
      hint: "从 A 类到 AC 类，覆盖心性、执行、风控、组织等能力面",
    },
    {
      label: "使用步骤",
      value: summaryData.usageSteps,
      hint: "帮助从指标池走向实际使用，而不是机械全量打分",
    },
  ];

  summaryCardsEl.innerHTML = cards
    .map(
      (card) => `
        <section class="summary-card">
          <p class="summary-card__label">${escapeHtml(card.label)}</p>
          <p class="summary-card__value">${escapeHtml(String(card.value))}</p>
          <p class="summary-card__hint">${escapeHtml(card.hint)}</p>
        </section>
      `
    )
    .join("");
}

function buildSummaryData(body) {
  return {
    mainIndicators: countMatches(body, /^- \d+\./gm),
    riskIndicators: countMatches(body, /^- R\d+\./gm),
    classCount: countMatches(body, /^### [A-Z]{1,2}类：/gm),
    usageSteps: countMatches(body, /^### \d+\./gm),
  };
}

function renderMarkdown(body) {
  const lines = body.split(/\r?\n/);
  const toc = [];
  const html = [];

  let paragraph = [];
  let listItems = [];
  let quoteLines = [];
  let pendingAnchor = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    html.push(
      `<ul>${listItems
        .map((item) => `<li>${inline(item)}</li>`)
        .join("")}</ul>`
    );
    listItems = [];
  };

  const flushQuote = () => {
    if (!quoteLines.length) return;
    html.push(`<blockquote>${quoteLines.map(inline).join("<br />")}</blockquote>`);
    quoteLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    const anchorMatch = trimmed.match(/^<a id="([^"]+)"><\/a>$/);
    if (anchorMatch) {
      flushAll();
      pendingAnchor = anchorMatch[1];
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = pendingAnchor || slugify(text);
      pendingAnchor = null;

      if (level >= 2) {
        toc.push({ id, level, text });
      }

      html.push(
        `<h${level} id="${escapeAttribute(id)}">${inline(text)}<a class="anchor-link" href="#${escapeAttribute(id)}">#</a></h${level}>`
      );
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    const listMatch = trimmed.match(/^- (.*)$/);
    if (listMatch) {
      flushParagraph();
      flushQuote();
      listItems.push(listMatch[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushAll();

  return { html: html.join("\n"), toc };
}

function buildToc(items) {
  tocEl.innerHTML = "";

  for (const item of items) {
    const fragment = tocItemTemplate.content.cloneNode(true);
    const li = fragment.querySelector(".toc__item");
    const link = fragment.querySelector(".toc__link");

    li.classList.add(`toc__item--level-${item.level}`);
    link.href = `#${item.id}`;
    link.textContent = item.text;
    link.dataset.targetId = item.id;

    tocEl.appendChild(fragment);
  }
}

function wrapTopLevelSections() {
  const headings = Array.from(contentEl.querySelectorAll("h2[id]"));

  headings.forEach((heading, index) => {
    const headingText = getHeadingText(heading);
    const part = getTopLevelPartType(headingText);
    const meta = getTopLevelPartMeta(part, headingText, index);
    const section = document.createElement("section");
    section.className = "content-part";
    section.dataset.part = part;
    section.dataset.partLabel = meta.label;
    section.dataset.partTone = meta.tone;
    section.dataset.heading = headingText;
    section.dataset.headingSlug = slugify(headingText);

    heading.parentNode.insertBefore(section, heading);
    section.appendChild(heading);

    let sibling = section.nextSibling;
    while (sibling && !(sibling.nodeType === 1 && sibling.tagName === "H2")) {
      const nextSibling = sibling.nextSibling;
      section.appendChild(sibling);
      sibling = nextSibling;
    }

    const paragraphCount = section.querySelectorAll("p").length;
    const groupCount = section.querySelectorAll(".collapsible-group").length;
    section.dataset.partMeta = `${groupCount} 个分类 / ${paragraphCount} 段内容`;
  });
}

function enhanceFeatureSections() {
  const sections = Array.from(contentEl.querySelectorAll(".content-part"));

  for (const section of sections) {
    const heading = section.dataset.heading || "";

    if (heading.includes("页面信息")) {
      section.classList.add("content-part--facts");
      const list = section.querySelector("ul");
      if (list) {
        list.classList.add("info-grid");
        list.querySelectorAll("li").forEach((item) => item.classList.add("info-grid__item"));
      }
    }

    if (heading.includes("核心判断")) {
      section.classList.add("content-part--insight");
      const paragraphs = Array.from(section.querySelectorAll(":scope > p"));
      paragraphs.forEach((paragraph, index) => {
        paragraph.classList.add("insight-point");
        if (index === 0) {
          paragraph.classList.add("insight-point--lead");
        }
      });
    }

    if (heading.includes("快速导航")) {
      section.classList.add("content-part--quick-nav");
      const list = section.querySelector("ul");
      if (list) {
        list.classList.add("quick-nav-list");
        list.querySelectorAll("li").forEach((item) => item.classList.add("quick-nav-list__item"));
      }
    }
  }

  const blockquotes = Array.from(contentEl.querySelectorAll("blockquote"));
  blockquotes.forEach((blockquote, index) => {
    blockquote.classList.add("quote-highlight");
    if (index === 0) {
      blockquote.classList.add("quote-highlight--primary");
    }
  });
}

function enhanceSelectableItems() {
  const items = Array.from(contentEl.querySelectorAll(".content-part li")).filter(
    (item) =>
      !item.closest(".quick-nav-list") &&
      !item.closest(".info-grid") &&
      !item.closest(".selection-cart")
  );

  items.forEach((item, index) => {
    const itemText = normalizeWhitespace(item.textContent || "");
    if (!itemText) return;

    const group = item.closest(".collapsible-group");
    const part = item.closest(".content-part");
    const groupTitle = group
      ? getHeadingText(group.querySelector("h3") || group.querySelector(".collapsible-group__title"))
      : "";
    const partTitle = part?.dataset.heading || "";
    const itemId = `${slugify(`${partTitle}-${groupTitle}-${itemText}`)}-${index + 1}`;

    item.dataset.selectionItemId = itemId;
    item.dataset.selectionText = itemText;
    item.dataset.selectionGroup = groupTitle;
    item.dataset.selectionPart = partTitle;
    item.dataset.selectionIndex = String(index + 1);
    item.classList.add("selectable-item");

    if (item.querySelector(".item-picker__button")) return;

    const originalHtml = item.innerHTML;
    item.innerHTML = `
      <div class="selectable-item__row">
        <div class="selectable-item__content">${originalHtml}</div>
        <button
          class="item-picker__button"
          type="button"
          data-select-item-id="${escapeAttribute(itemId)}"
          aria-label="将当前小项加入清单"
        >
          加入清单
        </button>
      </div>
    `;
  });
}

function bindSelectionCart() {
  if (!selectionCartEl) return;

  contentEl.addEventListener("click", (event) => {
    const button = event.target.closest(".item-picker__button");
    if (!button) return;

    const itemEl = button.closest("[data-selection-item-id]");
    if (!itemEl) return;

    const item = buildSelectionItem(itemEl);
    const exists = selectedItems.some((entry) => entry.id === item.id);

    if (exists) {
      selectedItems = selectedItems.filter((entry) => entry.id !== item.id);
    } else {
      selectedItems.push(item);
    }

    persistSelectionCart();
    renderSelectionCart();
    syncSelectableItems();
  });

  selectionCartListEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-selection-id]");
    if (!button) return;

    const itemId = button.dataset.removeSelectionId;
    selectedItems = selectedItems.filter((entry) => entry.id !== itemId);
    persistSelectionCart();
    renderSelectionCart();
    syncSelectableItems();
  });

  selectionCartClearBtnEl?.addEventListener("click", () => {
    if (!selectedItems.length) return;
    selectedItems = [];
    persistSelectionCart();
    renderSelectionCart();
    syncSelectableItems();
  });

  selectionCartToggleBtnEl?.addEventListener("click", () => {
    const collapsed = selectionCartEl.classList.toggle("is-collapsed");
    selectionCartToggleBtnEl.textContent = collapsed ? "展开" : "收起";
    selectionCartToggleBtnEl.setAttribute("aria-expanded", String(!collapsed));
  });

  selectionCartExportTxtBtnEl?.addEventListener("click", () => {
    if (!selectedItems.length) {
      showStatus("清单里还没有内容，先点选小项再导出。", "error");
      return;
    }
    downloadSelectionList("txt");
  });

  selectionCartExportJsonBtnEl?.addEventListener("click", () => {
    if (!selectedItems.length) {
      showStatus("清单里还没有内容，先点选小项再导出。", "error");
      return;
    }
    downloadSelectionList("json");
  });
}

function buildSelectionItem(itemEl) {
  return {
    id: itemEl.dataset.selectionItemId,
    text: itemEl.dataset.selectionText || normalizeWhitespace(itemEl.textContent || ""),
    group: itemEl.dataset.selectionGroup || "",
    part: itemEl.dataset.selectionPart || "",
    addedAt: Date.now(),
  };
}

function renderSelectionCart() {
  if (!selectionCartEl || !selectionCartListEl || !selectionCartStatusEl) return;

  if (selectionCartCountEl) {
    selectionCartCountEl.textContent = String(selectedItems.length);
  }

  if (!selectedItems.length) {
    selectionCartEl.classList.remove("has-items");
    selectionCartStatusEl.textContent = "还没有加入任何小项，可在正文中逐条点选。";
    selectionCartListEl.innerHTML = "";
    return;
  }

  selectionCartEl.classList.add("has-items");
  selectionCartStatusEl.textContent = `当前已加入 ${selectedItems.length} 条内容，可继续点选、删除或导出。`;
  selectionCartListEl.innerHTML = selectedItems
    .map(
      (item, index) => `
        <li class="selection-cart__item">
          <div class="selection-cart__item-head">
            <span class="selection-cart__item-index">${index + 1}</span>
            <button
              class="selection-cart__remove"
              type="button"
              data-remove-selection-id="${escapeAttribute(item.id)}"
            >
              移除
            </button>
          </div>
          <p class="selection-cart__item-text">${escapeHtml(item.text)}</p>
          <p class="selection-cart__item-meta">${escapeHtml(
            [item.part, item.group].filter(Boolean).join(" / ")
          )}</p>
        </li>
      `
    )
    .join("");
}

function syncSelectableItems() {
  const selectedIds = new Set(selectedItems.map((item) => item.id));
  const items = Array.from(contentEl.querySelectorAll("[data-selection-item-id]"));

  items.forEach((item) => {
    const itemId = item.dataset.selectionItemId;
    const isSelected = selectedIds.has(itemId);
    item.classList.toggle("is-selected", isSelected);

    const button = item.querySelector(".item-picker__button");
    if (!button) return;
    button.textContent = isSelected ? "已加入" : "加入清单";
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function downloadSelectionList(format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  let content = "";
  let mimeType = "text/plain;charset=utf-8";
  let fileName = `selection-list-${timestamp}.txt`;

  if (format === "json") {
    content = JSON.stringify(selectedItems, null, 2);
    mimeType = "application/json;charset=utf-8";
    fileName = `selection-list-${timestamp}.json`;
  } else {
    content = selectedItems
      .map((item, index) => {
        const meta = [item.part, item.group].filter(Boolean).join(" / ");
        return `${index + 1}. ${item.text}${meta ? `\n   ${meta}` : ""}`;
      })
      .join("\n\n");
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showStatus(`已导出 ${selectedItems.length} 条清单内容。`, "success");
}

function bindSearch() {
  const links = Array.from(document.querySelectorAll(".toc__link"));

  const applyFilter = () => {
    const keyword = searchInputEl.value.trim().toLowerCase();
    let visibleCount = 0;

    for (const link of links) {
      const matched = !keyword || link.textContent.toLowerCase().includes(keyword);
      link.parentElement.classList.toggle("is-hidden", !matched);
      if (matched) visibleCount += 1;
    }

    if (!keyword) {
      searchStatusEl.textContent = `共 ${links.length} 个导航节点`;
      return;
    }

    searchStatusEl.textContent =
      visibleCount > 0
        ? `找到 ${visibleCount} 个匹配导航节点`
        : "没有匹配项，可换一个关键词试试";
  };

  searchInputEl.addEventListener("input", applyFilter);
  applyFilter();
}

function bindActiveToc() {
  const headings = Array.from(contentEl.querySelectorAll("h2[id], h3[id]"));
  const tocLinks = Array.from(document.querySelectorAll(".toc__link"));
  const tocLinkById = new Map(
    tocLinks.map((link) => [link.dataset.targetId, link])
  );

  if (!headings.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (!visibleEntries.length) return;

      const current = visibleEntries.sort(
        (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
      )[0];

      for (const link of tocLinks) {
        link.classList.toggle("is-active", link.dataset.targetId === current.target.id);
      }
    },
    {
      rootMargin: "-20% 0px -70% 0px",
      threshold: [0, 1],
    }
  );

  headings.forEach((heading) => observer.observe(heading));

  window.addEventListener("hashchange", () => {
    const id = window.location.hash.slice(1);
    for (const link of tocLinks) {
      link.classList.toggle("is-active", link.dataset.targetId === id);
    }
  });
}

function bindSectionFilters() {
  for (const button of sectionFilterButtons) {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      applySectionFilter(filter);

      for (const item of sectionFilterButtons) {
        item.classList.toggle("is-active", item === button);
      }
    });
  }
}

function enhanceCollapsibleGroups() {
  const headings = Array.from(contentEl.querySelectorAll("h3[id]"));

  for (const heading of headings) {
    const group = document.createElement("section");
    group.className = "collapsible-group";
    group.dataset.groupId = heading.id;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "collapsible-group__toggle";
    button.setAttribute("aria-expanded", "true");

    const title = document.createElement("span");
    title.className = "collapsible-group__title";

    const badge = document.createElement("span");
    badge.className = "collapsible-group__badge";

    const headingText = getHeadingText(heading);
    badge.textContent = headingText.split("：")[0];

    const titleText = document.createElement("span");
    titleText.textContent = headingText;

    const meta = document.createElement("span");
    meta.className = "collapsible-group__meta";

    title.append(badge, titleText);
    button.append(title, meta);

    const body = document.createElement("div");
    body.className = "collapsible-group__body";

    heading.parentNode.insertBefore(group, heading);
    group.append(button, body);
    body.appendChild(heading);

    let sibling = group.nextSibling;
    while (sibling && !(sibling.nodeType === 1 && /^(H2|H3)$/.test(sibling.tagName))) {
      const nextSibling = sibling.nextSibling;
      body.appendChild(sibling);
      sibling = nextSibling;
    }

    const itemCount = body.querySelectorAll("li").length;
    const paragraphCount = body.querySelectorAll("p, blockquote").length;
    group.dataset.itemCount = String(itemCount);
    meta.textContent =
      itemCount > 0
        ? `${itemCount} 条指标`
        : paragraphCount > 0
          ? `${paragraphCount} 段说明`
          : "点击展开/收起";

    button.addEventListener("click", () => {
      const collapsed = group.classList.toggle("is-collapsed");
      button.setAttribute("aria-expanded", String(!collapsed));
    });
  }
}

function indexSearchableNodes() {
  const nodes = Array.from(contentEl.querySelectorAll("h2, h3, p, li, blockquote"));
  for (const node of nodes) {
    node.dataset.originalHtml = node.innerHTML;
  }
}

function bindContentSearch() {
  const nodes = Array.from(contentEl.querySelectorAll("h2, h3, p, li, blockquote"));
  const groups = () => Array.from(contentEl.querySelectorAll(".collapsible-group"));

  const applySearch = () => {
    const keyword = contentSearchInputEl.value.trim();
    clearContentSearch(nodes, groups());

    if (!keyword) {
      contentSearchStatusEl.textContent =
        "输入关键词后可高亮匹配段落并自动展开对应分类";
      applyMatchOnlyFilter(groups());
      syncSelectableItems();
      return;
    }

    const regex = new RegExp(escapeRegExp(keyword), "gi");
    let totalCount = 0;

    for (const node of nodes) {
      const text = node.textContent || "";
      const matches = text.match(regex);
      if (!matches) continue;

      totalCount += matches.length;
      node.innerHTML = node.dataset.originalHtml.replace(
        regex,
        (match) => `<mark class="match-hit">${match}</mark>`
      );
      node.classList.add("search-result");
      contentSearchMatches.push(node);

      const group = node.closest(".collapsible-group");
      if (group) {
        group.classList.remove("is-collapsed");
        const button = group.querySelector(".collapsible-group__toggle");
        if (button) button.setAttribute("aria-expanded", "true");
      }
    }

    if (!contentSearchMatches.length) {
      contentSearchStatusEl.textContent = "正文中没有找到匹配内容，可换个关键词再试";
      applyMatchOnlyFilter(groups());
      return;
    }

    contentSearchStatusEl.textContent = `找到 ${totalCount} 处匹配，分布在 ${contentSearchMatches.length} 个内容块中，可用上一个/下一个继续跳转`;
    applyMatchOnlyFilter(groups());
    syncSelectableItems();
    setActiveSearchMatch(0);
  };

  contentSearchInputEl.addEventListener("input", applySearch);
  matchOnlyToggleEl.addEventListener("change", () => {
    applyMatchOnlyFilter(groups());
  });
}

function clearContentSearch(nodes, groups) {
  contentSearchMatches = [];
  activeSearchMatchIndex = -1;
  for (const node of nodes) {
    if (node.dataset.originalHtml) {
      node.innerHTML = node.dataset.originalHtml;
    }
    node.classList.remove("search-result");
    node.classList.remove("search-result--active");
  }

  for (const group of groups) {
    group.classList.remove("is-filtered-out");
  }

  syncSelectableItems();
}

function bindCollapseControls() {
  const groups = () => Array.from(contentEl.querySelectorAll(".collapsible-group"));

  expandAllBtnEl.addEventListener("click", () => {
    for (const group of groups()) {
      setGroupCollapsed(group, false);
    }
  });

  collapseAllBtnEl.addEventListener("click", () => {
    for (const group of groups()) {
      setGroupCollapsed(group, true);
    }
  });

  jumpFirstResultBtnEl.addEventListener("click", () => {
    if (!contentSearchMatches.length) {
      contentSearchStatusEl.textContent = "当前没有搜索结果，先输入关键词再跳转";
      return;
    }

    setActiveSearchMatch(0);
  });

  prevResultBtnEl.addEventListener("click", () => {
    if (!contentSearchMatches.length) {
      contentSearchStatusEl.textContent = "当前没有搜索结果，先输入关键词再跳转";
      return;
    }

    const prevIndex =
      activeSearchMatchIndex <= 0
        ? contentSearchMatches.length - 1
        : activeSearchMatchIndex - 1;
    setActiveSearchMatch(prevIndex);
  });

  nextResultBtnEl.addEventListener("click", () => {
    if (!contentSearchMatches.length) {
      contentSearchStatusEl.textContent = "当前没有搜索结果，先输入关键词再跳转";
      return;
    }

    const nextIndex =
      activeSearchMatchIndex >= contentSearchMatches.length - 1
        ? 0
        : activeSearchMatchIndex + 1;
    setActiveSearchMatch(nextIndex);
  });
}

function setGroupCollapsed(group, collapsed) {
  group.classList.toggle("is-collapsed", collapsed);
  const button = group.querySelector(".collapsible-group__toggle");
  if (button) {
    button.setAttribute("aria-expanded", String(!collapsed));
  }
}

function getHeadingText(heading) {
  return heading.textContent.replace(/#$/, "").trim();
}

function applySectionFilter(filter) {
  const parts = Array.from(contentEl.querySelectorAll(".content-part"));

  for (const part of parts) {
    const type = part.dataset.part || "other";
    const visible =
      filter === "all" ||
      type === filter ||
      (type === "intro" && filter !== "all");
    part.classList.toggle("is-hidden", !visible);
  }
}

function getTopLevelPartType(text) {
  if (text.includes("第一部分")) return "main";
  if (text.includes("第二部分")) return "risk";
  if (text.includes("第三部分")) return "usage";
  if (text.includes("使用原则")) return "intro";
  return "other";
}

function getTopLevelPartMeta(part, text, index) {
  switch (part) {
    case "intro":
      return { label: "Usage Principles", tone: "neutral" };
    case "main":
      return { label: "Main Indicator Pool", tone: "blue" };
    case "risk":
      return { label: "Risk Signals", tone: "amber" };
    case "usage":
      return { label: "How To Use", tone: "violet" };
    default:
      return {
        label: `Section ${String(index + 1).padStart(2, "0")}`,
        tone: "neutral",
      };
  }
}

function setActiveSearchMatch(index) {
  if (!contentSearchMatches.length) return;

  activeSearchMatchIndex = index;

  for (const node of contentSearchMatches) {
    node.classList.remove("search-result--active");
  }

  const activeNode = contentSearchMatches[activeSearchMatchIndex];
  activeNode.classList.add("search-result--active");
  activeNode.scrollIntoView({ behavior: "smooth", block: "center" });

  contentSearchStatusEl.textContent = `当前查看第 ${activeSearchMatchIndex + 1} / ${contentSearchMatches.length} 个命中内容块`;
}

function applyMatchOnlyFilter(groups) {
  const matchOnly = matchOnlyToggleEl.checked;
  const hasKeyword = Boolean(contentSearchInputEl.value.trim());

  for (const group of groups) {
    if (!matchOnly || !hasKeyword) {
      group.classList.remove("is-filtered-out");
      continue;
    }

    const hasMatch = group.querySelector(".search-result");
    group.classList.toggle("is-filtered-out", !hasMatch);
  }
}

function inline(text) {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, href) =>
      `<a href="${escapeAttribute(href)}">${escapeHtml(label)}</a>`
  );

  return html;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(text) {
  return escapeHtml(text).replace(/`/g, "&#96;");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function loadSelectionCart() {
  try {
    const raw = window.localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to load selection cart", error);
    return [];
  }
}

function persistSelectionCart() {
  try {
    window.localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selectedItems));
  } catch (error) {
    console.warn("Failed to persist selection cart", error);
  }
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `notice notice--${type}`;
}
