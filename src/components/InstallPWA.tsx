import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches || 
        window.navigator.standalone === true) {
      setIsAppInstalled(true);
      return;
    }

    // Store the install prompt event for later use
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt as it can't be used again
    setInstallPrompt(null);
  };

  // Don't render anything if the app is already installed or if the install prompt is not available
  if (isAppInstalled || !installPrompt) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-6 right-6 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-50 transition-all duration-300 ease-in-out transform hover:scale-110"
      aria-label="Install app"
    >
      <ArrowDownTrayIcon className="h-6 w-6" />
    </button>
  );
};

export default InstallPWA;