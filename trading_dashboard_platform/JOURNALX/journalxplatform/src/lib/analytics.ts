// analytics.ts
// A more resilient way to handle Google Analytics that can fall back gracefully when blocked

export const initializeAnalytics = () => {
  // Check if analytics is likely to be blocked
  const isLikelyBlocked = window.navigator.doNotTrack === '1' || 
                         localStorage.getItem('analytics-opt-out') === 'true';

  if (isLikelyBlocked) {
    console.log('Analytics tracking is not enabled due to user preferences');
    return;
  }

  try {
    // Create a script element with proper attributes and error handling
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-03XW3FWG7L';
    script.setAttribute('nonce', 'analytics'); // Add nonce for CSP
    script.onerror = () => {
      console.log('Analytics failed to load, possibly blocked by an extension or CSP');
    };
    
    script.onload = () => {
      // Initialize dataLayer and gtag function
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', 'G-03XW3FWG7L', {
        send_page_view: false, // We'll send page views manually
        transport_type: 'beacon', // Use more reliable beacon API when available
        anonymize_ip: true // Enhanced privacy
      });
      
      // Make gtag available globally
      (window as any).gtag = gtag;
      console.log('Analytics initialized successfully');
    };
    
    // Append to the document head
    document.head.appendChild(script);
  } catch (error) {
    console.log('Failed to initialize analytics', error);
  }
};

// Safe tracking function that won't crash if analytics is blocked
export const trackPageView = (path: string) => {
  try {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: document.title,
        page_location: window.location.href
      });
      console.log(`Page view tracked: ${path}`);
    }
  } catch (error) {
    console.log('Error tracking page view', error);
  }
};

// Safe event tracking
export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  try {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, eventParams);
      console.log(`Event tracked: ${eventName}`, eventParams);
    }
  } catch (error) {
    console.log('Error tracking event', error);
  }
};
