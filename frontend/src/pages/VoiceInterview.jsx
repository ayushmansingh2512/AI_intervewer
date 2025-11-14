import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, Volume2, Zap } from 'lucide-react';

const VoiceInterview = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [processingAnswer, setProcessingAnswer] = useState(false);
  const [allEvaluations, setAllEvaluations] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const initialQuestions = location.state?.questions || [];
  const [questions, setQuestions] = useState(initialQuestions);

  useEffect(() => {
    console.log('Initial Questions:', initialQuestions);
    console.log('Questions State:', questions);
  }, [initialQuestions, questions]);


  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const speechSynthRef = useRef(window.speechSynthesis);

  // Initialize Web Speech API
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

  // Load initial questions and auto-play first question
  useEffect(() => {
    if (initialQuestions.length > 0 && currentQuestionIndex === 0) {
      setCurrentQuestion(initialQuestions[0]);
      speakQuestion(initialQuestions[0]);
    }
  }, [initialQuestions]);

  // Get the most realistic voice available
  const getRealisticVoice = () => {
    const voices = speechSynthRef.current.getVoices();
    if (voices.length === 0) return null;

    // Priority order for realistic voices
    const voicePreferences = [
      { lang: 'en', keywords: ['Google US', 'Google'] },
      { lang: 'en-US', keywords: ['Microsoft Zira', 'Microsoft'] },
      { lang: 'en', keywords: ['Amazon'] },
      { lang: 'en-US', keywords: ['Samantha', 'Victoria'] },
    ];

    for (const pref of voicePreferences) {
      for (const keyword of pref.keywords) {
        const found = voices.find(
          (v) => v.lang.startsWith(pref.lang) && v.name.includes(keyword)
        );
        if (found && found.localService) return found;
      }
    }

    // Fallback to any English voice
    const englishVoice = voices.find((v) => v.lang.startsWith('en'));
    return englishVoice || voices[0];
  };

  // Enhanced voice with more realistic settings
  const speakQuestion = (questionText) => {
    if (speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(questionText);

    // More realistic voice parameters
    utterance.rate = 0.9; // Natural speaking speed
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 1.0; // Full volume

    const voice = getRealisticVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setTimeout(() => {
        startListening();
      }, 500);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    speechSynthRef.current.speak(utterance);
  };

  // Start voice recognition and audio visualization
  const startListening = async () => {
    try {
      setTranscript('');
      recordedChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        recordedChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        await processAnswer(audioBlob);
      };

      mediaRecorderRef.current.start();
      recognitionRef.current?.start();

      visualizeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please allow permissions.');
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(Math.min(average / 255, 1));

    if (isListening && mediaRecorderRef.current?.state === 'recording') {
      animationFrameRef.current = requestAnimationFrame(visualizeAudio);
    }
  };

  const stopListening = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const processAnswer = async (audioBlob) => {
    setProcessingAnswer(true);
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'audio.webm');
      formData.append('question', currentQuestion);
      formData.append('current_question_index', currentQuestionIndex);
      formData.append('total_questions', initialQuestions.length);

      const response = await axios.post('http://localhost:8000/process-voice-answer', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { transcribed_text, score, feedback, follow_up_question } = response.data;

      const newEvaluation = {
        question: currentQuestion,
        transcribed_text,
        score,
        feedback,
      };

      const updatedEvaluations = [...allEvaluations, newEvaluation];
      setAllEvaluations(updatedEvaluations);

      // KEY FIX: Check if we've answered all original questions OR if no follow-up
      const hasMoreQuestions = follow_up_question && currentQuestionIndex + 1 < initialQuestions.length;

      if (hasMoreQuestions) {
        // Add follow-up and continue
        setQuestions((prev) => [...prev, follow_up_question]);
        setCurrentQuestionIndex((prev) => prev + 1);
        setCurrentQuestion(follow_up_question);
        speakQuestion(follow_up_question);
      } else {
        // Interview complete - navigate to results
        navigate('/dashboard/voice-interview/results', {
          state: { questions: initialQuestions, evaluations: updatedEvaluations },
        });
      }
    } catch (error) {
      console.error('Error processing voice answer:', error);
      alert('Error processing your response. Please try again.');
    } finally {
      setProcessingAnswer(false);
    }
  };

  const progress = initialQuestions.length > 0 ? ((currentQuestionIndex + 1) / initialQuestions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F5F2] to-[#E5E1DC] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-light text-[#6B6662]">
              Question {currentQuestionIndex + 1} of {initialQuestions.length}
            </span>
            <span className="text-sm font-light text-[#6B6662]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-[#E5E1DC] rounded-full h-1">
            <div
              className="bg-gradient-to-r from-[#D4A574] to-[#C0956B] h-1 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-12 shadow-lg border border-[#E5E1DC]">
          {/* Speaker Animation */}
          <div className="mb-12 flex justify-center">
            {isSpeaking && (
              <div className="flex gap-2 items-end">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-[#D4A574] to-[#E5C7A0] rounded-full"
                    style={{
                      height: `${20 + i * 12}px`,
                      animation: `wave 0.6s ease-in-out ${i * 0.1}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            {!isSpeaking && !isListening && (
              <Volume2 className="w-8 h-8 text-[#D4A574]" strokeWidth={1.5} />
            )}
          </div>

          {/* Question */}
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-light text-[#1A1817] leading-relaxed">
              {currentQuestion}
            </h2>
          </div>

          {/* Listening Visualizer */}
          {isListening && (
            <div className="mb-12">
              <div className="flex items-end justify-center gap-1 h-24 bg-[#F7F5F2] rounded-xl p-6">
                {Array.from({ length: 12 }).map((_, i) => {
                  const listenLevel = audioLevel * (0.3 + Math.random() * 0.7);
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-[#10B981] to-[#34D399] rounded-full transition-all"
                      style={{
                        height: `${Math.max(8, listenLevel * 80)}px`,
                      }}
                    />
                  );
                })}
              </div>
              <p className="text-center text-[#6B6662] font-light mt-4 text-sm">
                Listening to your response...
              </p>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="mb-8 p-6 bg-[#F7F5F2] rounded-lg border border-[#E5E1DC]">
              <p className="text-sm font-light text-[#6B6662] mb-2 uppercase tracking-wide">
                Your Response
              </p>
              <p className="text-[#1A1817] font-light leading-relaxed">
                {transcript}
                {isListening && <span className="animate-pulse">|</span>}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {!isListening && !processingAnswer && (
              <button
                onClick={startListening}
                disabled={isSpeaking}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-xl font-light tracking-wide hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Zap size={20} />
                {isSpeaking ? 'Question Being Asked...' : 'Start Speaking'}
              </button>
            )}

            {isListening && (
              <button
                onClick={stopListening}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white rounded-xl font-light tracking-wide hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
              >
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                Stop & Process Answer
              </button>
            )}

            {processingAnswer && (
              <button
                disabled
                className="w-full py-4 px-6 bg-gradient-to-r from-[#6B7280] to-[#4B5563] text-white rounded-xl font-light tracking-wide flex items-center justify-center gap-3"
              >
                <Loader size={20} className="animate-spin" />
                Evaluating Your Response...
              </button>
            )}
          </div>

          {/* Repeat Question Button */}
          <button
            onClick={() => speakQuestion(currentQuestion)}
            disabled={isSpeaking || isListening}
            className="w-full mt-4 py-3 px-6 bg-[#F7F5F2] text-[#1A1817] rounded-xl font-light border border-[#E5E1DC] hover:bg-[#E5E1DC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Repeat Question
          </button>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.4);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceInterview;