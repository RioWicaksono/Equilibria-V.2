'use client';

import { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Scan, Shield, CheckCircle, XCircle, Loader2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

interface BiometricStatus {
  available: boolean;
  type: BiometricType;
  isEnrolled: boolean;
}

export default function BiometricAuth() {
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>({
    available: false,
    type: 'none',
    isEnrolled: false
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authResult, setAuthResult] = useState<'success' | 'error' | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check biometric availability
  const checkBiometric = useCallback(async () => {
    setIsChecking(true);

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported');
      }

      const publicKeyCredential = await window.PublicKeyCredential;
      const isAvailable =
        await publicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.() || false;

      if (isAvailable) {
        // Determine biometric type (simplified detection)
        const userAgent = navigator.userAgent.toLowerCase();
        let type: BiometricType = 'fingerprint';

        if (userAgent.includes('face')) {
          type = 'face';
        } else if (/iphone|ipad|android/.test(userAgent)) {
          // Mobile devices likely have fingerprint or face
          type = navigator.platform.includes('iOS') ? 'face' : 'fingerprint';
        }

        // Check if user has set up biometric in app
        const enrolled = localStorage.getItem('equilibria_biometric_enrolled') === 'true';

        setBiometricStatus({
          available: isAvailable,
          type,
          isEnrolled: enrolled
        });

        // Check if biometric is enabled
        const enabled = localStorage.getItem('equilibria_biometric_enabled') === 'true';
        setBiometricEnabled(enabled);
      } else {
        setBiometricStatus({ available: false, type: 'none', isEnrolled: false });
      }
    } catch (error) {
      console.error('Biometric check error:', error);
      setBiometricStatus({ available: false, type: 'none', isEnrolled: false });
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkBiometric();
  }, [checkBiometric]);

  // Enroll biometric
  const enrollBiometric = async () => {
    setIsAuthenticating(true);

    try {
      // Create a credential for enrollment
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32),
        rp: { name: 'Equilibria Finance', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode('equilibria-user'),
          name: 'User',
          displayName: 'Equilibria User'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000,
        attestation: 'none'
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential | null;

      if (credential) {
        // Store enrollment
        localStorage.setItem('equilibria_biometric_enrolled', 'true');
        localStorage.setItem('equilibria_biometric_enabled', 'true');
        setBiometricEnabled(true);
        setBiometricStatus(prev => ({ ...prev, isEnrolled: true }));
        setAuthResult('success');

        // Also register as recovery method
        registerRecoveryMethod();
      }
    } catch (error) {
      console.error('Biometric enrollment error:', error);
      setAuthResult('error');
    } finally {
      setIsAuthenticating(false);
      setTimeout(() => setAuthResult(null), 3000);
    }
  };

  // Register biometric as recovery method
  const registerRecoveryMethod = () => {
    const recoveryMethods = JSON.parse(
      localStorage.getItem('equilibria_recovery_methods') || '[]'
    );
    recoveryMethods.push({
      type: 'biometric',
      addedAt: new Date().toISOString(),
      device: navigator.userAgent.substring(0, 50)
    });
    localStorage.setItem('equilibria_recovery_methods', JSON.stringify(recoveryMethods));
  };

  // Authenticate with biometric
  const authenticateBiometric = async () => {
    setIsAuthenticating(true);
    setAuthResult(null);

    try {
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(32),
        userVerification: 'required',
        timeout: 60000
      };

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential | null;

      if (credential) {
        setAuthResult('success');
        // In a real app, verify the credential with the server
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setAuthResult('error');
    } finally {
      setIsAuthenticating(false);
      setTimeout(() => setAuthResult(null), 3000);
    }
  };

  // Toggle biometric
  const toggleBiometric = (enabled: boolean) => {
    setBiometricEnabled(enabled);
    localStorage.setItem('equilibria_biometric_enabled', enabled.toString());
  };

  const getBiometricIcon = () => {
    switch (biometricStatus.type) {
      case 'face': return <Scan className="w-5 h-5" />;
      case 'fingerprint': return <Fingerprint className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getBiometricLabel = () => {
    switch (biometricStatus.type) {
      case 'face': return 'Face ID';
      case 'fingerprint': return 'Fingerprint';
      default: return 'Biometric';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Biometric Auth</h3>
          <p className="text-[10px] text-zinc-500">Amankan dengan {getBiometricLabel()}</p>
        </div>
      </div>

      {/* Checking Status */}
      {isChecking && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memeriksa ketersediaan...
        </div>
      )}

      {/* Not Available */}
      {!isChecking && !biometricStatus.available && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 mt-0.5" />
            <div className="text-xs text-amber-400">
              <p className="font-medium">Biometric tidak tersedia</p>
              <p className="text-amber-400/70 mt-1">
                Perangkat ini tidak mendukung biometric. Gunakan PIN sebagai gantinya.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Available but not enrolled */}
      {!isChecking && biometricStatus.available && !biometricStatus.isEnrolled && (
        <div className="space-y-3">
          <div className="p-3 bg-[#141414] border border-[#262626] rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                biometricStatus.type === 'face' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {getBiometricIcon()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Aktifkan {getBiometricLabel()}
                </p>
                <p className="text-[10px] text-zinc-500">
                  Gunakan untuk membuka aplikasi dengan cepat dan aman
                </p>
              </div>
            </div>

            <button
              onClick={enrollBiometric}
              disabled={isAuthenticating}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyiapkan...
                </>
              ) : (
                <>
                  {getBiometricIcon()}
                  Aktifkan {getBiometricLabel()}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Enrolled - Show toggle */}
      {!isChecking && biometricStatus.available && biometricStatus.isEnrolled && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#141414] border border-[#262626] rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                biometricEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {getBiometricIcon()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{getBiometricLabel()}</p>
                <p className="text-[10px] text-zinc-500">
                  {biometricEnabled ? 'Aktif' : 'Nonaktif'}
                </p>
              </div>
            </div>
            <button
              onClick={() => !isAuthenticating && (biometricEnabled ? toggleBiometric(false) : authenticateBiometric())}
              disabled={isAuthenticating}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                biometricEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              } disabled:opacity-50`}
            >
              {isAuthenticating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              ) : (
                <motion.div
                  animate={{ x: biometricEnabled ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full"
                />
              )}
            </button>
          </div>

          {/* Test Button */}
          {biometricEnabled && (
            <button
              onClick={authenticateBiometric}
              disabled={isAuthenticating}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {getBiometricIcon()}
                  Uji {getBiometricLabel()}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Result Feedback */}
      <AnimatePresence>
        {authResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              authResult === 'success'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {authResult === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {biometricEnabled ? 'Biometric aktif!' : 'Autentikasi berhasil!'}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Autentikasi gagal. Coba lagi.
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
