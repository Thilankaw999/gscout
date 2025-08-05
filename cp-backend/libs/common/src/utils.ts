/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: Util functions
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { cloneDeepWith, isUndefined } from 'lodash';
import { DATE_FORMATS, TIME_ZONES } from './constants';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';

// Load the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Deeply scans the provided JSON object and replaces all `undefined` values with `null`.
 * Uses lodash's `cloneDeepWith` to create a deep clone of the object and customize the handling
 * of `undefined` values.
 *
 * @param {Object} obj - The JSON object to scan.
 * @returns {Object} - A new object with `undefined` values replaced by `null`.
 *
 * @example
 * const data = { name: "John", age: undefined, address: { city: "New York", zip: undefined } };
 * const result = replaceUndefinedWithNull(data);
 * // result = { name: "John", age: null, address: { city: "New York", zip: null } }
 */
export function replaceUndefinedWithNull(obj) {
  return cloneDeepWith(obj, (value) => {
    if (isUndefined(value)) {
      return null;
    }
  });
}

/**
 * This function will check if a given property exists in an object
 * @param {object} versionToBeCompared JS Object
 * @param {string} property Name of the property
 */
export function HasOwnProperty(object: object, property: string) {
  return Object.hasOwnProperty.call(object, property);
}

/**
 * Converts a time string in the format of "HH:MM" or "HH.MM" into a decimal representation.
 * The hours and minutes are split, and the minutes are converted to a fraction of an hour.
 *
 * @param {string} time - A time string in "HH:MM" or "HH.MM" format.
 * @returns {number} - The decimal representation of the time (e.g., "1:30" becomes 1.5).
 *
 * @example
 * timeStringToFloat("1:30"); // returns 1.5
 * timeStringToFloat("2.15"); // returns 2.25
 */
export function timeStringToFloat(time: string): number {
  const hoursMinutes: string[] = time.split(/[.:]/);
  const hours: number = parseInt(hoursMinutes[0], 10);
  const minutes: number = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
  return parseFloat((hours + minutes / 60).toFixed(2));
}

/**
 * Parses the input date and returns the ISO string.
 * If the date is invalid or an exception is thrown, it returns null.
 *
 * @param {string | Date | undefined} dateInput - The date string or Date object to parse.
 * @returns {string | null} The ISO string of the date, or null if invalid.
 */
