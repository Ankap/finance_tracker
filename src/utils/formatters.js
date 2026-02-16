// Format currency in Indian Rupee format
export const formatCurrency = (amount, showDecimals = false) => {
  if (amount === null || amount === undefined) return '₹0';
  
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 10000000) {
    // Crores
    return `${sign}₹${(absAmount / 10000000).toFixed(showDecimals ? 2 : 1)} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs
    return `${sign}₹${(absAmount / 100000).toFixed(showDecimals ? 2 : 1)}L`;
  } else if (absAmount >= 1000) {
    // Thousands
    return `${sign}₹${(absAmount / 1000).toFixed(showDecimals ? 1 : 0)}k`;
  } else {
    // Regular
    return `${sign}₹${absAmount.toFixed(showDecimals ? 2 : 0)}`;
  }
};

// Format full currency amount with commas (Indian number system)
export const formatFullCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const parts = absAmount.toFixed(0).toString().split('.');
  const integerPart = parts[0];
  
  // Indian number system: last 3 digits, then groups of 2
  let formatted = '';
  let length = integerPart.length;
  
  if (length > 3) {
    formatted = ',' + integerPart.slice(-3);
    length -= 3;
    
    while (length > 0) {
      if (length > 2) {
        formatted = ',' + integerPart.slice(length - 2, length) + formatted;
        length -= 2;
      } else {
        formatted = integerPart.slice(0, length) + formatted;
        length = 0;
      }
    }
  } else {
    formatted = integerPart;
  }
  
  return `${isNegative ? '-' : ''}₹${formatted}`;
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

// Format date
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } else if (format === 'long') {
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  } else if (format === 'month-year') {
    return d.toLocaleDateString('en-IN', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
  
  return d.toLocaleDateString('en-IN');
};

// Calculate progress percentage
export const calculateProgress = (current, target) => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    'On Track': 'text-green-600 bg-green-50',
    'Ahead': 'text-blue-600 bg-blue-50',
    'Behind': 'text-orange-600 bg-orange-50',
    'Completed': 'text-purple-600 bg-purple-50'
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
};

// Get category icon
export const getCategoryIcon = (category) => {
  const icons = {
    'Salary': '💰',
    'Groceries': '🛒',
    'Rent': '🏠',
    'Fuel': '⛽',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Travel': '✈️',
    'Medical': '🏥',
    'Utilities': '💡',
    'Subscriptions': '📱',
    'Dining Out': '🍽️',
    'Family Expenses': '👨‍👩‍👧',
    'Gifts': '🎁',
    'Insurance': '🛡️',
    'EMI': '🏦',
    'Miscellaneous': '📦'
  };
  return icons[category] || '📌';
};

// Get asset icon
export const getAssetIcon = (assetName) => {
  const icons = {
    'Mutual Funds': '📈',
    'Stocks': '📊',
    'EPF': '🏛️',
    'Gold': '💰',
    'Silver': '🪙',
    'Fixed Deposits': '🏦',
    'Bank Savings': '💳',
    'House': '🏡',
    'Other': '💼'
  };
  return icons[assetName] || '💼';
};

// Get goal icon
export const getGoalIcon = (category) => {
  const icons = {
    'Emergency Fund': '🛡️',
    'House Purchase': '🏡',
    'Education': '🎓',
    'Retirement': '🌴',
    'Travel': '✈️',
    'Career Break': '🌸',
    'Other': '🎯'
  };
  return icons[category] || '🎯';
};

// Calculate months between dates
export const monthsBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
};

// Get trend indicator
export const getTrendIndicator = (current, previous) => {
  if (!previous || current === previous) return { icon: '→', color: 'text-gray-500', text: 'No change' };
  if (current > previous) return { icon: '↑', color: 'text-green-500', text: 'Increased' };
  return { icon: '↓', color: 'text-red-500', text: 'Decreased' };
};
