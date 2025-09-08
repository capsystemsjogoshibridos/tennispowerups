import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Screen, AppState, Cards, Match, PermissionStatus, LocationPoint } from './types';
import { Screen as ScreenEnum } from './types';
import usePersistentState from './hooks/usePersistentState';
import { haversineDistance } from './services/activityUtils';
import * as C from './constants';
import StatCard from './components/StatCard';
import { StepIcon, DistanceIcon, SpeedIcon, CardIcon } from './components/icons';

// --- Helper Components defined outside App ---

const BigButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = 'bg-yellow-500 hover:bg-yellow-600' }) => (
  <button onClick={onClick} className={`w-full py-4 px-6 rounded-xl text-2xl font-bold text-gray-900 transition-transform transform hover:scale-105 shadow-lg ${className}`}>
    {children}
  </button>
);

const HomeScreen: React.FC<{ onStart: () => void; onShowHistory: () => void; onShowPrivacy: () => void; }> = ({ onStart, onShowHistory, onShowPrivacy }) => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex-grow flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
        <span className="text-yellow-500">Tennis</span> Power Ups
      </h1>
      <p className="text-sm text-gray-400">Criado por Christopher de Assis Pereira</p>
      <p className="text-xs text-gray-500 mt-1">CAP Systems Jogos Híbridos</p>
      <p className="text-xs text-gray-700 font-mono mb-12">V1.2</p>

      <div className="w-full space-y-4">
          <BigButton onClick={onStart}>Iniciar Partida</BigButton>
          <BigButton onClick={onShowHistory} className="bg-gray-700 hover:bg-gray-600 text-white">
            Histórico
          </BigButton>
      </div>
    </div>
    <div className="space-y-4">
      <div className="text-center text-gray-500 text-xs p-2">
        <p>Aviso de segurança: não olhe para o app enquanto joga tênis. Você pode levar pontos tanto no set quanto na vida real, caso leve um tombo.</p>
        <p><a href="#" onClick={(e) => { e.preventDefault(); onShowPrivacy(); }} className="underline">Sobre & Privacidade</a></p>
      </div>
    </div>
  </div>
);

const LiveScreen: React.FC<{
  stats: { steps: number; distanceMeters: number; topSpeedKmh: number; cards: Cards; };
  events: string[];
  permissions: { geo: PermissionStatus; motion: PermissionStatus; };
  onEnd: () => void;
}> = ({ stats, events, permissions, onEnd }) => (
  <div className="p-6 flex flex-col h-full">
    <h2 className="text-3xl font-bold mb-4">Partida em Andamento</h2>
    { (permissions.geo === 'granted' || permissions.motion === 'granted') &&
      <div className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full self-start mb-4">
        Permissões ativas
      </div>
    }
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <StatCard icon={<StepIcon />} title="Passos" value={stats.steps.toString()} unit="" colorClass="border-l-4 border-blue-400" />
      <StatCard icon={<DistanceIcon />} title="Distância" value={(stats.distanceMeters / 1000).toFixed(2)} unit="km" colorClass="border-l-4 border-green-400" />
      <StatCard icon={<DistanceIcon />} title="Distância" value={stats.distanceMeters.toFixed(0)} unit="m" colorClass="border-l-4 border-green-400" />
      <StatCard icon={<SpeedIcon />} title="Velocidade Máx." value={stats.topSpeedKmh.toFixed(1)} unit="km/h" colorClass="border-l-4 border-red-400" />
    </div>
    <h3 className="text-xl font-bold mb-2">Cartas Ganhas</h3>
    <div className="grid grid-cols-3 gap-4 mb-4">
      <StatCard icon={<CardIcon rarity="common" />} title="Comum" value={stats.cards.common.toString()} unit="" colorClass="border-l-4 border-gray-400" />
      <StatCard icon={<CardIcon rarity="semiRare" />} title="Semi-Rara" value={stats.cards.semiRare.toString()} unit="" colorClass="border-l-4 border-blue-400" />
      <StatCard icon={<CardIcon rarity="rare" />} title="Rara" value={stats.cards.rare.toString()} unit="" colorClass="border-l-4 border-purple-400" />
    </div>
    <div className="flex-grow bg-gray-800 rounded-lg p-3 text-sm space-y-2 overflow-y-auto h-32">
      <h4 className="font-bold text-gray-300">Eventos</h4>
      {events.length === 0 && <p className="text-gray-500">Nenhum evento ainda.</p>}
      {events.map((event, i) => <p key={i} className="text-gray-400 leading-tight">› {event}</p>)}
    </div>
    <div className="mt-auto pt-4">
      <BigButton onClick={onEnd} className="bg-red-600 hover:bg-red-700">Encerrar Partida</BigButton>
    </div>
  </div>
);

