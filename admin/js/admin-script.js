/**
 * WLN Multi-Provider AI Chat admin interactions.
 */

(function () {
    'use strict';

    if (typeof wlnMultiProviderAIChatAdmin === 'undefined') {
        return;
    }

    const strings = wlnMultiProviderAIChatAdmin.strings || {};

    const showNotice = (container, type, message) => {
        if (!container) {
            return;
        }

        const notice = document.createElement('div');
        notice.className = `notice notice-${type}`;
        const text = document.createElement('p');
        text.textContent = String(message || strings.requestFailed || 'Request failed');
        notice.appendChild(text);
        container.replaceChildren(notice);
    };

    const postAjax = async (data) => {
        const response = await fetch(wlnMultiProviderAIChatAdmin.ajax_url, {
            method: 'POST',
            credentials: 'same-origin',
            body: data
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(strings.requestFailed || 'Request failed');
        }
        return payload;
    };

    const setupProviderControls = () => {
        const provider = document.getElementById('ai_provider');
        const urlField = document.getElementById('gsxr_777_api_base_url');
        const keyLink = document.getElementById('key_link');
        const docLink = document.getElementById('doc_link');
        if (!provider || !urlField || !keyLink || !docLink) {
            return;
        }

        const updateLinks = () => {
            const selected = provider.options[provider.selectedIndex];
            const hasProvider = Boolean(provider.value);
            keyLink.hidden = !hasProvider;
            docLink.hidden = !hasProvider;
            if (hasProvider) {
                keyLink.href = selected.dataset.keyUrl || '#';
                docLink.href = selected.dataset.docUrl || '#';
            }
        };

        provider.addEventListener('change', () => {
            if (provider.value) {
                urlField.value = provider.value;
            }
            updateLinks();
        });
        updateLinks();
    };

    const setupConnectionTest = () => {
        const button = document.getElementById('test_connection');
        const result = document.getElementById('test_result');
        if (!button || !result) {
            return;
        }

        button.addEventListener('click', async () => {
            const data = new FormData();
            data.append('action', 'gsxr_777_test_connection');
            data.append('nonce', wlnMultiProviderAIChatAdmin.testNonce);

            const fields = {
                api_base_url: 'gsxr_777_api_base_url',
                api_key: 'gsxr_777_api_key',
                api_key_masked: 'gsxr_777_api_key_masked',
                api_model: 'gsxr_777_api_model',
                api_project_id: 'gsxr_777_api_project_id'
            };
            Object.entries(fields).forEach(([requestName, fieldName]) => {
                const field = document.querySelector(`[name="${fieldName}"]`);
                data.append(requestName, field?.value || '');
            });

            button.disabled = true;
            button.textContent = strings.testing || 'Testing...';
            try {
                const response = await postAjax(data);
                showNotice(
                    result,
                    response.success ? 'success' : 'error',
                    response.data?.message
                );
            } catch (error) {
                showNotice(result, 'error', error.message || strings.connectionFailed);
            } finally {
                button.disabled = false;
                button.textContent = strings.testConnection || 'Test Connection';
            }
        });
    };

    const setupKnowledgeManager = () => {
        const filenameField = document.getElementById('filename');
        const contentField = document.getElementById('content');
        if (!filenameField || !contentField) {
            return;
        }

        document.getElementById('wln-multi-provider-ai-chat-new-file')?.addEventListener('click', () => {
            filenameField.value = '';
            contentField.value = '';
            filenameField.focus();
        });

        const rebuildButton = document.getElementById('wln-multi-provider-ai-chat-rebuild-index');
        const rebuildStatus = document.getElementById('wln-multi-provider-ai-chat-index-status');
        rebuildButton?.addEventListener('click', async () => {
            const data = new FormData();
            data.append('action', 'gsxr_777_rebuild_knowledge_index');
            data.append('nonce', wlnMultiProviderAIChatAdmin.knowledgeNonce);
            rebuildButton.disabled = true;
            if (rebuildStatus) {
                rebuildStatus.textContent = strings.testing || 'Working...';
            }

            try {
                const response = await postAjax(data);
                if (!response.success) {
                    throw new Error(response.data?.message || strings.requestFailed);
                }
                if (rebuildStatus) {
                    rebuildStatus.textContent = response.data.message || '';
                }
            } catch (error) {
                if (rebuildStatus) {
                    rebuildStatus.textContent = error.message || strings.requestFailed;
                }
            } finally {
                rebuildButton.disabled = false;
            }
        });

        document.querySelectorAll('.wln-multi-provider-ai-chat-load-file').forEach((link) => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                const filename = link.dataset.filename || '';
                const data = new FormData();
                data.append('action', 'gsxr_777_get_knowledge_file');
                data.append('nonce', wlnMultiProviderAIChatAdmin.knowledgeNonce);
                data.append('filename', filename);

                try {
                    const response = await postAjax(data);
                    if (!response.success) {
                        throw new Error(response.data?.message || strings.requestFailed);
                    }
                    filenameField.value = filename;
                    contentField.value = response.data.content || '';
                    contentField.focus();
                } catch (error) {
                    window.alert(error.message || strings.requestFailed);
                }
            });
        });

        document.querySelectorAll('.wln-multi-provider-ai-chat-delete-file').forEach((button) => {
            button.addEventListener('click', async () => {
                if (!window.confirm(strings.deleteConfirm || 'Delete this file?')) {
                    return;
                }

                const data = new FormData();
                data.append('action', 'gsxr_777_delete_knowledge_file');
                data.append('nonce', wlnMultiProviderAIChatAdmin.knowledgeNonce);
                data.append('filename', button.dataset.filename || '');
                button.disabled = true;

                try {
                    const response = await postAjax(data);
                    if (!response.success) {
                        throw new Error(response.data?.message || strings.deleteFailed);
                    }
                    window.location.reload();
                } catch (error) {
                    button.disabled = false;
                    window.alert(error.message || strings.deleteFailed);
                }
            });
        });
    };

    const setupStatistics = () => {
        const period = document.getElementById('wln-multi-provider-ai-chat-stats-period');
        period?.addEventListener('change', () => period.form?.submit());
    };

    const initialize = () => {
        setupProviderControls();
        setupConnectionTest();
        setupKnowledgeManager();
        setupStatistics();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
