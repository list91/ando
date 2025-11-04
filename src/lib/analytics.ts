import ReactGA from 'react-ga4';

// Google Analytics tracking ID - замените на ваш собственный
const TRACKING_ID = 'G-XXXXXXXXXX'; // Замените на реальный ID

export const initGA = () => {
  if (import.meta.env.PROD) {
    ReactGA.initialize(TRACKING_ID);
  }
};

export const logPageView = () => {
  if (import.meta.env.PROD) {
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname + window.location.search });
  }
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (import.meta.env.PROD) {
    ReactGA.event({
      category,
      action,
      label,
    });
  }
};

export const logProductView = (productId: string, productName: string) => {
  logEvent('Product', 'View', `${productName} (${productId})`);
};

export const logAddToCart = (productId: string, productName: string, price: number) => {
  logEvent('Cart', 'Add to Cart', `${productName} (${productId}) - ${price}₽`);
};

export const logRemoveFromCart = (productId: string, productName: string) => {
  logEvent('Cart', 'Remove from Cart', `${productName} (${productId})`);
};

export const logCheckoutStart = (totalAmount: number, itemsCount: number) => {
  logEvent('Checkout', 'Start', `${itemsCount} items - ${totalAmount}₽`);
};

export const logOrderComplete = (orderId: string, totalAmount: number) => {
  logEvent('Order', 'Complete', `${orderId} - ${totalAmount}₽`);
};

export const logSearch = (searchQuery: string, resultsCount: number) => {
  logEvent('Search', 'Query', `${searchQuery} (${resultsCount} results)`);
};

export const logCategoryView = (categoryName: string) => {
  logEvent('Category', 'View', categoryName);
};

export const logFilterChange = (filterType: string, filterValue: string) => {
  logEvent('Filter', 'Change', `${filterType}: ${filterValue}`);
};
