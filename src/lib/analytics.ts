// Google Analytics tracking utilities

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = 'G-NYV0MGXRK2';

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// E-commerce tracking
export const trackPurchase = (transactionId: string, value: number, currency: string, items: any[]) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    });
  }
};

export const trackAddToCart = (item: any) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'add_to_cart', {
      currency: 'GBP',
      value: item.price,
      items: [item],
    });
  }
};

export const trackBeginCheckout = (value: number, items: any[]) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'begin_checkout', {
      currency: 'GBP',
      value: value,
      items: items,
    });
  }
};

// User engagement tracking
export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('click', 'button', `${buttonName}${location ? ` - ${location}` : ''}`, 1);
};

export const trackFormSubmit = (formName: string) => {
  trackEvent('submit', 'form', formName, 1);
};

export const trackVideoPlay = (videoTitle: string) => {
  trackEvent('play', 'video', videoTitle, 1);
};

export const trackSearch = (searchTerm: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'search', {
      search_term: searchTerm,
    });
  }
};
