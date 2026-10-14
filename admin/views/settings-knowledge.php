<?php
/**
 * Provide a admin area view for the Knowledge Base Settings
 *
 * This file is used to markup the admin-facing aspects of the plugin.
 *
 * @link       https://wln.su/
 * @since      1.0.0
 *
 * @package    WLN_Multi_Provider_AI_Chat
 * @subpackage WLN_Multi_Provider_AI_Chat/admin/partials
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<!-- This file should primarily consist of HTML with a little bit of PHP. -->
<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
    <div id="wln-multi-provider-ai-chat-knowledge-manager">
        <div class="knowledge-toolbar">
            <button type="button" id="wln-multi-provider-ai-chat-add-file" class="button button-primary"><?php esc_html_e('Add New File', 'wln-multi-provider-ai-chat'); ?></button>
            <input type="file" id="wln-multi-provider-ai-chat-upload-file" accept=".md" hidden>
            <button type="button" id="wln-multi-provider-ai-chat-upload-btn" class="button"><?php esc_html_e('Upload File', 'wln-multi-provider-ai-chat'); ?></button>
        </div>
        <div id="wln-multi-provider-ai-chat-file-list">
            <!-- File list will be populated via AJAX -->
        </div>
        <div id="wln-multi-provider-ai-chat-file-editor" hidden>
            <!-- Editor will be populated when file is selected -->
        </div>
    </div>
</div>
