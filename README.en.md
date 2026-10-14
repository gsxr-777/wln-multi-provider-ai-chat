# WLN Multi-Provider AI Chat

**English** · [Русский](README.ru.md) · [Latest release](https://github.com/gsxr-777/wln-multi-provider-ai-chat/releases/latest) · [Version archive](archives/README.md)

A WordPress plugin that adds a floating AI chat widget. Administrators choose the AI service and model, configure the widget, and optionally provide public site content and Markdown documents as reference material.

Current version: **1.4.8**. Previously named **GSXR-777 AI Open Chat**.

## Features

- OpenAI, Anthropic Claude, Google Gemini, YandexGPT, OpenRouter, local Ollama, and custom OpenAI-compatible endpoints.
- Model selection, generation parameters, and system instructions.
- A local knowledge index of published, publicly viewable posts and pages without passwords, plus administrator-supplied Markdown documents.
- Optional page context and limited conversation history.
- Configurable widget colors, fonts, dimensions, position, and welcome message.
- Signed visitor sessions, rate limits, and encrypted API-key storage.
- Conversation statistics, retention settings, and visitor-controlled history deletion.
- Bundled Russian translation and Polylang integration for saved widget strings.

Plugin features require no paid plugin license or subscription. External AI services may charge for requests.

## Requirements and installation

WordPress **5.0+**, PHP **7.4+**, PHP OpenSSL with **AES-256-GCM**, and network access from the WordPress server to the selected endpoint.

1. Download the plugin ZIP from the **Assets** section of the [latest release](https://github.com/gsxr-777/wln-multi-provider-ai-chat/releases/latest). For 1.4.8, use `wln-multi-provider-ai-chat-1.4.8-wordpress-org.zip`.
2. In WordPress, select **Plugins → Add New → Upload Plugin**, install the ZIP, and activate it.
3. Open **AI Chat → API Settings**, set the endpoint, model, and API key, test the connection, and save. For an Ollama server that ignores authentication, enter a non-empty placeholder such as `ollama`.
4. Configure **Widget Settings** and optionally add Markdown documents under **Knowledge Base**.

The frontend displays one global floating widget. Both `[wln_multi_provider_ai_chat]` and the legacy `[gsxr_777_chat]` shortcode remain recognized.

## Migrating from the previous name

Back up the site, deactivate the old GSXR-777 AI Open Chat copy, install and activate this plugin, and verify its configuration. The first directory/main-file rename requires manual activation.

Do not activate both copies together. Do not use WordPress's Delete action on the old copy if data removal is enabled: both versions share stored data. Existing settings, keys, tables, and legacy shortcodes are retained for compatibility. Deactivation does not delete settings.

## Data and services

Conversations and statistics are stored in the site's WordPress database. Signed session credentials are stored in the visitor's browser localStorage.

Provider requests occur when a visitor sends a message or an administrator tests the connection. They contain the API credential, model, generation parameters, system instructions, the message, limited history, and relevant knowledge excerpts. Optional page context may include the page URL, title, excerpt, and selected text.

Only upload knowledge intended for public visitors. Review content indexing when third-party plugins restrict access, and update the site's privacy notice for conversation storage and the selected provider. See [readme.txt](readme.txt) for full service disclosures and policy links.

## Versions and source

The repository root contains current 1.4.8 sources. [Releases](https://github.com/gsxr-777/wln-multi-provider-ai-chat/releases) provide installation ZIPs. Version tags from `v1.1.0` through `v1.4.8` identify available versions; extra tags preserve distinct snapshots sharing a version number.

[archives/README.md](archives/README.md) lists all discovered unique plugin packages and language packs, with SHA-256 checksums. Imported commit dates are not original release or development dates. The original Git history remains in [gsxr-777-ai-open-chat](https://github.com/gsxr-777/gsxr-777-ai-open-chat).

Use the latest version for installation. See [readme.txt](readme.txt) for the changelog.

## Source layout

`wln-multi-provider-ai-chat.php` is the plugin entry point. `includes/` contains the core, API, knowledge, security, statistics, and widget classes; `admin/` contains administration assets and views; `public/` contains frontend CSS and JavaScript; `languages/` contains translations; `assets/` contains banners and icons; `archives/` stores historical packages.

## License

[GPL-2.0-or-later](LICENSE). This independent plugin is not affiliated with the listed AI providers.