export function toISOString(dateInput: string | Date | undefined | null) {
  if (!dateInput) {
    return null;
  }
  try {
    const date = new Date(dateInput);

    // Check if the date is invalid
    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Converts a given text to sentence case.
 * The first character of the sentence is capitalized, and the rest of the text is lowercased.
 * @example
 * // Returns: "Assistance with daily life tasks provided in residential aged care facility"
 * toSentenceCase("Assistance With Daily Life Tasks Provided In Residential Aged Care Facility");
 */
export function toSentenceCase(text: string) {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converts a given date in a specified timezone to its UTC equivalent.
 *
 * @param dateString - The date string in the specified timezone (e.g., '2024-07-01').
 * @param timezone - The timezone of the provided date string (e.g., 'Australia/Brisbane').
 * @returns The UTC equivalent of the input date.
 */
export function convertToUtc(dateString: string, timezone: string): Date {
  return dayjs.tz(dateString, timezone).utc().toDate();
}

/**
 * Formats a given date/time according to the specified timezone and format.
 *
 * @param {Date} time - The date/time to format
 * @param {TIME_ZONES} timezone - The timezone to use for formatting (e.g. 'Australia/Sydney')
 * @param {DATE_FORMATS} format - The desired output format (e.g. 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} The formatted date/time string
 *
 * @example
 * formatTime(new Date(), TIME_ZONES.SYDNEY, DATE_FORMATS.DATETIME)
 * // Returns: "2024-01-01 13:45:00"
 */
export function formatTime(
  time: Date,
  timezone: TIME_ZONES,
  format: DATE_FORMATS,
): string {
  return dayjs(time).tz(timezone).format(format);
}

/**
 * Formats a given date string according to the specified format.
 *
 * @param {string} date - The date string to format
 * @param {DATE_FORMATS} format - The desired output format (e.g. 'YYYY-MM-DD')
 * @returns {string} The formatted date string
 *
 * @example
 * formatDate('2024-01-01', DATE_FORMATS.DATE)
 * // Returns: "2024-01-01"
 */
export function formatDate(date: string, format: DATE_FORMATS): string {
  return dayjs(date).format(format);
}

/**
 * Generates an environment-specific parameter string by appending the environment name to a base parameter.
 */
export const envSpecificParam = (
  env: string,
  param: string,
  seperator: string = '-',
) => `${param}${seperator}${env}`;

/**
 * Formats a numeric value as a currency string with a dollar sign and two decimal places.
 *
 * @param {string | number | undefined} value - The value to format as currency
 * @returns {string} The formatted currency string with $ prefix and two decimal places
 */
export function formatCurrency(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return '';
  }

  const formattedValue = numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `$${formattedValue}`;
}

/**
 * Masks a string to show only the first digit and the last three digits.
 * Example: "123456789" -> "1******789"
 *
 * @param input - The string to be masked.
 * @returns The masked string with the first digit, last three digits visible, and the rest masked.
 * @throws Will throw an error if input is not a string.
 */
export function maskMemberShipNumber(memberShipNumber?: string): string {
  if (!memberShipNumber) {
    return '';
  }
  if (typeof memberShipNumber !== 'string') {
    throw new Error('Input must be a string');
  }

  if (memberShipNumber.length <= 4) {
    return memberShipNumber; // If the string is too short, return it as is
  }

  const firstDigit = memberShipNumber[0];
  const lastThreeDigits = memberShipNumber.slice(-3);
  const maskedPart = '*'.repeat(memberShipNumber.length - 4);

  return `${firstDigit}${maskedPart}${lastThreeDigits}`;
}

export function getRemainingTime(expiryDate: Date): string {
  const now = dayjs();
  const expiry = dayjs(expiryDate, 'YYYY-MM-DD HH:mm:ss');
  const diffMs = expiry.diff(now);

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // Calculate days
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  ); // Calculate hours

  // If there are 1 or more days, return days only
  if (diffDays >= 1) {
    return `${diffDays} day(s)`;
  } else {
    // Otherwise, return hours only
    return `${diffHours} hour(s)`;
  }
}

/**
 * Masks an email address by hiding the middle characters of the username.
 * The first and last character of the username remain visible, while the rest are replaced with '*'.
 * The domain remains unchanged.
 *
 * Example:
 *   maskEmail("johndoe@example.com") -> "j******e@example.com"
 *   maskEmail("ab@example.com") -> "**@example.com"
 *   maskEmail("a@b.c") -> "*@b.c"
 *
 * @param email - The email address to be masked.
 * @returns The masked email with the username partially hidden.
 */
export function maskEmail(email: string): string {
  // Split the email into username and domain
  const [user, domain] = email.split('@');

  // If no '@' is present, return the original string
  if (!domain) return email;

  // Mask the username:
  // - Keep the first and last character visible
  // - Replace all middle characters with '*'
  // - If the username has only one or two characters, replace them fully with '*'
  const maskedUser =
    user.length > 2
      ? user[0] + '*'.repeat(user.length - 2) + user[user.length - 1]
      : '*'.repeat(user.length);

  // Return the masked email with the original domain
  return `${maskedUser}@${domain}`;
}

export function isMaskedMembershipNumber(membershipNumber: string): boolean {
  return membershipNumber?.includes('*');
}

/**
 * Sanitizes input strings to prevent common issues.
 *
 * - Trims whitespace
 * - Escapes HTML special characters
 * - Normalizes Unicode characters
 *
 * @param value - The string value to sanitize
 * @returns Sanitized string, or original value if not a string
 */
export function sanitizeInput(value: string): string {
  if (typeof value !== 'string') return value;

  // Trim whitespace
  let sanitized = value.trim();

  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Normalize Unicode characters (NFKC form)
  sanitized = sanitized.normalize('NFKC');

  return sanitized;
}
