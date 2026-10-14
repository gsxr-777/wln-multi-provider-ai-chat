<?php
/**
 * Plugin Name: WLN Multi-Provider AI Chat
 * Plugin URI: https://github.com/gsxr-777/gsxr-777-ai-open-chat
 * Description: Universal AI chat widget for WordPress with support for OpenAI, Claude, Gemini, Yandex and other LLM providers.
 * Version: 1.4.0
 * Author: WLN Multi-Provider AI Chat
 * Author URI: https://wln.su/
 * Text Domain: wln-multi-provider-ai-chat
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 7.0
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('WLN_MULTI_PROVIDER_AI_CHAT_VERSION', '1.4.0');
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_FILE', __FILE__);
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Load translations
add_action('plugins_loaded', 'wln_multi_provider_ai_chat_load_textdomain');
function wln_multi_provider_ai_chat_load_textdomain() {
    $domain = 'wln-multi-provider-ai-chat';
    $languages_rel_path = dirname(WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_BASENAME) . '/languages';

    // Register plugin languages path for regular WP translation loading.
    load_plugin_textdomain($domain, false, $languages_rel_path);

    // Force-load bundled MO as a fallback/merge source, so recently added strings
    // (for example UI descriptions) are available even with stale global language packs.
    $locale = function_exists('determine_locale') ? determine_locale() : get_locale();
    $mofile = WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_DIR . 'languages/' . $domain . '-' . $locale . '.mo';
    if (file_exists($mofile)) {
        load_textdomain($domain, $mofile);
    }
}

// Load the main plugin class
require_once WLN_MULTI_PROVIDER_AI_CHAT_PLUGIN_DIR . 'includes/class-gsxr-777-core.php';

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
