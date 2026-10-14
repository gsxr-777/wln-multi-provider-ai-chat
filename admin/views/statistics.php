<?php
/**
 * Provide a admin area view for the Statistics
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
    <div class="stats-container">
        <div class="stats-controls">
            <select id="wln-multi-provider-ai-chat-stats-period">
                <option value="7"><?php esc_html_e('Last 7 days', 'wln-multi-provider-ai-chat'); ?></option>
                <option value="30"><?php esc_html_e('Last 30 days', 'wln-multi-provider-ai-chat'); ?></option>
                <option value="90"><?php esc_html_e('Last 90 days', 'wln-multi-provider-ai-chat'); ?></option>
            </select>
        </div>
        <div id="gsxr77-stats-chart">
            <!-- Chart will be rendered here -->
        </div>
        <div class="stats-summary">
            <div class="stat-card">
                <h3><?php esc_html_e('Total Sessions', 'wln-multi-provider-ai-chat'); ?></h3>
                <p id="total-sessions">0</p>
            </div>
            <div class="stat-card">
                <h3><?php esc_html_e('Total Messages', 'wln-multi-provider-ai-chat'); ?></h3>
                <p id="total-messages">0</p>
            </div>
            <div class="stat-card">
                <h3><?php esc_html_e('Avg. Messages/Session', 'wln-multi-provider-ai-chat'); ?></h3>
                <p id="avg-messages">0</p>
            </div>
        </div>
    </div>
</div>