const HistoryScreen: React.FC<{ matches: Match[]; onClear: () => void; onBack: () => void; }> = ({ matches, onClear, onBack }) => (
    <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">Histórico</h2>
            <button onClick={onBack} className="text-yellow-400">&larr; Voltar</button>
        </div>
        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
            {matches.length === 0 ? (
                <p className="text-gray-500 text-center mt-8">Nenhuma partida registrada.</p>
            ) : (
                [...matches].reverse().map(match => (
                    <div key={match.id} className="bg-gray-800 p-4 rounded-lg">
                        <p className="font-bold">{new Date(match.startedAt).toLocaleString('pt-BR')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                            <p><strong>Distância:</strong> {(match.distanceMeters / 1000).toFixed(2)} km</p>
                            <p><strong>Passos:</strong> {match.steps}</p>
                            <p><strong>Vel. Máx:</strong> {match.topSpeedKmh.toFixed(1)} km/h</p>
                            <p><strong>Cartas:</strong> C:{match.cards.common} SR:{match.cards.semiRare} R:{match.cards.rare}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
        {matches.length > 0 && (
            <div className="mt-auto pt-4">
                <BigButton onClick={onClear} className="bg-red-800 hover:bg-red-700 text-white">Limpar Histórico</BigButton>
            </div>
        )}
    </div>
);

const PrivacyScreen: React.FC<{ onBack: () => void; }> = ({ onBack }) => (
  <div className="p-6 flex flex-col h-full">
    <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">Sobre & Privacidade</h2>
        <button onClick={onBack} className="text-yellow-400">&larr; Voltar</button>
    </div>
    <div className="flex-grow overflow-y-auto space-y-4 text-gray-300">
        <p>Tennis Power Ups é um aplicativo de entretenimento que utiliza os sensores do seu dispositivo para rastrear atividades físicas como caminhada e corrida.</p>
        <p><strong>Uso de Sensores:</strong> Solicitamos acesso à sua <strong>Localização (GPS)</strong> para calcular distância e velocidade, e aos <strong>Sensores de Movimento</strong> para contar passos. Estes dados são processados inteiramente no seu dispositivo.</p>
        <p><strong>Privacidade:</strong> Nenhum dado de sua atividade é enviado para servidores externos. Todo o histórico de partidas é armazenado localmente no seu navegador e pode ser apagado a qualquer momento na tela de Histórico.</p>
        <p><strong>Como Revogar Permissões:</strong> Você pode revogar as permissões concedidas a este site a qualquer momento nas configurações do seu navegador, geralmente na seção de "Configurações de site" ou "Privacidade".</p>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [appState, setAppState] = usePersistentState<AppState>('iTennisState', { history: [], sensorConsent: false });
  const [screen, setScreen] = useState<Screen>(ScreenEnum.HOME);

  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [steps, setSteps] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [topSpeedKmh, setTopSpeedKmh] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [cards, setCards] = useState<Cards>({ common: 0, semiRare: 0, rare: 0 });
  const [events, setEvents] = useState<string[]>([]);
  
  const lastPositionRef = useRef<LocationPoint | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef(0);
  const lastSpeedRewardAtRef = useRef(0);
  const distanceSinceLastRareRef = useRef(0);
  
  const [permissions, setPermissions] = useState<{ geo: PermissionStatus; motion: PermissionStatus }>({ geo: 'prompt', motion: 'prompt' });
  const [isSimulating, setIsSimulating] = useState(false);

  const addEvent = (message: string) => {
    setEvents(prev => [message, ...prev].slice(0, 20));
  };

  const processLocation = useCallback((position: GeolocationPosition) => {
    // Filter 1: Ignore updates that are not accurate enough
    if (position.coords.accuracy > 35) {
        return;
    }

    const newPoint: LocationPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    if (lastPositionRef.current) {
      const dist = haversineDistance(lastPositionRef.current, newPoint);
      const timeDeltaS = (newPoint.timestamp - lastPositionRef.current.timestamp) / 1000;

      // Filter 2: Ignore small time/distance deltas to reduce noise when stationary
      if (timeDeltaS < 1 || dist < 1) {
        return;
      }
      
      const speedKmh = (dist / timeDeltaS) * 3.6;

      // Filter 3: Ignore unrealistic speeds (GPS jumps)
      if (speedKmh < C.MAX_REALISTIC_SPEED_KMH) {
          setDistanceMeters(prev => prev + dist);
          distanceSinceLastRareRef.current += dist;
          setCurrentSpeedKmh(speedKmh);
          if (speedKmh > topSpeedKmh) {
            setTopSpeedKmh(speedKmh);
          }
      }
    }
    lastPositionRef.current = newPoint;
  }, [topSpeedKmh]);

  const processMotion = useCallback((event: DeviceMotionEvent) => {
    if (event.acceleration) {
      const { x, y, z } = event.acceleration;
      if (x === null || y === null || z === null) return;
      
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      const timeSinceLastStep = now - lastStepTimeRef.current;

      if (magnitude > C.STEP_DETECTION_THRESHOLD && timeSinceLastStep > C.MIN_STEP_INTERVAL_MS && timeSinceLastStep < C.MAX_STEP_INTERVAL_MS) {
        setSteps(prev => prev + 1);
        lastStepTimeRef.current = now;
      }
    }
  }, []);

  const requestPermissions = async () => {
    let finalGeo: PermissionStatus = 'denied';
    let finalMotion: PermissionStatus = 'denied';

    // Geolocation
    try {
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (geoStatus.state === 'granted') {
            finalGeo = 'granted';
        } else if (geoStatus.state === 'prompt') {
            await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
            finalGeo = 'granted';
        }
    } catch (error) {
        console.warn("Geolocation permission denied or timed out.");
    }

    // Device Motion
    // @ts-ignore: Non-standard permission name
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            // @ts-ignore
            const motionStatus = await DeviceMotionEvent.requestPermission();
            if (motionStatus === 'granted') {
                finalMotion = 'granted';
            }
        } catch (error) {
            console.warn("Device Motion permission denied.");
        }
    } else if (typeof DeviceMotionEvent !== 'undefined') {
        // For non-iOS 13+ browsers that don't need explicit permission
        finalMotion = 'granted';
    }

    setPermissions({ geo: finalGeo, motion: finalMotion });
  };

  const startMatch = async () => {
    setEvents([]);
    setSteps(0);
    setDistanceMeters(0);
    setTopSpeedKmh(0);
    setCurrentSpeedKmh(0);
    setCards({ common: 0, semiRare: 0, rare: 0 });
    lastPositionRef.current = null;
    distanceSinceLastRareRef.current = 0;
    lastSpeedRewardAtRef.current = 0;
    lastStepTimeRef.current = 0;
    
    await requestPermissions();

    setSessionActive(true);
    setSessionStartTime(new Date().toISOString());
    setScreen(ScreenEnum.LIVE);
  };

  const endMatch = () => {
    setSessionActive(false);
    
    if (steps > 0 || distanceMeters > 5) {
      const match: Match = {
        id: sessionStartTime || new Date().toISOString(),
        startedAt: sessionStartTime || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        distanceMeters,
        topSpeedKmh,
        steps,
        cards,
      };
      setAppState(prev => ({ ...prev, history: [...prev.history, match] }));
    }

    setScreen(ScreenEnum.HOME);
  };
  
  const clearHistory = () => {
      if(window.confirm("Tem certeza que deseja apagar todo o histórico de partidas?")) {
        setAppState(prev => ({ ...prev, history: [] }));
      }
  };

  // Main effect for sensor listeners
  useEffect(() => {
    if (!sessionActive) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      window.removeEventListener('devicemotion', processMotion);
      return;
    }

    // Start geolocation watch if permission granted
    if (permissions.geo === 'granted') {
        watchIdRef.current = navigator.geolocation.watchPosition(
            processLocation,
            (err) => console.error("Geolocation Error", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
    }

    // Start motion listener if permission granted
    if (permissions.motion === 'granted') {
        window.addEventListener('devicemotion', processMotion);
    }
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      window.removeEventListener('devicemotion', processMotion);
    };
  }, [sessionActive, permissions.geo, permissions.motion, processLocation, processMotion]);


  // Reward Logic
  useEffect(() => {
    if (!sessionActive) return;

    // Common Card
    const expectedCommon = Math.floor(steps / C.COMMON_CARD_STEP_THRESHOLD);
    if (expectedCommon > cards.common) {
      setCards(c => ({ ...c, common: expectedCommon }));
      addEvent(`+1 Carta Comum (${steps} passos)`);
    }

    // Semi-Rare Card
    const now = Date.now();
    if (currentSpeedKmh > C.SEMI_RARE_CARD_SPEED_THRESHOLD_KMH && (now - lastSpeedRewardAtRef.current > C.SEMI_RARE_CARD_COOLDOWN_MS)) {
      setCards(c => ({ ...c, semiRare: c.semiRare + 1 }));
      addEvent(`+1 Carta Semi-Rara (velocidade > ${C.SEMI_RARE_CARD_SPEED_THRESHOLD_KMH} km/h)`);
      lastSpeedRewardAtRef.current = now;
    }

    // Rare Card
    const expectedRare = Math.floor(distanceSinceLastRareRef.current / C.RARE_CARD_DISTANCE_THRESHOLD_M);
    if (expectedRare > 0) {
      setCards(c => ({...c, rare: c.rare + expectedRare }));
      distanceSinceLastRareRef.current -= expectedRare * C.RARE_CARD_DISTANCE_THRESHOLD_M;
      addEvent(`+${expectedRare} Carta(s) Rara(s) (+${(expectedRare * C.RARE_CARD_DISTANCE_THRESHOLD_M / 1000).toFixed(1)} km)`);
    }

  }, [steps, currentSpeedKmh, distanceMeters, sessionActive, cards.common]);


  // Simulation Logic
  const runSimulation = () => {
    if (!sessionActive) {
      alert('Inicie uma partida para rodar a simulação.');
      return;
    }
    setIsSimulating(true);
    addEvent('INICIANDO SIMULAÇÃO...');
    
    // 300 steps
    let stepCount = 0;
    const stepInterval = setInterval(() => {
        setSteps(s => s + 1);
        stepCount++;
        if (stepCount >= 300) clearInterval(stepInterval);
    }, 100);

    // Speed burst
    setTimeout(() => {
        setCurrentSpeedKmh(16);
        setTopSpeedKmh(t => Math.max(t, 16));
        setTimeout(() => setCurrentSpeedKmh(5), 2000); // back to normal speed
    }, 5000);
    setTimeout(() => { // another burst after cooldown
        setCurrentSpeedKmh(17);
        setTopSpeedKmh(t => Math.max(t, 17));
        setTimeout(() => setCurrentSpeedKmh(5), 2000);
    }, 16000);

    // 12km distance
    let distCount = 0;
    const distInterval = setInterval(() => {
        setDistanceMeters(d => d + 20);
        distanceSinceLastRareRef.current += 20;
        distCount++;
        if (distCount >= 600) { // 600 * 20m = 12km
          clearInterval(distInterval);
          addEvent('SIMULAÇÃO CONCLUÍDA.');
          setIsSimulating(false);
        }
    }, 100);
  };
  
  const renderScreen = () => {
    switch(screen) {
      case ScreenEnum.LIVE:
        return <LiveScreen stats={{ steps, distanceMeters, topSpeedKmh, cards }} events={events} onEnd={endMatch} permissions={permissions} />;
      case ScreenEnum.HISTORY:
        return <HistoryScreen matches={appState.history} onClear={clearHistory} onBack={() => setScreen(ScreenEnum.HOME)} />;
      case ScreenEnum.PRIVACY:
        return <PrivacyScreen onBack={() => setScreen(ScreenEnum.HOME)} />;
      case ScreenEnum.HOME:
      default:
        return <HomeScreen onStart={startMatch} onShowHistory={() => setScreen(ScreenEnum.HISTORY)} onShowPrivacy={() => setScreen(ScreenEnum.PRIVACY)} />;
    }
  };

  return (
    <div className="relative h-[100dvh] max-w-md mx-auto bg-green-950 font-sans flex flex-col">
       {
        // This is a development-only feature
        process.env.NODE_ENV !== 'production' && (
          <div className="absolute top-2 right-2 z-10">
            <button onClick={runSimulation} disabled={isSimulating} className="bg-purple-600 text-white px-2 py-1 text-xs rounded disabled:opacity-50">
              Simular
            </button>
          </div>
        )
      }
      {renderScreen()}
    </div>
  );
};

export default App;
