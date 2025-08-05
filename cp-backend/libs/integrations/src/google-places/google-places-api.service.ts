/**
 * Author: AI Assistant
 * Created on: 2024
 * Description: Google Places API integration service
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { ConfigProvider } from '@app/common';
import { Injectable } from '@nestjs/common';
import { Logger } from '@app/logger';
import {
  GooglePlacesSearchRequest,
  GooglePlacesDetailsRequest,
  GooglePlacesAutocompleteRequest,
  GooglePlacesSearchResponse,
  GooglePlacesDetailsResponse,
  GooglePlacesAutocompleteResponse,
  GeocodingRequest,
  GeocodingResponse,
} from './google-places-api.interfaces';
import {
  GOOGLE_PLACES_API_BASE_URL,
  GOOGLE_PLACES_ENDPOINTS,
  GOOGLE_PLACES_STATUS_CODES,
  GOOGLE_PLACES_DEFAULT_FIELDS,
  GOOGLE_PLACES_DEFAULT_LANGUAGE,
  GOOGLE_PLACES_DEFAULT_RADIUS,
} from './constants';

@Injectable()
export class GooglePlacesApiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly _logger: Logger) {
    this.apiKey = ConfigProvider.get('googlePlaces.apiKey');
    this.baseUrl = GOOGLE_PLACES_API_BASE_URL;

    if (!this.apiKey) {
      this._logger.warn('Google Places API key not configured');
    }
  }

  /**
   * Searches for places using text input.
   * Makes a GET request to the Google Places API findplacefromtext endpoint.
   * @param request {GooglePlacesSearchRequest} The search request parameters.
   * @returns {Promise<GooglePlacesSearchResponse>} The search results.
   * @throws {Error} Throws an error if the API request fails.
   */
  async searchPlaces(
    request: GooglePlacesSearchRequest,
  ): Promise<GooglePlacesSearchResponse> {
    const url = `${this.baseUrl}${GOOGLE_PLACES_ENDPOINTS.PLACE_SEARCH}`;
    const params = new URLSearchParams({
      key: this.apiKey,
      input: request.input,
      inputtype: request.inputtype || 'textquery',
      fields: GOOGLE_PLACES_DEFAULT_FIELDS.join(','),
      language: request.language || GOOGLE_PLACES_DEFAULT_LANGUAGE,
    });

    if (request.locationbias) {
      params.append('locationbias', request.locationbias);
    }

    if (request.location) {
      params.append('location', request.location);
    }

    if (request.radius) {
      params.append('radius', request.radius.toString());
    }

    if (request.types) {
      params.append('types', request.types);
    }

    if (request.components) {
      params.append('components', request.components);
    }

    try {
      this._logger.debug('Searching places with Google Places API', {
        input: request.input,
        url: `${url}?${params.toString()}`,
      });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Google Places API Error: ${response.status} - ${response.statusText}`,
        );
      }

      const data: GooglePlacesSearchResponse = await response.json();

      if (data.status !== GOOGLE_PLACES_STATUS_CODES.OK) {
        throw new Error(
          `Google Places API returned status: ${data.status} - ${data.error_message || 'Unknown error'}`,
        );
      }

      this._logger.debug('Places search completed successfully', {
        status: data.status,
        candidatesCount: data.candidates?.length || 0,
      });

      return data;
    } catch (error) {
      this._logger.error('Error searching places:', { error, request });
      throw error;
    }
  }

  /**
   * Gets detailed information about a specific place.
   * Makes a GET request to the Google Places API details endpoint.
   * @param request {GooglePlacesDetailsRequest} The details request parameters.
   * @returns {Promise<GooglePlacesDetailsResponse>} The place details.
   * @throws {Error} Throws an error if the API request fails.
   */
  async getPlaceDetails(
    request: GooglePlacesDetailsRequest,
  ): Promise<GooglePlacesDetailsResponse> {
    const url = `${this.baseUrl}${GOOGLE_PLACES_ENDPOINTS.PLACE_DETAILS}`;
    const params = new URLSearchParams({
      key: this.apiKey,
      place_id: request.place_id,
      fields: (request.fields || GOOGLE_PLACES_DEFAULT_FIELDS).join(','),
      language: request.language || GOOGLE_PLACES_DEFAULT_LANGUAGE,
    });

    if (request.region) {
      params.append('region', request.region);
    }

    if (request.sessiontoken) {
      params.append('sessiontoken', request.sessiontoken);
    }

    try {
      this._logger.debug('Getting place details from Google Places API', {
        place_id: request.place_id,
        url: `${url}?${params.toString()}`,
      });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Google Places API Error: ${response.status} - ${response.statusText}`,
        );
      }

      const data: GooglePlacesDetailsResponse = await response.json();

      if (data.status !== GOOGLE_PLACES_STATUS_CODES.OK) {
        throw new Error(
          `Google Places API returned status: ${data.status} - ${data.error_message || 'Unknown error'}`,
        );
      }

      this._logger.debug('Place details retrieved successfully', {
        status: data.status,
        place_id: request.place_id,
      });

      return data;
    } catch (error) {
      this._logger.error('Error getting place details:', { error, request });
      throw error;
    }
  }

  /**
   * Gets autocomplete predictions for a text input.
   * Makes a GET request to the Google Places API autocomplete endpoint.
   * @param request {GooglePlacesAutocompleteRequest} The autocomplete request parameters.
   * @returns {Promise<GooglePlacesAutocompleteResponse>} The autocomplete predictions.
   * @throws {Error} Throws an error if the API request fails.
   */
  async getAutocompletePredictions(
    request: GooglePlacesAutocompleteRequest,
  ): Promise<GooglePlacesAutocompleteResponse> {
    const url = `${this.baseUrl}${GOOGLE_PLACES_ENDPOINTS.PLACE_AUTOCOMPLETE}`;
    const params = new URLSearchParams({
      key: this.apiKey,
      input: request.input,
      language: request.language || GOOGLE_PLACES_DEFAULT_LANGUAGE,
    });

    if (request.sessiontoken) {
      params.append('sessiontoken', request.sessiontoken);
    }

    if (request.offset) {
      params.append('offset', request.offset.toString());
    }

    if (request.location) {
      params.append('location', request.location);
    }

    if (request.radius) {
      params.append('radius', request.radius.toString());
    }

    if (request.types) {
      params.append('types', request.types);
    }

    if (request.components) {
      params.append('components', request.components);
    }

    if (request.strictbounds) {
      params.append('strictbounds', request.strictbounds.toString());
    }

    try {
      this._logger.debug(
        'Getting autocomplete predictions from Google Places API',
        {
          input: request.input,
          url: `${url}?${params.toString()}`,
        },
      );

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Google Places API Error: ${response.status} - ${response.statusText}`,
        );
      }

      const data: GooglePlacesAutocompleteResponse = await response.json();

      if (data.status !== GOOGLE_PLACES_STATUS_CODES.OK) {
        throw new Error(
          `Google Places API returned status: ${data.status} - ${data.error_message || 'Unknown error'}`,
        );
      }

      this._logger.debug('Autocomplete predictions retrieved successfully', {
        status: data.status,
        predictionsCount: data.predictions?.length || 0,
      });

      return data;
    } catch (error) {
      this._logger.error('Error getting autocomplete predictions:', {
        error,
        request,
      });
      throw error;
    }
  }

  /**
   * Geocodes an address to get coordinates.
   * Makes a GET request to the Google Geocoding API.
   * @param request {GeocodingRequest} The geocoding request parameters.
   * @returns {Promise<GeocodingResponse>} The geocoding results.
   * @throws {Error} Throws an error if the API request fails.
   */
  async geocodeAddress(request: GeocodingRequest): Promise<GeocodingResponse> {
    const url = `${this.baseUrl}${GOOGLE_PLACES_ENDPOINTS.GEOCODING}`;
    const params = new URLSearchParams({
      key: this.apiKey,
      language: request.language || GOOGLE_PLACES_DEFAULT_LANGUAGE,
    });

    if (request.address) {
      params.append('address', request.address);
    }

    if (request.components) {
      params.append('components', request.components);
    }

    if (request.bounds) {
      params.append('bounds', request.bounds);
    }

    if (request.region) {
      params.append('region', request.region);
    }

    if (request.latlng) {
      params.append('latlng', request.latlng);
    }

    if (request.place_id) {
      params.append('place_id', request.place_id);
    }

    if (request.result_type) {
      params.append('result_type', request.result_type);
    }

    if (request.location_type) {
      params.append('location_type', request.location_type);
    }

    try {
      this._logger.debug('Geocoding address with Google Geocoding API', {
        address: request.address,
        latlng: request.latlng,
        url: `${url}?${params.toString()}`,
      });

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(
          `Google Geocoding API Error: ${response.status} - ${response.statusText}`,
        );
      }

      const data: GeocodingResponse = await response.json();

      if (data.status !== GOOGLE_PLACES_STATUS_CODES.OK) {
        throw new Error(
          `Google Geocoding API returned status: ${data.status} - ${data.error_message || 'Unknown error'}`,
        );
      }

      this._logger.debug('Geocoding completed successfully', {
        status: data.status,
        resultsCount: data.results?.length || 0,
      });

      return data;
    } catch (error) {
      this._logger.error('Error geocoding address:', { error, request });
      throw error;
    }
  }

  /**
   * Reverse geocodes coordinates to get an address.
   * Makes a GET request to the Google Geocoding API with latlng parameter.
   * @param latlng {string} The latitude and longitude in "lat,lng" format.
   * @param language {string} Optional language code.
   * @returns {Promise<GeocodingResponse>} The reverse geocoding results.
   * @throws {Error} Throws an error if the API request fails.
   */
  async reverseGeocode(
    latlng: string,
    language?: string,
  ): Promise<GeocodingResponse> {
    return this.geocodeAddress({
      latlng,
      language: language || GOOGLE_PLACES_DEFAULT_LANGUAGE,
    });
  }

  /**
   * Searches for places near a specific location.
   * @param query {string} The search query.
   * @param lat {number} Latitude.
   * @param lng {number} Longitude.
   * @param radius {number} Search radius in meters.
   * @param language {string} Optional language code.
   * @returns {Promise<GooglePlacesSearchResponse>} The search results.
   * @throws {Error} Throws an error if the API request fails.
   */
  async searchPlacesNearby(
    query: string,
    lat: number,
    lng: number,
    radius: number = GOOGLE_PLACES_DEFAULT_RADIUS,
    language?: string,
  ): Promise<GooglePlacesSearchResponse> {
    return this.searchPlaces({
      input: query,
      locationbias: 'point',
      location: `${lat},${lng}`,
      radius,
      language: language || GOOGLE_PLACES_DEFAULT_LANGUAGE,
    });
  }
}
