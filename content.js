/* content.js - robust parser + observer for MUI tables */

function parseNumber(text) {
  if (!text && text !== 0) return NaN;
  let s = String(text).trim();
  if (!s) return NaN;

  // Keep digits, dot, comma, minus, replace non-breaking spaces
  s = s.replace(/\u00A0/g, " ").replace(/[^\d.,\-]/g, "").replace(/\s+/g, "");

  const commaCount = (s.match(/,/g) || []).length;
  const dotCount = (s.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (commaCount > 0 && dotCount === 0) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/(?<=\d)\.(?=\d{3}(\D|$))/g, "");
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

function isNumeric(n) {
  return typeof n === "number" && !isNaN(n);
}

function findMUITableElements() {
  return Array.from(document.querySelectorAll("table.MuiTable-root, table"));
}

function calculateColumnSumsFromTable(table) {
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
  const sums = [];

  bodyRows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td, th"));
    cells.forEach((cell, idx) => {
      const val = parseNumber(cell.innerText || "");
      if (isNumeric(val)) sums[idx] = (sums[idx] || 0) + val;
    });
  });

  return sums;
}

function formatNumber(value) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function injectFooterRowIntoTable(table, sums) {
  if (!sums || sums.length === 0) return;
  let tfoot = table.querySelector("tfoot");
  if (!tfoot) {
    tfoot = document.createElement("tfoot");
    table.appendChild(tfoot);
  }

  tfoot.innerHTML = "";
  const tr = document.createElement("tr");

  sums.forEach((s) => {
    const td = document.createElement("td");
    td.style.fontWeight = "bold";
    td.style.background = "#f6f7fb";
    td.style.padding = "8px";
    td.innerText = isNumeric(s) ? formatNumber(s) : "";
    tr.appendChild(td);
  });

  tfoot.appendChild(tr);
}

const tableObservers = new WeakMap();

function processTable(table) {
  if (tableObservers.has(table)) return;

  const doCalc = () => {
    const sums = calculateColumnSumsFromTable(table);
    injectFooterRowIntoTable(table, sums);
  };

  doCalc();

  const obs = new MutationObserver(() => {
    clearTimeout(obs._timeout);
    obs._timeout = setTimeout(doCalc, 200);
  });
  obs.observe(table, { childList: true, subtree: true, characterData: true });
  tableObservers.set(table, obs);
}

function init() {
  const tables = findMUITableElements();
  tables.forEach((t) => processTable(t));
}

init();

const rootObserver = new MutationObserver(() => {
  clearTimeout(rootObserver._timeout);
  rootObserver._timeout = setTimeout(init, 400);
});
rootObserver.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true
});
