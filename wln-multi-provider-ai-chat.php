<?php
/**
 * Plugin Name: WLN Multi-Provider AI Chat
 * Description: Universal AI chat widget for WordPress with support for OpenAI, Claude, Gemini, Yandex and other LLM providers.
 * Version: 1.4.1
 * Author: WLN Multi-Provider AI Chat
 * Author URI: https://wln.su/
 * Text Domain: wln-multi-provider-ai-chat
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 7.1
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('WLN_MULTI_PROVIDER_AI_CHAT_VERSION', '1.4.1');
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_FILE', __FILE__);
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// WordPress.org loads translations for the plugin text domain automatically.

// Load the main plugin class
require_once WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_DIR . 'includes/class-wln-multi-provider-ai-chat-core.php';

// Initialize the plugin
function wln_multi_provider_ai_chat_init() {
    $plugin = new WLN_Multi_Provider_AI_Chat_Core();
    $plugin->run();
}
add_action('plugins_loaded', 'wln_multi_provider_ai_chat_init');

// Activation hook
register_activation_hook(__FILE__, array('WLN_Multi_Provider_AI_Chat_Core', 'activate'));

// Deactivation hook
register_deactivation_hook(__FILE__, array('WLN_Multi_Provider_AI_Chat_Core', 'deactivate'));

// Uninstall hook
register_uninstall_hook(__FILE__, array('WLN_Multi_Provider_AI_Chat_Core', 'uninstall'));
