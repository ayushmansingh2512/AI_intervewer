import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, Volume2, Zap, Video, VideoOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Lottie from "lottie-react";
import GhostAnimation from "../assets/images/Ghost.json";
import { API_URL, WS_URL } from '../config';

const CompanyVoiceInterview = () => {
    const { interviewId } = useParams();
    const navigate = useNavigate();

    // State
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [processingAnswer, setProcessingAnswer] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState([]);

    // Camera State
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);

    // Refs
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioRef = useRef(new Audio());
    const isListeningRef = useRef(false); // Ref to track listening state without closure issues

    // Sync Ref with State
    useEffect(() => {
        isListeningRef.current = isListening;
        if (isListening) {
            visualizeAudio();
        } else {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    }, [isListening]);

    // Fetch Interview Data
    useEffect(() => {
        const fetchInterview = async () => {
            console.log("Fetching interview data for:", interviewId);
            try {
                // Use localhost as requested by user and consistent with frontend
                const response = await axios.get(`${API_URL}/company/interview/${interviewId}`);
                console.log("Interview fetched successfully:", response.data);
                setQuestions(response.data.questions);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching interview:', err);
                setError('Failed to load interview. Please check the link.');
                setLoading(false);
            }
        };
        fetchInterview();
    }, [interviewId]);

    // Initialize Camera
    useEffect(() => {
        let currentStream = null;
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                currentStream = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setCameraActive(true);
                    // Explicitly play to avoid "white screen" if autoPlay fails
                    videoRef.current.play().catch(e => console.error("Error playing video:", e));
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                toast.error("Camera access required for this interview.");
            }
        };
        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // WebSocket Streaming for Detection
    useEffect(() => {
        let ws;
        let intervalId;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const startStreaming = () => {
            // Use localhost for consistency
            ws = new WebSocket(`${WS_URL}/company/interview/${interviewId}/stream`);

            ws.onopen = () => {
                console.log('WebSocket connection established for detection.');

                intervalId = setInterval(() => {
                    if (videoRef.current && ws.readyState === WebSocket.OPEN) {
                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;

                        if (canvas.width > 0 && canvas.height > 0) {
                            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                            canvas.toBlob((blob) => {
                                if (blob && ws.readyState === WebSocket.OPEN) {
                                    ws.send(blob);
                                }
                            }, 'image/jpeg', 0.8); // Send as JPEG
                        }
                    }
                }, 1000); // 1 FPS
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                // simple reconnect logic could go here
                console.log('WebSocket connection closed.');
            };
        };

        if (cameraActive) {
            startStreaming();
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (ws) ws.close();
        };
    }, [interviewId, cameraActive]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript('');
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const text = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += text;
                    }
                }
                if (finalTranscript) {
                    setTranscript((prev) => prev + finalTranscript + ' ');
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Auto-speak first question when loaded
    useEffect(() => {
        if (questions.length > 0 && currentQuestionIndex === 0 && !loading) {
            // Small delay to ensure everything is ready
            setTimeout(() => speakQuestion(questions[0]), 1000);
        }
    }, [questions, loading]);

    // Google TTS Function with Fallback
    const speakQuestion = async (text) => {
        if (isSpeaking) return;
        setIsSpeaking(true);

        try {
            // Try gTTS (using localhost)
            const response = await axios.post(`${API_URL}/tts`, { text }, {
                responseType: 'blob'
            });

            const audioUrl = URL.createObjectURL(response.data);
            audioRef.current.src = audioUrl;
            audioRef.current.play();

            audioRef.current.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                // Auto-start listening after question
                setTimeout(startListening, 500);
            };

            audioRef.current.onerror = () => {
                console.error("Audio playback error, switching to fallback");
                speakFallback(text);
            };

        } catch (error) {
            console.error("TTS Error (likely missing credentials), using fallback:", error);
            speakFallback(text);
        }
    };

    // Browser Native TTS Fallback
    const speakFallback = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => {
            setIsSpeaking(false);
            setTimeout(startListening, 500);
        };

        utterance.onerror = (e) => {
            console.error("Fallback TTS Error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    // Start Listening Logic
    const startListening = async () => {
        try {
            setTranscript('');

            // Audio Context for visualization
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            recognitionRef.current?.start();
            // visualizeAudio is now triggered by useEffect when isListeningRef becomes true
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Microphone access denied.');
        }
    };

    const visualizeAudio = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        // Boost sensitivity: multiply by 2.5 to make bars react more to lower volumes
        // Clamp at 1.0
        const boostedLevel = Math.min((average / 255) * 2.5, 1);

        setAudioLevel(boostedLevel);

        if (isListeningRef.current) {
            animationFrameRef.current = requestAnimationFrame(visualizeAudio);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        // State update will trigger useEffect to stop animation
    };

    const handleNext = async () => {
        stopListening();

        // Save answer
        const newAnswers = [...answers, transcript];
        setAnswers(newAnswers);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTranscript('');
            // Speak next question
            setTimeout(() => speakQuestion(questions[currentQuestionIndex + 1]), 500);
        } else {
            // Submit Interview
            setProcessingAnswer(true);
            try {
                await axios.post(`${API_URL}/company/interview/${interviewId}/submit`, {
                    answers: newAnswers
                });
                toast.success("Interview Submitted!");
                navigate('/interview-completed');
            } catch (error) {
                console.error("Submission error:", error);
                toast.error("Failed to submit interview.");
            } finally {
                setProcessingAnswer(false);
            }
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin" /></div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;

    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F7F5F2] to-[#E5E1DC] flex items-center justify-center p-6 relative">

            {/* Camera Feed - Fixed Top Right */}
            <div className="fixed top-6 right-6 w-64 h-48 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white z-50">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-white font-medium">REC</span>
                </div>
            </div>

            <div className="w-full max-w-4xl">
                {/* Progress */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-light text-[#6B6662]">Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span className="text-sm font-light text-[#6B6662]">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-[#E5E1DC] rounded-full h-1">
                        <div className="bg-gradient-to-r from-[#D4A574] to-[#C0956B] h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-12 shadow-lg border border-[#E5E1DC]">
                    {/* AI Avatar / Speaker */}
                    <div className="mb-12 flex justify-center">
                        <div className="w-64 h-64">
                            <Lottie
                                animationData={GhostAnimation}
                                loop={true}
                                className="w-full h-full"
                            />
                        </div>
                    </div>

                    {/* Question Text */}
                    <div className="mb-12 text-center min-h-[120px] flex items-center justify-center">
                        <h2 className="text-3xl font-light text-[#1A1817] leading-relaxed">
                            {questions[currentQuestionIndex]}
                        </h2>
                    </div>

                    {/* Visualizer & Transcript */}
                    <div className="mb-8 min-h-[160px]">
                        {isListening ? (
                            <div className="flex flex-col items-center">
                                <div className="flex items-end justify-center gap-1 h-16 mb-6">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div key={i} className="w-1.5 bg-gradient-to-t from-[#10B981] to-[#34D399] rounded-full transition-all duration-75"
                                            style={{ height: `${Math.max(4, audioLevel * (Math.random() * 120 + 30))}px` }}
                                        />
                                    ))}
                                </div>
                                <p className="text-[#1A1817] text-lg font-light animate-pulse">Listening...</p>
                            </div>
                        ) : (
                            transcript && (
                                <div className="p-6 bg-[#F7F5F2] rounded-xl border border-[#E5E1DC]">
                                    <p className="text-sm text-[#6B6662] mb-2 uppercase tracking-wide">Your Answer</p>
                                    <p className="text-[#1A1817] text-lg font-light">{transcript}</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4">
                        {!isListening && !isSpeaking && (
                            <button onClick={startListening} className="flex-1 py-4 bg-[#1A1817] text-white rounded-xl hover:bg-[#2D2B28] transition-all flex items-center justify-center gap-2">
                                <Zap size={20} /> Start Speaking
                            </button>
                        )}

                        {isListening && (
                            <button onClick={stopListening} className="flex-1 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse" /> Stop Recording
                            </button>
                        )}

                        {transcript && !isListening && (
                            <button onClick={handleNext} className="flex-1 py-4 bg-[#D4A574] text-white rounded-xl hover:bg-[#C0956B] transition-all">
                                {currentQuestionIndex === questions.length - 1 ? 'Submit Interview' : 'Next Question'}
                            </button>
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <button onClick={() => speakQuestion(questions[currentQuestionIndex])} disabled={isSpeaking || isListening} className="text-sm text-[#6B6662] hover:text-[#1A1817] underline">
                            Repeat Question
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CompanyVoiceInterview;
