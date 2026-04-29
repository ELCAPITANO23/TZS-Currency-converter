    let liveRates = {};

    const marketData = {
      TZS: { name: "Tanzanian Shilling", flag: "🇹🇿" },
      USD: { name: "US Dollar",          flag: "🇺🇸" },
      EUR: { name: "Euro",               flag: "🇪🇺" },
      GBP: { name: "British Pound",      flag: "🇬🇧" },
      CNY: { name: "Chinese Yuan",       flag: "🇨🇳" },
      INR: { name: "Indian Rupee",       flag: "🇮🇳" },
      JPY: { name: "Japanese Yen",       flag: "🇯🇵" },
      KRW: { name: "South Korean Won",   flag: "🇰🇷" },
      AUD: { name: "Australian Dollar",  flag: "🇦🇺" },
      BRL: { name: "Brazilian Real",     flag: "🇧🇷" },
      ARS: { name: "Argentine Peso",     flag: "🇦🇷" },
      IDR: { name: "Indonesian Rupiah",  flag: "🇮🇩" },
      MXN: { name: "Mexican Peso",       flag: "🇲🇽" },
      TRY: { name: "Turkish Lira",       flag: "🇹🇷" },
      SAR: { name: "Saudi Riyal",        flag: "🇸🇦" },
      ZAR: { name: "South African Rand", flag: "🇿🇦" },
      CAD: { name: "Canadian Dollar",    flag: "🇨🇦" },
      RUB: { name: "Russian Ruble",      flag: "🇷🇺" },
      AED: { name: "UAE Dirham",         flag: "🇦🇪" },
      KES: { name: "Kenyan Shilling",    flag: "🇰🇪" },
      UGX: { name: "Uganda Shilling",    flag: "🇺🇬" },  
    };

    async function fetchTZSRates() {
      try {
        const response = await fetch("https://open.er-api.com/v6/latest/TZS");
        const data = await response.json();
        liveRates = data.rates;
        liveRates["TZS"] = 1; /* 1 TZS = 1 TZS */

        buildRatesTable();
        buildCalcDropdowns();

        const eatTime = new Date().toLocaleString("en-GB", {
          timeZone: "Africa/Dar_es_Salaam",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        });
        document.getElementById("update-time").innerText =
          "Updated (EAT): " + eatTime;

      } catch (err) {
        console.error(err);
        document.getElementById("table-body").innerHTML =
          "<tr><td colspan='3' class='err-cell'>Could not load rates. Check connection.</td></tr>";
      }
    }

    function buildRatesTable() {
      const tbody = document.getElementById("table-body");
      tbody.innerHTML = "";
      for (let code in marketData) {
        if (code === "TZS") continue;
        if (!liveRates[code]) continue;
        const tzsValue = (1 / liveRates[code]).toFixed(2);
        tbody.innerHTML += `
          <tr>
            <td>
              <span class="flag">${marketData[code].flag}</span>
              <span class="currency-name">${marketData[code].name}</span>
            </td>
            <td><span class="code-tag">${code}</span></td>
            <td class="rate-value">${Number(tzsValue).toLocaleString()}</td>
          </tr>`;
      }
    }

    function buildCalcDropdowns() {
      ["from-currency", "to-currency"].forEach((id, i) => {
        const sel = document.getElementById(id);
        sel.innerHTML = "";
        for (let code in marketData) {
          if (!liveRates[code]) continue;
          const opt = document.createElement("option");
          opt.value = code;
          opt.textContent = `${marketData[code].flag} ${code} — ${marketData[code].name}`;
          if (i === 0 && code === "TZS") opt.selected = true;
          if (i === 1 && code === "USD") opt.selected = true;
          sel.appendChild(opt);
        }
      });
      convertCurrency();
    }

    function formatAmountInput(el) {
      let cursorPos = el.selectionStart;
      let raw   = el.value;
      let clean = raw.replace(/[^0-9.]/g, "");
      const parts = clean.split(".");
      if (parts.length > 2) clean = parts[0] + "." + parts.slice(1).join("");
      const intPart   = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const formatted = parts.length === 2 ? intPart + "." + parts[1] : intPart;
      const commasBefore = (raw.slice(0, cursorPos).match(/,/g) || []).length;
      el.value = formatted;
      const commasAfter = (formatted.slice(0, cursorPos).match(/,/g) || []).length;
      el.setSelectionRange(cursorPos + (commasAfter - commasBefore),
                           cursorPos + (commasAfter - commasBefore));
    }

    function swapCurrencies() {
      const from = document.getElementById("from-currency");
      const to   = document.getElementById("to-currency");
      const tmp  = from.value;
      from.value = to.value;
      to.value   = tmp;
      convertCurrency();
    }

    function convertCurrency() {
      const raw      = document.getElementById("amount").value.replace(/,/g, "").trim();
      const fromCode = document.getElementById("from-currency").value;
      const toCode   = document.getElementById("to-currency").value;
      const resultEl = document.getElementById("conversion-result");

      /* Update suffix badge */
      document.getElementById("amount-suffix").textContent = fromCode || "—";

      if (!raw || !fromCode || !toCode) {
        resultEl.value = "";
        resultEl.placeholder = "Result appears here…";
        return;
      }

      const amount = parseFloat(raw);
      if (isNaN(amount) || amount < 0) {
        resultEl.value = "";
        resultEl.placeholder = "Enter a valid amount";
        hintEl.textContent = "";
        return;
      }

      if (!liveRates[fromCode] || !liveRates[toCode]) {
        resultEl.value = "Rate unavailable";
        hintEl.textContent = "";
        return;
      }

      /* Convert via TZS as base:
         from → TZS: divide by liveRates[from]  (liveRates[X] = X per 1 TZS)
         TZS → to:   multiply by liveRates[to]  */
      const amountInTZS  = amount / liveRates[fromCode];
      const converted    = amountInTZS * liveRates[toCode];

      const fmtAmount    = amount.toLocaleString("en-US", { maximumFractionDigits: 4 });
      const fmtConverted = converted.toLocaleString("en-US", {
        minimumFractionDigits: 2, maximumFractionDigits: 4
      });

      /* Unit rate */
      const unitRate = (1 / liveRates[fromCode]) * liveRates[toCode];
      const fmtUnit  = unitRate.toLocaleString("en-US", {
        minimumFractionDigits: 2, maximumFractionDigits: 4
      });

      resultEl.value = `${fmtConverted} ${toCode}`;
    }

    window.onload = fetchTZSRates;
