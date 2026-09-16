import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioAlertsProps {
  playPriorityAlert: boolean;
  type?: 'emergency' | 'relief' | 'none';
}

export default function AudioAlerts({ playPriorityAlert, type = 'none' }: AudioAlertsProps) {
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorIntervalRef = useRef<any>(null);

  const startSiren = () => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop any existing siren interval
      if (oscillatorIntervalRef.current) {
        clearInterval(oscillatorIntervalRef.current);
      }

      // Create a pulsating alert siren
      let toggle = false;
      oscillatorIntervalRef.current = setInterval(() => {
        if (muted) return;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Custom sound patterns based on call type
        if (type === 'emergency') {
          // Double alternating high alarm (800Hz / 1200Hz)
          osc.type = 'sawtooth';
          osc.frequency.value = toggle ? 900 : 1200;
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } else if (type === 'relief') {
          // Softer chime sound for relief requests (440Hz / 550Hz)
          osc.type = 'sine';
          osc.frequency.value = toggle ? 440 : 554;
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        }
        
        toggle = !toggle;
      }, 500);

    } catch (err) {
      console.warn('Web Audio API is blocked or not supported on this browser context:', err);
    }
  };

  const stopSiren = () => {
    if (oscillatorIntervalRef.current) {
      clearInterval(oscillatorIntervalRef.current);
      oscillatorIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (playPriorityAlert && type !== 'none') {
      startSiren();
    } else {
      stopSiren();
    }

    return () => {
      stopSiren();
    };
  }, [playPriorityAlert, type, muted]);

  return (
    <button
      id="btn-toggle-audio-mute"
      onClick={() => setMuted(!muted)}
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-lg transition-all duration-300 ${
        muted
          ? 'bg-rose-100 text-rose-600 border border-rose-200'
          : 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
      }`}
    >
      {muted ? (
        <>
          <VolumeX size={16} id="icon-mute-off" />
          <span>كتم الصوت (Muted)</span>
        </>
      ) : (
        <>
          <Volume2 size={16} id="icon-mute-on" />
          <span>الصوت مفعل (Audio On)</span>
        </>
      )}
    </button>
  );
}
