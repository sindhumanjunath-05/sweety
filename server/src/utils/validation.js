const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Validates a glucose reading payload.
 *
 * Rules:
 * - Value is required -> "Please enter a glucose value."
 * - Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."
 * - Date cannot be in the future -> "Date cannot be in the future."
 * - Slot must be one of the 4 valid slots.
 */
const validateReadingPayload = (data) => {
  const errors = [];

  // 1. Date presence & future check
  if (!data.date || typeof data.date !== 'string') {
    errors.push('Date is required.');
  } else {
    // Normalizing YYYY-MM-DD
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(data.date)) {
      errors.push('Date must be in YYYY-MM-DD format.');
    } else {
      const today = getTodayDateString();
      if (data.date > today) {
        errors.push('Date cannot be in the future.');
      }
    }
  }

  // 2. Slot validation
  if (!data.slot || typeof data.slot !== 'string') {
    errors.push('Please select a time slot.');
  } else if (!ALLOWED_SLOTS.includes(data.slot.trim())) {
    errors.push(`Slot must be one of: ${ALLOWED_SLOTS.join(', ')}.`);
  }

  // 3. Value validation
  if (data.value === undefined || data.value === null || data.value === '') {
    errors.push('Please enter a glucose value.');
  } else {
    const num = Number(data.value);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      errors.push('Value must be between 40 and 600 mg/dl.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Helper to build duplicate slot error message
 * Example: "You already have an After lunch reading for this date."
 */
const getDuplicateSlotMessage = (slot) => {
  const cleanSlot = slot ? slot.trim() : '';
  const article = /^[aeiou]/i.test(cleanSlot) ? 'an' : 'a';
  return `You already have ${article} ${cleanSlot} reading for this date.`;
};

module.exports = {
  ALLOWED_SLOTS,
  getTodayDateString,
  validateReadingPayload,
  getDuplicateSlotMessage,
};
