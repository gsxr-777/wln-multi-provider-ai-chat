<?php
/**
 * Frontend Widget Handler class
 */

if (!defined('ABSPATH')) {
    exit;
}

class GSXR_777_Widget {

    public function __construct() {
        // Constructor
    }

    public function register_rest_routes() {
        register_rest_route('gsxr-777/v1', '/chat', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_chat_message'),
            'permission_callback' => array($this, 'check_rest_permissions')
        ));

        register_rest_route('gsxr-777/v1', '/history/(?P<session_id>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_get_history'),
            'permission_callback' => '__return_true'
        ));
    }

    public function check_rest_permissions() {
        // Allow all requests - rate limiting and security validation done in handle_chat_message
        // This endpoint requires valid message content to be useful
        return true;
    }

    public function handle_chat_message($request) {
        $message = sanitize_textarea_field($request->get_param('message'));
        $session_id = sanitize_text_field($request->get_param('session_id'));
        $context = $request->get_param('context');
        
        // Get user IP
        $ip_address = $this->get_client_ip();
        
        // Security validation
        $security = new GSXR_777_Security();
        $validation = $security->validate_request($message, $session_id, $ip_address);
        
        if (!$validation['valid']) {
            return new WP_Error('security_error', $validation['error'], array('status' => 429));
        }
        
        $sanitized_message = $validation['sanitized_message'];
        
        // Track session and message
        $stats = new GSXR_777_Stats();
        $user_agent = sanitize_text_field($_SERVER['HTTP_USER_AGENT'] ?? '');
        $stats->track_session($session_id, $ip_address, $user_agent);
        $stats->track_message($session_id, 'user', $sanitized_message);
        
        // Get conversation history
        $history = $this->get_conversation_history($session_id);
        
        // Add current message to history
        $history[] = array(
            'role' => 'user',
            'content' => $sanitized_message
        );
        
        // Prepare context
        $chat_context = array();
        if (is_array($context)) {
            $chat_context = array(
                'page_url' => isset($context['url']) ? esc_url_raw($context['url']) : '',
                'page_title' => isset($context['title']) ? sanitize_text_field($context['title']) : '',
                'page_content' => isset($context['content']) ? wp_strip_all_tags($context['content']) : '',
                'selected_text' => isset($context['selectedText']) ? sanitize_textarea_field($context['selectedText']) : ''
            );
        }
        
        // Get AI response
        $api = new GSXR_777_API();
        $response = $api->chat_completion($history, $chat_context);
        
        if (!$response['success']) {
            return new WP_Error('api_error', $response['error'], array('status' => 500));
        }
        
        // Track AI response
        $tokens_used = isset($response['tokens_used']) ? $response['tokens_used'] : 0;
        $stats->track_message($session_id, 'assistant', $response['content'], $tokens_used);
        
        return rest_ensure_response(array(
            'success' => true,
            'message' => $response['content'],
            'tokens_used' => $tokens_used
        ));
    }

    public function handle_get_history($request) {
        $session_id = sanitize_text_field($request->get_param('session_id'));
        
        if (empty($session_id)) {
            return new WP_Error('invalid_session', __('Invalid session ID', 'gsxr-777'), array('status' => 400));
        }
        
        $history = $this->get_conversation_history($session_id);
        
        return rest_ensure_response(array(
            'success' => true,
            'history' => $history
        ));
    }

    public function enqueue_widget_scripts() {
        // Only load on frontend
        if (is_admin()) {
            return;
        }
        
        wp_enqueue_script(
            'gsxr-777-widget',
            GSXR_777_PLUGIN_URL . 'public/js/widget.js',
            array(),
            GSXR_777_VERSION,
            true
        );
        
        wp_enqueue_style(
            'gsxr-777-widget',
            GSXR_777_PLUGIN_URL . 'public/css/widget.css',
            array(),
            GSXR_777_VERSION
        );
        
        // Localize script with settings
        wp_localize_script('gsxr-777-widget', 'gsxr777Config', $this->get_widget_config());
    }

    public function register_shortcode() {
        add_shortcode('gsxr_777_chat', array($this, 'render_shortcode'));
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'title' => get_option('gsxr_777_widget_title', __('Chat', 'gsxr-777')),
            'position' => get_option('gsxr_777_widget_position', 'bottom-right'),
            'color' => get_option('gsxr_777_widget_primary_color', '#2563eb'),
            'width' => get_option('gsxr_777_widget_width', 400),
            'height' => get_option('gsxr_777_widget_height', 600)
        ), $atts, 'gsxr_777_chat');
        
        // Enqueue scripts if not already done
        $this->enqueue_widget_scripts();
        
        // Override config for shortcode using wp_add_inline_script
        // This must be called after wp_enqueue_script and wp_localize_script
        $inline_script = 'if (typeof gsxr777Config !== "undefined") { ' .
            'gsxr777Config.title = ' . wp_json_encode($atts['title']) . '; ' .
            'gsxr777Config.position = ' . wp_json_encode($atts['position']) . '; ' .
            'gsxr777Config.primaryColor = ' . wp_json_encode($atts['color']) . '; ' .
            'gsxr777Config.width = ' . intval($atts['width']) . '; ' .
            'gsxr777Config.height = ' . intval($atts['height']) . '; }';
        
        wp_add_inline_script('gsxr-777-widget', $inline_script);
        
        return '<div id="gsxr-777-chat-shortcode"></div>';
    }

    private function get_widget_config() {
        return array(
            'apiUrl' => rest_url('gsxr-777/v1/chat'),
            'historyUrl' => rest_url('gsxr-777/v1/history/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'title' => get_option('gsxr_777_widget_title', __('Chat', 'gsxr-777')),
            'welcome' => get_option('gsxr_777_widget_welcome', __('Hello! How can I help you?', 'gsxr-777')),
            'placeholder' => get_option('gsxr_777_widget_placeholder', __('Type your message...', 'gsxr-777')),
            'position' => get_option('gsxr_777_widget_position', 'bottom-right'),
            'primaryColor' => get_option('gsxr_777_widget_primary_color', '#2563eb'),
            'width' => intval(get_option('gsxr_777_widget_width', 400)),
            'height' => intval(get_option('gsxr_777_widget_height', 600)),
            'language' => get_locale(),
            'strings' => array(
                'send' => __('Send', 'gsxr-777'),
                'typing' => __('AI is typing...', 'gsxr-777'),
                'error' => __('Sorry, something went wrong. Please try again.', 'gsxr-777'),
                'retry' => __('Retry', 'gsxr-777'),
                'close' => __('Close', 'gsxr-777'),
                'minimize' => __('Minimize', 'gsxr-777'),
                'maximize' => __('Maximize', 'gsxr-777')
            )
        );
    }

    private function get_conversation_history($session_id, $limit = 20) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'gsxr777_messages';
        
        // Validate limit
        $max_limit = 100;
        $limit = min(intval($limit), $max_limit);
        $limit = max(1, $limit);
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT role, content FROM {$table_name} 
             WHERE session_id = %s 
             ORDER BY created_at ASC 
             LIMIT %d",
            $session_id,
            $limit
        ));
        
        // Handle null result
        if (is_null($results)) {
            return array();
        }
        
        $history = array();
        foreach ($results as $row) {
            $history[] = array(
                'role' => $row->role,
                'content' => $row->content
            );
        }
        
        return $history;
    }

    private function get_client_ip() {
        // Trust only specific headers, prioritize Cloudflare and X-Forwarded-For
        $ip = null;
        
        // Cloudflare IP
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $ip = sanitize_text_field($_SERVER['HTTP_CF_CONNECTING_IP']);
        } 
        // Standard proxy headers
        elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            // Get the first IP in the list
            $ips = array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']));
            $ip = $ips[0];
        } 
        // Direct connection
        else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        }
        
        // Sanitize and validate IP
        $ip = sanitize_text_field($ip);
        if (!filter_var($ip, FILTER_VALIDATE_IP)) {
            return '127.0.0.1';
        }
        
        return $ip;
    }
}