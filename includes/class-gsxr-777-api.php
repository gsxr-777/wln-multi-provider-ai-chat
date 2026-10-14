<?php
/**
 * API Integration class
 */

if (!defined('ABSPATH')) {
    exit;
}

class GSXR_777_API {

    public function __construct() {
        // Constructor
    }

    public function chat_completion($messages, $context = array()) {
        $api_base_url = get_option('gsxr_777_api_base_url');
        $api_key = $this->decrypt_api_key(get_option('gsxr_777_api_key'));
        $api_model = get_option('gsxr_777_api_model');
        $temperature = get_option('gsxr_777_api_temperature', 0.7);
        $max_tokens = get_option('gsxr_777_api_max_tokens', 1000);

        if (empty($api_base_url) || empty($api_key) || empty($api_model)) {
            return array(
                'success' => false,
                'error' => __('API configuration is incomplete', 'gsxr-777')
            );
        }

        // Build system prompt with context
        $system_prompt = $this->build_system_prompt($context);
        
        // Prepare messages array
        $api_messages = array();
        if (!empty($system_prompt)) {
            $api_messages[] = array(
                'role' => 'system',
                'content' => $system_prompt
            );
        }
        
        // Add conversation messages
        foreach ($messages as $message) {
            $api_messages[] = array(
                'role' => $message['role'],
                'content' => $message['content']
            );
        }

        // Prepare request payload
        $payload = array(
            'model' => $api_model,
            'messages' => $api_messages,
            'temperature' => floatval($temperature),
            'max_tokens' => intval($max_tokens)
        );

        // Determine API format based on base URL
        if (strpos($api_base_url, 'anthropic.com') !== false) {
            return $this->send_anthropic_request($api_base_url, $api_key, $payload);
        } elseif (strpos($api_base_url, 'generativelanguage.googleapis.com') !== false) {
            return $this->send_gemini_request($api_base_url, $api_key, $payload);
        } else {
            // Default to OpenAI format
            return $this->send_openai_request($api_base_url, $api_key, $payload);
        }
    }

    public function encrypt_api_key($key) {
        if (empty($key)) {
            return '';
        }
        
        // Check if OpenSSL is available
        if (!function_exists('openssl_encrypt')) {
            error_log('GSXR-777: OpenSSL not available, cannot encrypt API key');
            return '';
        }
        
        $encryption_key = wp_salt('auth');
        $iv = openssl_random_pseudo_bytes(16);
        
        $encrypted = openssl_encrypt(
            $key,
            'AES-256-CBC',
            $encryption_key,
            0,
            $iv
        );
        
        return base64_encode($iv . $encrypted);
    }

    public function decrypt_api_key($encrypted_key) {
        if (empty($encrypted_key)) {
            return '';
        }
        
        if (!function_exists('openssl_decrypt')) {
            return base64_decode($encrypted_key); // Fallback
        }
        
        $encryption_key = wp_salt('auth');
        $data = base64_decode($encrypted_key);
        
        if ($data === false) {
            return '';
        }
        
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        
        return openssl_decrypt(
            $encrypted,
            'AES-256-CBC',
            $encryption_key,
            0,
            $iv
        );
    }

    public function test_connection($api_base_url = null, $api_key = null, $api_model = null) {
        $api_base_url = $api_base_url ?: get_option('gsxr_777_api_base_url');
        $api_key = $api_key ?: $this->decrypt_api_key(get_option('gsxr_777_api_key'));
        $api_model = $api_model ?: get_option('gsxr_777_api_model');

        if (empty($api_base_url) || empty($api_key) || empty($api_model)) {
            return array(
                'success' => false,
                'error' => __('API configuration is incomplete', 'gsxr-777')
            );
        }

        // Simple test message
        $test_messages = array(
            array(
                'role' => 'user',
                'content' => 'Hello, this is a test message. Please respond with "Test successful".'
            )
        );

        $result = $this->chat_completion($test_messages);
        
        if ($result['success']) {
            return array(
                'success' => true,
                'message' => __('Connection test successful!', 'gsxr-777')
            );
        } else {
            return array(
                'success' => false,
                'error' => $result['error']
            );
        }
    }

    public function build_system_prompt($context) {
        $knowledge = new GSXR_777_Knowledge();
        $knowledge_content = $knowledge->get_aggregated_content();
        
        $prompt = __('You are a helpful AI assistant integrated into a WordPress website.', 'gsxr-777');
        
        if (!empty($knowledge_content)) {
            $prompt .= "\n\n" . __('Knowledge Base:', 'gsxr-777') . "\n" . $knowledge_content;
        }
        
        if (!empty($context['page_url'])) {
            $prompt .= "\n\n" . __('Current page URL:', 'gsxr-777') . ' ' . $context['page_url'];
        }
        
        if (!empty($context['page_title'])) {
            $prompt .= "\n" . __('Page title:', 'gsxr-777') . ' ' . $context['page_title'];
        }
        
        if (!empty($context['page_content'])) {
            $prompt .= "\n" . __('Page content:', 'gsxr-777') . "\n" . substr($context['page_content'], 0, 2000);
        }
        
        if (!empty($context['selected_text'])) {
            $prompt .= "\n\n" . __('User selected text:', 'gsxr-777') . "\n" . $context['selected_text'];
        }
        
        return $prompt;
    }

