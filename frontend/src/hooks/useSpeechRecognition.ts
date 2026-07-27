import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEventLike {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
                confidence: number;
            };
        };
    };
}

interface SpeechRecognitionErrorEventLike {
    error: string;
}

interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionInstance;
}

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

interface UseSpeechRecognitionOptions {
    onCommand: (transcript: string) => void;
}

export function useSpeechRecognition({
    onCommand,
}: UseSpeechRecognitionOptions) {
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);

    const isSupported =
        typeof window !== "undefined" &&
        Boolean(
            window.SpeechRecognition || window.webkitSpeechRecognition
        );

    useEffect(() => {
        if (!isSupported) {
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setTranscript("");
        };

        recognition.onresult = (event) => {
            const result = event.results[0]?.[0];

            if (!result) {
                return;
            }
            setTimeout(() => {
                setTranscript("");
            }, 1500);

            const spokenText = result.transcript.trim();

            setTranscript(spokenText);
            onCommand(spokenText);
        };

        recognition.onerror = (event) => {
            setError(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
            recognitionRef.current = null;
        };
    }, [isSupported, onCommand]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || isListening) {
            return;
        }

        setError(null);
        recognitionRef.current.start();
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current || !isListening) {
            return;
        }

        recognitionRef.current.stop();
    }, [isListening]);

    return {
        isSupported,
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
    };
}