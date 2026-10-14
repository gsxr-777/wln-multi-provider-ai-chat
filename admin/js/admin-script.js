/**
 * GSXR-777 AI Open Chat - Admin JavaScript
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        
        // API Provider selection
        $('#ai_provider').on('change', function() {
            const selectedUrl = $(this).val();
            if (selectedUrl) {
                $('#gsxr_777_api_base_url').val(selectedUrl);
            }
        });

        // API Connection Test
        $('#test_connection').on('click', function(e) {
            e.preventDefault();
            
            const button = $(this);
            const resultDiv = $('#test_result');
            const originalText = button.text();
            
            // Disable button and show loading
            button.prop('disabled', true).text(gsxr777_strings.testing || 'Testing...');
            
            // Get form data
            const data = {
                action: 'gsxr_777_test_connection',
                nonce: gsxr777_ajax.nonce,
                api_base_url: $('[name="gsxr_777_api_base_url"]').val(),
                api_key: $('[name="gsxr_777_api_key"]').val(),
                api_model: $('[name="gsxr_777_api_model"]').val()
            };
            
            $.post(gsxr777_ajax.ajax_url, data)
                .done(function(response) {
                    if (response.success) {
                        resultDiv.html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                    } else {
                        resultDiv.html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>');
                    }
                })
                .fail(function() {
                    resultDiv.html('<div class="notice notice-error"><p>' + (gsxr777_strings.connection_failed || 'Connection test failed') + '</p></div>');
                })
                .always(function() {
                    button.prop('disabled', false).text(originalText);
                });
        });

        // Knowledge Base File Management
        window.loadFile = function(filename) {
            $('#filename').val(filename);
            
            const data = {
                action: 'gsxr_777_get_knowledge_file',
                nonce: gsxr777_ajax.nonce,
                filename: filename
            };
            
            $.post(gsxr777_ajax.ajax_url, data)
                .done(function(response) {
                    if (response.success) {
                        $('#content').val(response.data.content);
                    } else {
                        alert(response.data.message || 'Error loading file');
                    }
                })
                .fail(function() {
                    alert('Error loading file');
                });
        };

        window.newFile = function() {
            $('#filename').val('');
            $('#content').val('');
            $('#filename').focus();
        };

        window.deleteFile = function(filename) {
            if (!confirm(gsxr777_strings.confirm_delete || 'Are you sure you want to delete this file?')) {
                return;
            }
            
            $('#delete_filename').val(filename);
            $('#delete_form').submit();
        };

        // Auto-save knowledge file (debounced)
        let saveTimeout;
        $('#content').on('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function() {
                const filename = $('#filename').val();
                const content = $('#content').val();
                
                if (filename && content) {
                    autoSaveFile(filename, content);
                }
            }, 2000); // Auto-save after 2 seconds of inactivity
        });

        function autoSaveFile(filename, content) {
            const data = {
                action: 'gsxr_777_save_knowledge_file',
                nonce: gsxr777_ajax.nonce,
                filename: filename,
                content: content
            };
            
            $.post(gsxr777_ajax.ajax_url, data)
                .done(function(response) {
                    if (response.success) {
                        showNotice('File auto-saved', 'success', 2000);
                    }
                });
        }

        // Widget Preview
        function updateWidgetPreview() {
            const title = $('[name="gsxr_777_widget_title"]').val();
            const welcome = $('[name="gsxr_777_widget_welcome"]').val();
            const color = $('[name="gsxr_777_widget_primary_color"]').val();
            const position = $('[name="gsxr_777_widget_position"]').val();
            
            // Update preview if it exists
            if ($('#widget_preview').length) {
                $('#widget_preview .preview-title').text(title);
                $('#widget_preview .preview-welcome').text(welcome);
                $('#widget_preview .preview-button').css('background-color', color);
                $('#widget_preview').removeClass('bottom-right bottom-left top-right top-left').addClass(position);
            }
        }

        // Update preview on input change
        $('[name^="gsxr_777_widget_"]').on('input change', updateWidgetPreview);

        // Color picker change
        $('[name="gsxr_777_widget_primary_color"]').on('change', function() {
            $('.gsxr777-color-preview').css('background-color', $(this).val());
            updateWidgetPreview();
        });

        // Initialize color preview
        if ($('[name="gsxr_777_widget_primary_color"]').length) {
            const initialColor = $('[name="gsxr_777_widget_primary_color"]').val();
            $('.gsxr777-color-preview').css('background-color', initialColor);
        }

        // Statistics period change
        $('[name="period"]').on('change', function() {
            $(this).closest('form').submit();
        });

        // Markdown editor enhancements
        if ($('#content').length) {
            const textarea = $('#content')[0];
            
            // Tab key support
            $(textarea).on('keydown', function(e) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    
                    // Insert tab character
                    this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                }
            });
            
            // Auto-resize
            function autoResize() {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
            
            $(textarea).on('input', autoResize);
            autoResize(); // Initial resize
        }

        // Tooltips
        $('[data-tooltip]').each(function() {
            const tooltip = $(this).attr('data-tooltip');
            $(this).attr('title', tooltip);
        });

        // Confirmation dialogs
        $('.gsxr777-confirm').on('click', function(e) {
            const message = $(this).data('confirm') || 'Are you sure?';
            if (!confirm(message)) {
                e.preventDefault();
                return false;
            }
        });

        // Copy to clipboard
        $('.gsxr777-copy').on('click', function(e) {
            e.preventDefault();
            const text = $(this).data('copy') || $(this).prev('input, textarea').val();
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function() {
                    showNotice('Copied to clipboard', 'success', 2000);
                });
            } else {
                // Fallback for older browsers
                const tempInput = $('<textarea>');
                $('body').append(tempInput);
                tempInput.val(text).select();
                document.execCommand('copy');
                tempInput.remove();
                showNotice('Copied to clipboard', 'success', 2000);
            }
        });

        // Show notice
        function showNotice(message, type, duration) {
            type = type || 'info';
            duration = duration || 5000;
            
            const notice = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
            $('.wrap h1').after(notice);
            
            // Auto-dismiss
            setTimeout(function() {
                notice.fadeOut(function() {
                    $(this).remove();
                });
            }, duration);
        }

        // Form validation
        $('form').on('submit', function(e) {
            const form = $(this);
            let isValid = true;
            
            // Check required fields
            form.find('[required]').each(function() {
                const field = $(this);
                if (!field.val().trim()) {
                    field.addClass('error');
                    isValid = false;
                } else {
                    field.removeClass('error');
                }
            });
            
            // Validate API key format
            const apiKey = $('[name="gsxr_777_api_key"]');
            if (apiKey.length && apiKey.val()) {
                const keyValue = apiKey.val().trim();
                if (keyValue.length < 10) {
                    apiKey.addClass('error');
                    showNotice('API key appears to be too short', 'error');
                    isValid = false;
                } else {
                    apiKey.removeClass('error');
                }
            }
            
            // Validate URL format
            const apiUrl = $('[name="gsxr_777_api_base_url"]');
            if (apiUrl.length && apiUrl.val()) {
                const urlValue = apiUrl.val().trim();
                if (!urlValue.match(/^https?:\/\/.+/)) {
                    apiUrl.addClass('error');
                    showNotice('API URL must start with http:// or https://', 'error');
                    isValid = false;
                } else {
                    apiUrl.removeClass('error');
                }
            }
            
            if (!isValid) {
                e.preventDefault();
                return false;
            }
        });

        // Remove error class on input
        $('input, textarea, select').on('input change', function() {
            $(this).removeClass('error');
        });

        // Initialize
        updateWidgetPreview();
        
        // Show loading state for AJAX forms
        $('.gsxr777-ajax-form').on('submit', function() {
            $(this).addClass('gsxr777-loading');
        });

        // Handle AJAX form responses
        $(document).ajaxComplete(function(event, xhr, settings) {
            $('.gsxr777-loading').removeClass('gsxr777-loading');
        });

    });

})(jQuery);

// Global functions for inline usage
window.gsxr777Admin = {
    showNotice: function(message, type, duration) {
        type = type || 'info';
        duration = duration || 5000;
        
        const notice = jQuery('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
        jQuery('.wrap h1').after(notice);
        
        setTimeout(function() {
            notice.fadeOut(function() {
                jQuery(this).remove();
            });
        }, duration);
    },
    
    confirmAction: function(message, callback) {
        if (confirm(message || 'Are you sure?')) {
            if (typeof callback === 'function') {
                callback();
            }
            return true;
        }
        return false;
    }
};