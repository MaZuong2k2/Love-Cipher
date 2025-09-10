(function () {
  // ===== BASIC TOOL =====
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
  const yearSpan = $("#year") || { textContent: () => {} };
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
    } else {
      keyInfo.textContent = "Don't have any keyword yet.";
      return 0;
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
        const next = (idx + (signedShift % 26) + 26) % 26;
        let nc = alphabet[next];
        if (ch >= "A" && ch <= "Z") nc = nc.toUpperCase();
        out += nc;
      }
    }
    return out;
  }

  function run() {
    const mode = [...$$('input[name="mode"]')].find((r) => r.checked)?.value ?? "encrypt";
    const shift = parseShift();
    const text = inputText.value ?? "";
    const result = transform(text, shift || 0, mode);
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
      setTimeout(() => (copyBtn.textContent = "Copy your result"), 1200);
    } catch (e) {
      alert("Cant copy");
    }
  }

  keyLetter.addEventListener("input", parseShift);
  runBtn.addEventListener("click", run);
  clearBtn.addEventListener("click", clearAll);
  copyBtn.addEventListener("click", copyResult);
  parseShift();

  // ===== ADVANCED TOOL (theo test.py) =====
  // Helpers
  function charToShift(ch) {
    const c = (ch || "").toLowerCase();
    if (c >= "a" && c <= "z") return c.charCodeAt(0) - "a".charCodeAt(0) + 1; // 1..26
    return 0;
  }

  function caesarShift(text, shift, decrypt = false) {
    const out = [];
    for (const c of text) {
      if (c >= "a" && c <= "z") {
        const idx = (c.charCodeAt(0) - 97 + (decrypt ? shift : -shift)) % 26;
        out.push(String.fromCharCode(((idx + 26) % 26) + 97));
      } else if (c >= "A" && c <= "Z") {
        const idx = (c.charCodeAt(0) - 65 + (decrypt ? shift : -shift)) % 26;
        out.push(String.fromCharCode(((idx + 26) % 26) + 65));
      } else {
        out.push(c);
      }
    }
    return out.join("");
  }

  function reverseEachWord(text) {
    const parts = text.split(/\s+/).filter(Boolean);
    const rev = parts.map((w) => w.split("").reverse().join(""));
    return rev.join(" ");
  }

  function multiKeyEncrypt(text, key) {
    let res = reverseEachWord(text);
    for (const ch of key) {
      const s = charToShift(ch);
      if (s > 0) res = caesarShift(res, s, false);
    }
    return res;
  }

  function multiKeyDecrypt(cipher, key) {
    let res = cipher;
    const arr = [...key];
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = charToShift(arr[i]);
      if (s > 0) res = caesarShift(res, s, true);
    }
    res = reverseEachWord(res);
    return res;
  }

  function textToNumbers(cipher, keyword2) {
    const keyDigits = (keyword2 || "")
      .trim()
      .split("")
      .filter((d) => /\d/.test(d))
      .map((d) => parseInt(d, 10));
    if (keyDigits.length === 0) throw new Error("Key 2 phải là chuỗi số (ví dụ 1234).");

    const outTokens = [];
    let k = 0;
    for (const ch of cipher) {
      if (ch === " ") {
        outTokens.push("  "); // double-space token
      } else if (/[A-Za-z]/.test(ch)) {
        const val = charToShift(ch); // 1..26
        const mul = keyDigits[k % keyDigits.length];
        outTokens.push(String(val * mul));
        k += 1;
      } else {
        throw new Error(`Ký tự không hỗ trợ ở bước số: ${JSON.stringify(ch)}`);
      }
    }
    return outTokens.join(" ");
  }

  function splitWordsPreservingDoubleSpace(seq) {
    const s = (seq || "").trim();
    if (s === "") return [];
    const wordSegments = s.split("  ");
    const words = [];
    for (const seg of wordSegments) {
      const t = seg.trim();
      if (t === "") words.push([]);
      else words.push(t.split(" ").filter((x) => x !== ""));
    }
    return words;
  }

  function numbersToText(seq, keyword2) {
    const keyDigits = (keyword2 || "")
      .trim()
      .split("")
      .filter((d) => /\d/.test(d))
      .map((d) => parseInt(d, 10));
    if (keyDigits.length === 0) throw new Error("Key 2 phải là chuỗi số (ví dụ 1234).");

    const words = splitWordsPreservingDoubleSpace(seq);
    const outWords = [];
    let k = 0;
    for (const word of words) {
      const letters = [];
      for (const tok of word) {
        if (!/^\d+$/.test(tok)) throw new Error(`Gặp token không phải số: ${JSON.stringify(tok)}`);
        const n = parseInt(tok, 10);
        const mul = keyDigits[k % keyDigits.length];
        if (n % mul !== 0) throw new Error(`Số ${n} không chia hết cho ${mul} (Key 2).`);
        const v = n / mul;
        if (!(1 <= v && v <= 26)) throw new Error(`Giá trị chữ không hợp lệ sau chia: ${v}`);
        letters.push(String.fromCharCode((v - 1) + "a".charCodeAt(0)));
        k += 1;
      }
      outWords.push(letters.join(""));
    }
    return outWords.join(" ");
  }

  // ====== BIND UI (Advanced) ======
  const advMode = () =>
    [...$$('input[name="advMode"]')].find((r) => r.checked)?.value ?? "encrypt";

  const advEncryptPanel = $("#advEncryptPanel");
  const advDecryptPanel = $("#advDecryptPanel");

  // Encrypt fields
  const advPlain = $("#advPlain");
  const advKey = $("#advKey");
  const advKey2 = $("#advKey2");
  const advEncryptBtn = $("#advEncryptBtn");
  const advClearEncBtn = $("#advClearEncBtn");
  const advCopyEncBtn = $("#advCopyEncBtn");
  const advNumberOut = $("#advNumberOut");
  const advErrorEnc = $("#advErrorEnc");

  // Decrypt fields
  const advNumbersIn = $("#advNumbersIn");
  const advKeyDec = $("#advKeyDec");
  const advKey2Dec = $("#advKey2Dec");
  const advDecryptBtn = $("#advDecryptBtn");
  const advClearDecBtn = $("#advClearDecBtn");
  const advCopyDecBtn = $("#advCopyDecBtn");
  const advPlainOut = $("#advPlainOut");
  const advErrorDec = $("#advErrorDec");

  function switchPanels() {
    const isEncrypt = advMode() === "encrypt";
    advEncryptPanel.hidden = !isEncrypt;
    advDecryptPanel.hidden = isEncrypt;
  }
  $$('input[name="advMode"]').forEach((r) => r.addEventListener("change", switchPanels));
  switchPanels();

  // ===== Encrypt flow =====
  advEncryptBtn.addEventListener("click", () => {
    advErrorEnc.hidden = true;
    advErrorEnc.textContent = "";
    advNumberOut.value = "";

    try {
      const plain = (advPlain.value || "").trim();
      const key = (advKey.value || "").trim();
      const key2 = (advKey2.value || "").trim();

      if (!key || !/^[A-Za-z]+$/.test(key)) {
        throw new Error("Key 1 phải là chữ cái a–z, không để trống.");
      }
      if (!key2 || !/^\d+$/.test(key2)) {
        throw new Error("Key 2 phải là chuỗi số (ví dụ 1234).");
      }
      // Khuyến nghị dùng chỉ chữ & khoảng trắng để nhất quán với bước số
      if (/[^A-Za-z\s]/.test(plain)) {
        throw new Error("Plaintext chỉ nên chứa chữ cái và khoảng trắng.");
      }

      const cipher = multiKeyEncrypt(plain, key);
      const seq = textToNumbers(cipher, key2);
      advNumberOut.value = seq;
    } catch (e) {
      advErrorEnc.hidden = false;
      advErrorEnc.textContent = e.message || String(e);
    }
  });

  advClearEncBtn.addEventListener("click", () => {
    advPlain.value = "";
    advKey.value = "";
    advKey2.value = "";
    advNumberOut.value = "";
    advErrorEnc.hidden = true;
    advErrorEnc.textContent = "";
  });

  advCopyEncBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(advNumberOut.value || "");
      advCopyEncBtn.textContent = "Copied ✅";
      setTimeout(() => (advCopyEncBtn.textContent = "Copy"), 1200);
    } catch {
      alert("Cant copy");
    }
  });

  // ===== Decrypt flow =====
  advDecryptBtn.addEventListener("click", () => {
    advErrorDec.hidden = true;
    advErrorDec.textContent = "";
    advPlainOut.value = "";

    try {
      const seq = (advNumbersIn.value || "").trim();
      const key = (advKeyDec.value || "").trim();
      const key2 = (advKey2Dec.value || "").trim();

      if (!seq) throw new Error("Vui lòng dán dãy số đã mã hóa.");
      if (!key || !/^[A-Za-z]+$/.test(key)) {
        throw new Error("Key 1 phải là chữ cái a–z, không để trống.");
      }
      if (!key2 || !/^\d+$/.test(key2)) {
        throw new Error("Key 2 phải là chuỗi số (ví dụ 1234).");
      }

      const cipher = numbersToText(seq, key2);
      const plain = multiKeyDecrypt(cipher, key);
      advPlainOut.value = plain;
    } catch (e) {
      advErrorDec.hidden = false;
      advErrorDec.textContent = e.message || String(e);
    }
  });

  advClearDecBtn.addEventListener("click", () => {
    advNumbersIn.value = "";
    advKeyDec.value = "";
    advKey2Dec.value = "";
    advPlainOut.value = "";
    advErrorDec.hidden = true;
    advErrorDec.textContent = "";
  });

  advCopyDecBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(advPlainOut.value || "");
      advCopyDecBtn.textContent = "Copied ✅";
      setTimeout(() => (advCopyDecBtn.textContent = "Copy"), 1200);
    } catch {
      alert("Cant copy");
    }
  });
})();