    private function send_openai_request($api_base_url, $api_key, $payload) {
        $endpoint = rtrim($api_base_url, '/') . '/chat/completions';
        
        $headers = array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $api_key
        );
        
        $response = wp_remote_post($endpoint, array(
            'headers' => $headers,
            'body' => json_encode($payload),
            'timeout' => 15  // Reduced timeout from 30 to 15 seconds
        ));
        
        if (is_wp_error($response)) {
            error_log('GSXR-777 API Error: ' . $response->get_error_message());
            return array(
                'success' => false,
                'error' => $response->get_error_message()
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            $error_message = isset($data['error']['message']) ? $data['error']['message'] : __('API request failed', 'gsxr-777');
            error_log('GSXR-777 API Response Error: ' . $error_message);
            return array(
                'success' => false,
                'error' => $error_message
            );
        }
        
        if (isset($data['choices'][0]['message']['content'])) {
            return array(
                'success' => true,
                'content' => $data['choices'][0]['message']['content'],
                'tokens_used' => isset($data['usage']['total_tokens']) ? $data['usage']['total_tokens'] : 0
            );
        }
        
        error_log('GSXR-777 Invalid API response format');
        return array(
            'success' => false,
            'error' => __('Invalid API response format', 'gsxr-777')
        );
    }

    private function send_anthropic_request($api_base_url, $api_key, $payload) {
        $endpoint = rtrim($api_base_url, '/') . '/messages';
        
        // Convert OpenAI format to Anthropic format
        $system_message = '';
        $messages = array();
        
        foreach ($payload['messages'] as $message) {
            if ($message['role'] === 'system') {
                $system_message = $message['content'];
            } else {
                $messages[] = $message;
            }
        }
        
        $anthropic_payload = array(
            'model' => $payload['model'],
            'max_tokens' => $payload['max_tokens'],
            'messages' => $messages
        );
        
        if (!empty($system_message)) {
            $anthropic_payload['system'] = $system_message;
        }
        
        $headers = array(
            'Content-Type' => 'application/json',
            'x-api-key' => $api_key,
            'anthropic-version' => '2023-06-01'
        );
        
        $response = wp_remote_post($endpoint, array(
            'headers' => $headers,
            'body' => json_encode($anthropic_payload),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'error' => $response->get_error_message()
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            $error_message = isset($data['error']['message']) ? $data['error']['message'] : __('API request failed', 'gsxr-777');
            return array(
                'success' => false,
                'error' => $error_message
            );
        }
        
        if (isset($data['content'][0]['text'])) {
            return array(
                'success' => true,
                'content' => $data['content'][0]['text'],
                'tokens_used' => isset($data['usage']['output_tokens']) ? $data['usage']['output_tokens'] : 0
            );
        }
        
        return array(
            'success' => false,
            'error' => __('Invalid API response format', 'gsxr-777')
        );
    }

    private function send_gemini_request($api_base_url, $api_key, $payload) {
        $model = $payload['model'];
        $endpoint = rtrim($api_base_url, '/') . '/models/' . $model . ':generateContent?key=' . $api_key;
        
        // Convert OpenAI format to Gemini format
        $contents = array();
        $system_instruction = '';
        
        foreach ($payload['messages'] as $message) {
            if ($message['role'] === 'system') {
                $system_instruction = $message['content'];
            } else {
                $role = $message['role'] === 'assistant' ? 'model' : 'user';
                $contents[] = array(
                    'role' => $role,
                    'parts' => array(
                        array('text' => $message['content'])
                    )
                );
            }
        }
        
        $gemini_payload = array(
            'contents' => $contents,
            'generationConfig' => array(
                'temperature' => $payload['temperature'],
                'maxOutputTokens' => $payload['max_tokens']
            )
        );
        
        if (!empty($system_instruction)) {
            $gemini_payload['systemInstruction'] = array(
                'parts' => array(
                    array('text' => $system_instruction)
                )
            );
        }
        
        $headers = array(
            'Content-Type' => 'application/json'
        );
        
        $response = wp_remote_post($endpoint, array(
            'headers' => $headers,
            'body' => json_encode($gemini_payload),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'error' => $response->get_error_message()
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (wp_remote_retrieve_response_code($response) !== 200) {
            $error_message = isset($data['error']['message']) ? $data['error']['message'] : __('API request failed', 'gsxr-777');
            return array(
                'success' => false,
                'error' => $error_message
            );
        }
        
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return array(
                'success' => true,
                'content' => $data['candidates'][0]['content']['parts'][0]['text'],
                'tokens_used' => isset($data['usageMetadata']['totalTokenCount']) ? $data['usageMetadata']['totalTokenCount'] : 0
            );
        }
        
        return array(
            'success' => false,
            'error' => __('Invalid API response format', 'gsxr-777')
        );
    }
}