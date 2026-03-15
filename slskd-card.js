const LitElement = Object.getPrototypeOf(
  customElements.get("ha-panel-lovelace") || customElements.get("hc-lovelace")
);
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class SlskdCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _searchText: { type: String },
    };
  }

  constructor() {
    super();
    this._searchText = "";
  }

  setConfig(config) {
    if (
      !config.search_entity ||
      !config.download_entity ||
      !config.connection_entity
    ) {
      throw new Error(
        "Please define search_entity, download_entity, and connection_entity"
      );
    }
    this.config = config;
  }

  getCardSize() {
    return 4;
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  // ── Data helpers ──

  get _connectionState() {
    const entity = this.hass?.states?.[this.config.connection_entity];
    return entity?.state === "on";
  }

  get _searchState() {
    return this.hass?.states?.[this.config.search_entity];
  }

  get _downloadState() {
    return this.hass?.states?.[this.config.download_entity];
  }

  get _results() {
    const attrs = this._searchState?.attributes;
    if (!attrs?.results) return [];
    return attrs.results.slice(0, 10);
  }

  get _searchStatus() {
    const attrs = this._searchState?.attributes;
    return attrs?.search_state || "";
  }

  get _totalFound() {
    const state = this._searchState?.state;
    return state ? parseInt(state, 10) : 0;
  }

  // ── Actions ──

  _handleSearch() {
    if (!this._searchText.trim()) return;
    this.hass.callService("slskd", "search", {
      search_text: this._searchText.trim(),
    });
  }

  _handleKeyDown(e) {
    if (e.key === "Enter") {
      this._handleSearch();
    }
  }

  _handleInput(e) {
    this._searchText = e.target.value;
  }

  _handleDownload(result) {
    this.hass.callService("slskd", "download", {
      username: result.username,
      filename: result.filename,
      size: result.size,
    });
  }

  // ── Rendering ──

  render() {
    if (!this.config || !this.hass) return html``;

    const results = this._results;
    const hasResults = results.length > 0;
    const isSearching = this._searchStatus === "InProgress";
    const showStatus = hasResults || isSearching;
    const dlState = this._downloadState;
    const hasDl = dlState && dlState.state !== "unknown" && dlState.state !== "unavailable";

    return html`
      <ha-card>
        <div class="card-inner">
          ${this._renderHeader()}
          ${this._renderSearch()}
          ${showStatus ? this._renderStatus() : ""}
          ${hasResults ? this._renderResults(results) : this._renderEmpty()}
          ${hasDl ? html`<div class="divider"></div>${this._renderDownload(dlState)}` : ""}
        </div>
      </ha-card>
    `;
  }

  _renderHeader() {
    const connected = this._connectionState;
    const title = this.config.title || "slskd";
    return html`
      <div class="card-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l2 2 4-4"/>
        </svg>
        <span class="card-title">${title}</span>
        <div class="connection-dot ${connected ? "on" : "off"}"
             title="${connected ? "Connected" : "Disconnected"}"></div>
      </div>
    `;
  }

  _renderSearch() {
    return html`
      <div class="search-section">
        <div class="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Search Soulseek…"
            .value="${this._searchText}"
            @input="${this._handleInput}"
            @keydown="${this._handleKeyDown}"
          />
          <button class="search-btn" @click="${this._handleSearch}">Search</button>
        </div>
      </div>
    `;
  }

  _renderStatus() {
    const total = this._totalFound;
    const shown = Math.min(total, 10);
    const status = this._searchStatus;
    return html`
      <div class="status-bar">
        <span class="label">Results</span>
        <span class="badge">${status || "Completed"}</span>
        <span class="count">${total} found · showing ${shown}</span>
      </div>
    `;
  }

  _renderEmpty() {
    const isSearching = this._searchStatus === "InProgress";
    return html`
      <div class="empty-state">
        ${isSearching
          ? html`
            <div class="spinner"></div>
            <div>Searching Soulseek…</div>
          `
          : html`
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <div>Search for tracks to get started</div>
          `
        }
      </div>
    `;
  }

  _renderResults(results) {
    return html`
      <div class="results-list">
        ${results.map(
          (r, i) => html`
            <div class="result-item" @click="${() => this._handleDownload(r)}">
              <span class="result-index">${i + 1}</span>
              <div class="result-info">
                <div class="result-filename" title="${r.filename}">${this._extractFilename(r.filename)}</div>
                <div class="result-meta">
                  <span class="user">${r.username}</span>
                  <span class="sep">·</span>
                  <span>${r.bitrate || ""} kbps</span>
                  <span class="sep">·</span>
                  <span>${this._formatSize(r.size)}</span>
                </div>
              </div>
              <button class="dl-btn" title="Download" @click="${(e) => { e.stopPropagation(); this._handleDownload(r); }}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          `
        )}
      </div>
    `;
  }

  _renderDownload(dlState) {
    const attrs = dlState.attributes || {};
    const progress = attrs.progress_pct || 0;
    const filename = attrs.filename || "";
    const username = attrs.username || "";
    const size = attrs.size ? this._formatSize(attrs.size) : "";
    const isComplete = progress >= 100;
    const statusLabel = isComplete ? "Completed" : "In Progress";

    return html`
      <div class="download-section">
        <div class="download-header">
          <span class="label">Last Download</span>
          <span class="status-chip ${isComplete ? "completed" : "in-progress"}">
            ${statusLabel}
          </span>
        </div>
        <div class="download-track">
          <div class="download-filename" title="${filename}">${filename}</div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill ${isComplete ? "completed" : ""}"
                 style="width: ${Math.min(progress, 100)}%"></div>
          </div>
          <div class="download-stats">
            <span>${username}</span>
            <span>${size}</span>
            <span class="pct ${isComplete ? "completed" : ""}">${Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  _extractFilename(path) {
    if (!path) return "";
    const parts = path.split("\\");
    return parts[parts.length - 1] || path;
  }

  _formatSize(bytes) {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }

  // ── Styles ──

  static get styles() {
    return css`
      :host {
        --slskd-bg: var(--card-background-color, #1c1c1e);
        --slskd-surface: var(--secondary-background-color, #2c2c2e);
        --slskd-border: var(--divider-color, #3a3a3c);
        --slskd-text: var(--primary-text-color, #e5e5e7);
        --slskd-text-secondary: var(--secondary-text-color, #8e8e93);
        --slskd-text-tertiary: #636366;
        --slskd-accent: #d4a54a;
        --slskd-accent-dim: rgba(212, 165, 74, 0.12);
        --slskd-success: #30d158;
        --slskd-success-dim: rgba(48, 209, 88, 0.12);
      }

      ha-card {
        background: var(--slskd-bg);
        border-radius: 12px;
        overflow: hidden;
      }

      .card-inner {
        padding: 0;
      }

      /* ── Header ── */
      .card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 20px 12px;
        border-bottom: 1px solid var(--slskd-border);
      }

      .card-header svg {
        width: 20px;
        height: 20px;
        color: var(--slskd-accent);
        flex-shrink: 0;
      }

      .card-title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--slskd-text);
      }

      .connection-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        margin-left: auto;
      }

      .connection-dot.on {
        background: var(--slskd-success);
        box-shadow: 0 0 6px rgba(48, 209, 88, 0.5);
        animation: pulse-dot 2.5s ease-in-out infinite;
      }

      .connection-dot.off {
        background: #ff453a;
        box-shadow: 0 0 6px rgba(255, 69, 58, 0.5);
      }

      @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* ── Search ── */
      .search-section {
        padding: 16px 20px;
      }

      .search-bar {
        display: flex;
        align-items: center;
        background: var(--slskd-surface);
        border-radius: 12px;
        border: 1px solid var(--slskd-border);
        overflow: hidden;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .search-bar:focus-within {
        border-color: var(--slskd-accent);
        box-shadow: 0 0 0 3px var(--slskd-accent-dim);
      }

      .search-bar svg {
        width: 16px;
        height: 16px;
        color: var(--slskd-text-tertiary);
        margin-left: 14px;
        flex-shrink: 0;
      }

      .search-bar input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: var(--slskd-text);
        font-family: inherit;
        font-size: 14px;
        padding: 12px;
      }

      .search-bar input::placeholder {
        color: var(--slskd-text-tertiary);
      }

      .search-btn {
        background: var(--slskd-accent);
        border: none;
        color: #1c1c1e;
        font-family: inherit;
        font-weight: 600;
        font-size: 13px;
        padding: 12px 18px;
        cursor: pointer;
        letter-spacing: 0.02em;
        transition: background 0.15s;
      }

      .search-btn:hover {
        background: #e0b35c;
      }

      /* ── Status Bar ── */
      .status-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 20px;
        margin-bottom: 4px;
      }

      .status-bar .label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--slskd-text-tertiary);
      }

      .status-bar .badge {
        font-size: 11px;
        font-weight: 500;
        color: var(--slskd-accent);
        background: var(--slskd-accent-dim);
        padding: 2px 8px;
        border-radius: 4px;
      }

      .status-bar .count {
        margin-left: auto;
        font-size: 11px;
        color: var(--slskd-text-secondary);
      }

      /* ── Results ── */
      .results-list {
        padding: 8px 12px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .result-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s;
      }

      .result-item:hover {
        background: var(--slskd-surface);
      }

      .result-item:hover .dl-btn {
        opacity: 1;
      }

      .result-index {
        font-size: 11px;
        color: var(--slskd-text-tertiary);
        width: 16px;
        text-align: right;
        flex-shrink: 0;
      }

      .result-info {
        flex: 1;
        min-width: 0;
      }

      .result-filename {
        font-size: 13px;
        font-weight: 500;
        color: var(--slskd-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.3;
      }

      .result-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 2px;
        font-size: 11px;
        color: var(--slskd-text-tertiary);
      }

      .result-meta .sep {
        color: var(--slskd-border);
      }

      .result-meta .user {
        color: var(--slskd-text-secondary);
      }

      .dl-btn {
        width: 30px;
        height: 30px;
        border-radius: 6px;
        border: 1px solid var(--slskd-border);
        background: var(--slskd-surface);
        color: var(--slskd-text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.15s, background 0.15s, color 0.15s, border-color 0.15s;
      }

      .dl-btn:hover {
        background: var(--slskd-accent-dim);
        border-color: var(--slskd-accent);
        color: var(--slskd-accent);
      }

      .dl-btn svg {
        width: 14px;
        height: 14px;
      }

      /* ── Divider ── */
      .divider {
        height: 1px;
        background: var(--slskd-border);
        margin: 4px 20px;
      }

      /* ── Download ── */
      .download-section {
        padding: 12px 20px 16px;
      }

      .download-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      .download-header .label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--slskd-text-tertiary);
      }

      .status-chip {
        font-size: 10px;
        font-weight: 500;
        padding: 2px 7px;
        border-radius: 4px;
        margin-left: auto;
      }

      .status-chip.in-progress {
        color: var(--slskd-accent);
        background: var(--slskd-accent-dim);
      }

      .status-chip.completed {
        color: var(--slskd-success);
        background: var(--slskd-success-dim);
      }

      .download-track {
        background: var(--slskd-surface);
        border-radius: 8px;
        padding: 12px 14px;
      }

      .download-filename {
        font-size: 13px;
        font-weight: 500;
        color: var(--slskd-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 8px;
      }

      .progress-bar-container {
        position: relative;
        height: 4px;
        background: rgba(212, 165, 74, 0.08);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-bar-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(90deg, var(--slskd-accent), #e0b35c);
        border-radius: 2px;
        transition: width 0.6s ease;
      }

      .progress-bar-fill.completed {
        background: linear-gradient(90deg, var(--slskd-success), #34d65c);
      }

      .download-stats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        color: var(--slskd-text-tertiary);
      }

      .download-stats .pct {
        color: var(--slskd-accent);
        font-weight: 500;
      }

      .download-stats .pct.completed {
        color: var(--slskd-success);
      }

      /* ── Empty State ── */
      .empty-state {
        text-align: center;
        padding: 32px 20px;
        color: var(--slskd-text-tertiary);
        font-size: 13px;
      }

      .empty-state svg {
        width: 32px;
        height: 32px;
        margin-bottom: 10px;
        opacity: 0.3;
      }

      .spinner {
        width: 28px;
        height: 28px;
        border: 2.5px solid var(--slskd-border);
        border-top-color: var(--slskd-accent);
        border-radius: 50%;
        margin: 0 auto 10px;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Mobile: always show download buttons */
      @media (hover: none) {
        .dl-btn {
          opacity: 1;
        }
      }
    `;
  }
}

customElements.define("slskd-card", SlskdCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "slskd-card",
  name: "slskd Card",
  description: "Search and download music from Soulseek via slskd",
  preview: false,
});
