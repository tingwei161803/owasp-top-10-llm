# OWASP Top 10 for LLM Applications 2025 — 中英雙語檢視站

> 把 OWASP「大型語言模型應用程式十大風險(2025 年版)」官方文件,整理成一個可瀏覽、可切換語言、可深連結的純靜態網站。

**🔗 線上版:** <https://tingwei161803.github.io/owasp-top-10-llm/>

本站將 OWASP 官方的 **英文版**與**繁體中文版** PDF(共 87 頁)拆解為 10 條風險,每條獨立一頁,完整保留「描述 / 常見漏洞範例 / 預防與緩解 / 攻擊情境 / 參考連結 / 相關框架」六大面向,中英文一鍵全頁切換。所有參考連結的網址皆**直接從官方 PDF 的超連結逐一比對取出**,非人工臆測。

---

## ✨ 功能特色

- 🌏 **中英全頁切換** — 一鍵把整頁(內容、導覽、標題)在繁中 / English 間切換,無殘留
- 🌗 **深色 / 淺色模式** — 手動切換,選擇記憶在 `localStorage`
- 🧭 **多頁面架構** — 首頁總覽 + 每條風險各自獨立 URL(`llm01.html` … `llm10.html`),利於 SEO 與分享
- 🔗 **可深連結的參考來源** — 每條風險的參考文獻 / 相關框架皆為可點擊外連,共 106 條,網址出處取自官方 PDF
- 📑 **長文閱讀體驗** — 黏性目錄(TOC)、閱讀進度條、章節高亮
- 📱 **響應式設計** — 手機、平板、桌機皆適配(已於 375px 驗證無水平溢出)
- ♿ **無障礙基礎** — 鍵盤可操作、控制項具可存取名稱、跳到內容連結
- ⚡ **純靜態零建置** — 無後端、無 npm / build,載入快、可離線瀏覽

---

## 📂 內容結構 / 資料來源

本站內容整理自 **OWASP Top 10 for LLM Applications 2025**(官方:<https://genai.owasp.org/llm-top-10/>),Version 2025 / 2024-11-18 發布,授權為 **CC BY-SA 4.0**。

```
.
├── index.html          # 首頁 / 總覽(hub)
├── whats-new.html      # 2025 年新版焦點(專案信 + 變動摘要)
├── llm01.html … llm10.html   # 十大風險,每條一頁
├── assets/
│   ├── styles.css      # Material Design 3 樣式(淺/深色 token)
│   ├── shell.js        # 共用外殼:appbar / 跨頁導覽 / footer / dialog / 語言+主題
│   └── app.js          # 版型引擎(article renderer + 參考連結區塊)
├── data/
│   └── data.js         # 唯一資料層:window.SITE_META + window.SITE_PAGES(雙語 {en,zh})
├── .nojekyll
└── README.md
```

涵蓋的十大風險:

| 編號 | English | 繁體中文 |
|------|---------|----------|
| LLM01 | Prompt Injection | 提示注入 |
| LLM02 | Sensitive Information Disclosure | 敏感資訊洩漏 |
| LLM03 | Supply Chain | 供應鏈 |
| LLM04 | Data and Model Poisoning | 資料及模型投毒 |
| LLM05 | Improper Output Handling | 不當輸出處理 |
| LLM06 | Excessive Agency | 過度代理授權 |
| LLM07 | System Prompt Leakage | 系統提示洩漏 |
| LLM08 | Vector and Embedding Weaknesses | 向量與嵌入弱點 |
| LLM09 | Misinformation | 錯誤資訊 |
| LLM10 | Unbounded Consumption | 無限制消耗 |

> ⚠️ **非官方**:本網站為非官方整理之檢視介面,與 OWASP 無隸屬關係。內容整理自上述官方文件,中文以官方繁中譯本為準;如有錯誤或出入,請以官方來源為準。

---

## 🛠 本機使用

純靜態網站,不需安裝任何依賴。

```bash
# 方式 A:啟動本機伺服器(建議,跨頁導覽 / 相對路徑最穩定)
uv run python -m http.server 4173
# 然後瀏覽 http://localhost:4173

# 方式 B:直接以瀏覽器開啟 index.html(單頁可看,跨頁連結建議用方式 A)
open index.html
```

> 依專案規範,本機 Python 一律使用 `uv`(不要用裸 `python3` / `pip`)。

### 部署

本站已部署於 **GitHub Pages**(由 `main` 分支根目錄提供):<https://tingwei161803.github.io/owasp-top-10-llm/>。整個 repo 也可直接丟到任何靜態主機(Netlify、Cloudflare Pages…)。已內含 `.nojekyll`,放上 GitHub Pages 時不會被 Jekyll 處理。所有資源皆使用相對路徑,放在子路徑(如 `/<repo>/`)也能正常運作。

---

## 📝 聲明 / License

- 內容著作權歸 **OWASP** 所有,原文件以 **CC BY-SA 4.0** 授權;本整理站之衍生內容同樣依 CC BY-SA 4.0 釋出。
- 介面程式碼(HTML / CSS / JS)以 **MIT** 授權釋出。
- 本站為非官方資源,如為權利人且希望調整或移除內容,請來信或開 issue 聯絡。
