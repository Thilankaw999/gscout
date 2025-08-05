/**
 * Author: AI Assistant
 * Created on: 2024
 * Description: Google Places API integration interfaces
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

export interface GooglePlacesSearchRequest {
  input: string;
  inputtype?: 'textquery' | 'phonenumber';
  locationbias?: 'ipbias' | 'point' | 'circle' | 'rectangle';
  location?: string; // lat,lng
  radius?: number;
  language?: string;
  types?: string;
  components?: string;
}

export interface GooglePlacesDetailsRequest {
  place_id: string;
  fields?: string[];
  language?: string;
  region?: string;
  sessiontoken?: string;
}

export interface GooglePlacesAutocompleteRequest {
  input: string;
  sessiontoken?: string;
  offset?: number;
  location?: string; // lat,lng
  radius?: number;
  language?: string;
  types?: string;
  components?: string;
  strictbounds?: boolean;
}

export interface GooglePlacesResponse {
  status: string;
  error_message?: string;
  info_messages?: string[];
  next_page_token?: string;
}

export interface GooglePlacesSearchResponse extends GooglePlacesResponse {
  candidates?: Place[];
}

export interface GooglePlacesDetailsResponse extends GooglePlacesResponse {
  result?: PlaceDetails;
}

export interface GooglePlacesAutocompleteResponse extends GooglePlacesResponse {
  predictions?: AutocompletePrediction[];
}

export interface Place {
  place_id: string;
  formatted_address: string;
  name?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  types?: string[];
  photos?: PlacePhoto[];
  icon?: string;
  icon_background_color?: string;
  icon_mask_base_uri?: string;
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
    periods?: OpeningPeriod[];
    weekday_text?: string[];
  };
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
}

export interface PlaceDetails extends Place {
  address_components?: AddressComponent[];
  adr_address?: string;
  business_status?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  name: string;
  opening_hours?: {
    open_now: boolean;
    periods: OpeningPeriod[];
    weekday_text: string[];
  };
  photos?: PlacePhoto[];
  place_id: string;
  plus_code?: {
    compound_code?: string;
    global_code: string;
  };
  price_level?: number;
  rating?: number;
  reviews?: PlaceReview[];
  types: string[];
  url?: string;
  user_ratings_total?: number;
  utc_offset_minutes?: number;
  vicinity?: string;
  website?: string;
  wheelchair_accessible_entrance?: boolean;
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlacePhoto {
  height: number;
  html_attributions: string[];
  photo_reference: string;
  width: number;
}

export interface OpeningPeriod {
  close?: {
    day: number;
    time: string;
  };
  open: {
    day: number;
    time: string;
  };
}

export interface PlaceReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface AutocompletePrediction {
  description: string;
  matched_substrings: {
    length: number;
    offset: number;
  }[];
  place_id: string;
  reference: string;
  structured_formatting: {
    main_text: string;
    main_text_matched_substrings: {
      length: number;
      offset: number;
    }[];
    secondary_text: string;
  };
  terms: {
    offset: number;
    value: string;
  }[];
  types: string[];
}

export interface GeocodingRequest {
  address?: string;
  components?: string;
  bounds?: string;
  language?: string;
  region?: string;
  latlng?: string;
  place_id?: string;
  result_type?: string;
  location_type?: string;
}

export interface GeocodingResponse extends GooglePlacesResponse {
  results: GeocodingResult[];
}

export interface GeocodingResult {
  address_components: AddressComponent[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
    viewport: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  place_id: string;
  plus_code?: {
    compound_code?: string;
    global_code: string;
  };
  types: string[];
}
