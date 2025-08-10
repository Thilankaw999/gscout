import json
import logging
import uuid
import os
from typing import Dict, Any
from http import HTTPStatus

# Configure logging
logger = logging.getLogger()
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(getattr(logging, log_level))

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle vehicle details form submission for Bedrock agent.
    Collects vehicle's make, model, and year.
    
    Args:
        event (Dict[str, Any]): The Lambda event containing action details
        context (Any): The Lambda context object
    
    Returns:
        Dict[str, Any]: Response containing the action execution results
    """
    try:
        logger.info(f"Received event for vehicle details submission: {json.dumps(event)}")
        
        action_group = event.get('actionGroup', '')
        function = event.get('function', '')
        message_version = event.get('messageVersion', '1.0')
        
        # Extract request body from Bedrock agent event
        body = event.get('requestBody', {}).get('content', {}).get('application/json', {})
        params = body.get('properties', [])
        
        # Initialize variables
        make = None
        model = None
        year = None
        
        # Extract parameters
        for param in params:
            param_name = param.get('name')
            param_value = param.get('value')
            
            if param_name == 'make':
                make = param_value
            elif param_name == 'model':
                model = param_value
            elif param_name == 'year':
                year = param_value
        
        # Validate required fields
        if not all([make, model, year]):
            missing_fields = []
            if not make:
                missing_fields.append('make')
            if not model:
                missing_fields.append('model')
            if not year:
                missing_fields.append('year')
            
            error_message = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_message)
            
            return create_error_response(event, 400, error_message)
        
        # Validate year format
        try:
            year_int = int(year)
            if year_int < 1900 or year_int > 2030:
                raise ValueError("Year must be between 1900 and 2030")
        except ValueError as ve:
            logger.error(f"Invalid year format: {year} - {str(ve)}")
            return create_error_response(event, 400, f"Invalid year: {str(ve)}")
        
        # Log successful data collection
        logger.info(f"SUCCESS: Submitting vehicle details for {year} {make} {model}")
        
        # Generate submission ID
        submission_id = f"vehicle_{uuid.uuid4()}"
        
        # In production, you would save the data to a database here
        # Example: save_vehicle_details_to_database(make, model, year, submission_id)
        
        # Create success response
        response_data = {
            'submissionId': submission_id,
            'message': f"Thank you! Your vehicle details ({year} {make} {model}) have been submitted successfully with ID: {submission_id}."
        }
        
        return create_success_response(event, response_data)
        
    except KeyError as e:
        logger.error(f'Missing required field: {str(e)}')
        return create_error_response(event, 400, f'Missing required field: {str(e)}')
    except Exception as e:
        logger.error(f"Error processing vehicle details submission: {str(e)}")
        return create_error_response(event, 500, "Internal server error")

def create_success_response(event: Dict[str, Any], data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a successful response for Bedrock agent."""
    response_body = {
        'application/json': { 
            'body': json.dumps(data)
        }
    }
    
    action_response = {
        'actionGroup': event.get('actionGroup', ''),
        'apiPath': event.get('apiPath', ''),
        'httpMethod': event.get('httpMethod', ''),
        'httpStatusCode': 200,
        'responseBody': response_body
    }
    
    final_response = {
        'messageVersion': '1.0',
        'response': action_response
    }
    
    logger.info(f"Returning success response to Bedrock: {json.dumps(final_response)}")
    return final_response

def create_error_response(event: Dict[str, Any], status_code: int, error_message: str) -> Dict[str, Any]:
    """Create an error response for Bedrock agent."""
    response_body = {
        'application/json': { 
            'body': json.dumps({
                'error': error_message,
                'statusCode': status_code
            })
        }
    }
    
    action_response = {
        'actionGroup': event.get('actionGroup', ''),
        'apiPath': event.get('apiPath', ''),
        'httpMethod': event.get('httpMethod', ''),
        'httpStatusCode': status_code,
        'responseBody': response_body
    }
    
    final_response = {
        'messageVersion': '1.0',
        'response': action_response
    }
    
    logger.error(f"Returning error response to Bedrock: {json.dumps(final_response)}")
    return final_response
