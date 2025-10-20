<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\JsonResponse;

class ChatbotController extends Controller
{
    public function index()
    {
        return Inertia::render('AIchatbot');
    }

    public function message(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
        ]);

        $apiKey = config('services.gemini.key');
        if (!$apiKey) {
            return response()->json([
                'error' => 'Missing GEMINI_API_KEY. Set it in your .env and config/services.php.',
            ], 500);
        }

        // Use v1 and the "-latest" alias to avoid version/method mismatch issues
        $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

        try {
            $payload = [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [ ['text' => $validated['message']] ],
                    ],
                ],
            ];

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post($endpoint.'?key='.$apiKey, $payload);

            if (!$response->successful()) {
                $err = $response->json();
                $apiMessage = $err['error']['message'] ?? null;
                return response()->json([
                    'error' => 'Gemini API error' . ($apiMessage ? (': ' . $apiMessage) : ''),
                    'details' => $err,
                ], $response->status());
            }

            $data = $response->json();
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

            return response()->json([
                'reply' => $text,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Unexpected error calling Gemini',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
