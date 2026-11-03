// ==============================================================================
// GYM VIP — Componente: QrScannerModal (Lector de Códigos QR para Recepción)
// HU-13 T05: Escaneo por cámara web, permisos, errores, cierre y lector USB/manual
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { parseQrPayload } from '../../utils/qrParser';
import { Button } from '../common/Button';
import { Alert } from '../common/Alert';
import { Icon } from '../common/Icons';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef = useRef(null);

  const [cameraState, setCameraState] = useState('idle'); // 'idle' | 'requesting' | 'active' | 'denied' | 'no_device' | 'unsupported' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);

  // Detener la cámara y liberar recursos de hardware
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Inicializar cámara web
  const startCamera = async () => {
    stopCamera();
    setErrorMessage('');
    setCameraState('requesting');

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      setErrorMessage('Este navegador no soporta captura de video por cámara. Utilice la búsqueda manual o el lector USB.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraState('active');

      // Iniciar detector nativo si el navegador lo soporta
      initBarcodeDetector();
    } catch (err) {
      const errName = err.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraState('denied');
        setErrorMessage('Permiso de cámara denegado. Conceda permiso en los ajustes de su navegador o use la búsqueda manual.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraState('no_device');
        setErrorMessage('No se encontró ninguna cámara conectada en este equipo.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraState('error');
        setErrorMessage('La cámara está en uso por otra aplicación o no se puede iniciar.');
      } else {
        setCameraState('error');
        setErrorMessage('No se pudo inicializar la cámara web. Puede utilizar el lector USB o ingresar el código.');
      }
    }
  };

  // Detección continua de códigos QR en el frame de video
  const initBarcodeDetector = () => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
        const scanLoop = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && detectorRef.current) {
            try {
              const barcodes = await detectorRef.current.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const detected = barcodes[0].rawValue;
                if (detected) {
                  handleProcessPayload(detected);
                  return; // Pausar ciclo tras detección exitosa
                }
              }
            } catch {
              // Frame no analizable, continuar en el siguiente ciclo
            }
          }
          animFrameRef.current = requestAnimationFrame(scanLoop);
        };
        animFrameRef.current = requestAnimationFrame(scanLoop);
      } catch {
        detectorRef.current = null;
      }
    }
  };

  // Procesar e interpretar el contenido del QR
  const handleProcessPayload = (raw) => {
    setErrorMessage('');
    const parsed = parseQrPayload(raw);
    if (!parsed.valid) {
      setErrorMessage(parsed.error || 'Código QR no reconocido. Formato incompatible.');
      return;
    }

    // Detener cámara antes de notificar éxito al componente padre
    stopCamera();
    onScanSuccess(parsed);
  };

  // Manejo de envío manual o lector USB (pistola de mostrador)
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setValidating(true);
    handleProcessPayload(manualCode.trim());
    setValidating(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          border: '1px solid var(--color-border-subtle, rgba(212, 175, 55, 0.3))',
          backgroundColor: 'var(--color-bg-card, #12141A)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 id="qr-modal-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Escáner de Código QR de Miembro
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Apunte la cámara al código QR de la credencial o use el lector USB.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
            aria-label="Cerrar escáner"
          >
            ✕
          </button>
        </div>

        {errorMessage && <Alert variant="danger" message={errorMessage} onClose={() => setErrorMessage('')} />}

        {/* Visor de Cámara */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '260px',
            backgroundColor: '#05070B',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--color-gold, #D4AF37)',
            marginBottom: '16px',
          }}
        >
          {cameraState === 'requesting' && (
            <div style={{ textAlign: 'center', color: 'var(--color-gold)', padding: '20px' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Solicitando acceso a la cámara...</p>
              <small style={{ color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Autorice el uso en su navegador
              </small>
            </div>
          )}

          {cameraState === 'active' && (
            <>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                autoPlay
                playsInline
                muted
              />
              {/* Marco visor animado */}
              <div
                style={{
                  position: 'absolute',
                  width: '180px',
                  height: '180px',
                  border: '2px solid var(--color-gold, #D4AF37)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {(cameraState === 'denied' || cameraState === 'no_device' || cameraState === 'unsupported' || cameraState === 'error') && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
              <Icon name="camera" size={36} color="var(--color-text-muted)" />
              <p style={{ marginTop: '10px', fontSize: '13px' }}>
                {cameraState === 'denied'
                  ? 'Permiso de cámara bloqueado en el navegador.'
                  : cameraState === 'no_device'
                  ? 'No se detectó cámara web conectada.'
                  : 'Cámara web no disponible.'}
              </p>
              <Button variant="secondary" onClick={startCamera} style={{ fontSize: '12px', minHeight: '32px' }}>
                Reintentar Cámara
              </Button>
            </div>
          )}
        </div>

        {/* Lector USB / Prueba de Código Provisional */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle, rgba(255,255,255,0.08))', paddingTop: '16px' }}>
          <form onSubmit={handleManualSubmit}>
            <label className="form-label" htmlFor="qr-manual-input" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Lector USB de Mano / Código Provisional (ej. MAR-123456)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="qr-manual-input"
                className="form-input"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Escanee o escriba ej. MAR-2B7A89"
                style={{ flex: 1, minHeight: '38px', fontSize: '13px' }}
                autoComplete="off"
              />
              <Button type="submit" variant="primary" disabled={validating || !manualCode.trim()} style={{ minHeight: '38px' }}>
                <span>Validar</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Botón Detener / Cerrar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
          <Button
            variant="secondary"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{ minHeight: '40px' }}
          >
            <span>Detener y Cerrar Escáner</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
