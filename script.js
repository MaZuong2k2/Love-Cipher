(function() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const inputText = $("#inputText");
  const outputText = $("#outputText");
  const keyLetter = $("#keyLetter");
  const keyInfo = $("#keyInfo");
  const runBtn = $("#runBtn");
  const clearBtn = $("#clearBtn");
  const copyBtn = $("#copyBtn");
  const yearSpan = $("#year");

  yearSpan.textContent = new Date().getFullYear();

  function letterToShift(letter) {
    if (!letter) return null;
    const ch = letter.toLowerCase();
    const idx = alphabet.indexOf(ch);
    return idx >= 0 ? idx : null; 
  }

  function parseShift() {

    const fromLetter = letterToShift(keyLetter.value.trim());
    if (fromLetter !== null) {
      keyInfo.textContent = `Keyword “${keyLetter.value.trim()}”`;
      return fromLetter;
    }
  }

  function transform(text, shift, mode) {
    const signedShift = mode === "encrypt" ? -shift : +shift;

    let out = "";
    for (const ch of text) {
      const lower = ch.toLowerCase();
      const idx = alphabet.indexOf(lower);
      if (idx === -1) {
        out += ch; 
      } else {
        const next = (idx + signedShift % 26 + 26) % 26;
        let nc = alphabet[next];
        if (ch >= "A" && ch <= "Z") nc = nc.toUpperCase();
        out += nc;
      }
    }
    return out;
  }

  function run() {
    const mode = [...$$('input[name="mode"]')].find(r => r.checked)?.value ?? "encrypt";
    const shift = parseShift();
    const text = inputText.value ?? "";
    const result = transform(text, shift, mode);
    outputText.value = result;
  }

  function clearAll() {
    inputText.value = "";
    outputText.value = "";
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(outputText.value || "");
      copyBtn.textContent = "Copied ✅";
      setTimeout(() => (copyBtn.textContent = "Copy result"), 1200);
    } catch (e) {
      alert("Cant copy");
    }
  }

  // live update of key info
  keyLetter.addEventListener("input", parseShift);

  runBtn.addEventListener("click", run);
  clearBtn.addEventListener("click", clearAll);
  copyBtn.addEventListener("click", copyResult);

  // init
  parseShift();
})();