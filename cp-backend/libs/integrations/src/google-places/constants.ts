/**
 * Author: AI Assistant
 * Created on: 2024
 * Description: Google Places API integration constants
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

export const GOOGLE_PLACES_API_BASE_URL =
  'https://maps.googleapis.com/maps/api';

export const GOOGLE_PLACES_ENDPOINTS = {
  PLACE_SEARCH: '/place/findplacefromtext/json',
  PLACE_DETAILS: '/place/details/json',
  PLACE_AUTOCOMPLETE: '/place/autocomplete/json',
  GEOCODING: '/geocode/json',
  REVERSE_GEOCODING: '/geocode/json',
} as const;

export const GOOGLE_PLACES_STATUS_CODES = {
  OK: 'OK',
  ZERO_RESULTS: 'ZERO_RESULTS',
  OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
  REQUEST_DENIED: 'REQUEST_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const GOOGLE_PLACES_DEFAULT_FIELDS = [
  'place_id',
  'formatted_address',
  'name',
  'geometry',
  'types',
  'business_status',
  'opening_hours',
  'price_level',
  'rating',
  'user_ratings_total',
  'vicinity',
] as const;

export const GOOGLE_PLACES_DETAILED_FIELDS = [
  'place_id',
  'formatted_address',
  'name',
  'geometry',
  'types',
  'business_status',
  'opening_hours',
  'price_level',
  'rating',
  'user_ratings_total',
  'vicinity',
  'address_components',
  'adr_address',
  'formatted_phone_number',
  'international_phone_number',
  'photos',
  'plus_code',
  'reviews',
  'url',
  'utc_offset_minutes',
  'website',
  'wheelchair_accessible_entrance',
] as const;

export const GOOGLE_PLACES_DEFAULT_LANGUAGE = 'en';
export const GOOGLE_PLACES_DEFAULT_RADIUS = 5000;
