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
    Handle personal information form submission for Bedrock agent.
    Collects user's first name, last name, and email address.
    
    Args:
        event (Dict[str, Any]): The Lambda event containing action details
        context (Any): The Lambda context object
    
    Returns:
        Dict[str, Any]: Response containing the action execution results
    """
    try:
        logger.info(f"Received event for personal info submission: {json.dumps(event)}")
        
        action_group = event.get('actionGroup', '')
        function = event.get('function', '')
        message_version = event.get('messageVersion', '1.0')
        
        # Extract request body from Bedrock agent event
        body = event.get('requestBody', {}).get('content', {}).get('application/json', {})
        params = body.get('properties', [])
        
        # Initialize variables
        first_name = None
        last_name = None
        email = None
        
        # Extract parameters
        for param in params:
            param_name = param.get('name')
            param_value = param.get('value')
            
            if param_name == 'firstName':
                first_name = param_value
            elif param_name == 'lastName':
                last_name = param_value
            elif param_name == 'email':
                email = param_value
        
        # Validate required fields
        if not all([first_name, last_name, email]):
            missing_fields = []
            if not first_name:
                missing_fields.append('firstName')
            if not last_name:
                missing_fields.append('lastName')
            if not email:
                missing_fields.append('email')
            
            error_message = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_message)
            
            return create_error_response(event, 400, error_message)
        
        # Log successful data collection
        logger.info(f"SUCCESS: Submitting personal info for {first_name} {last_name} ({email})")
        
        # Generate submission ID
        submission_id = f"personal_{uuid.uuid4()}"
        
        # In production, you would save the data to a database here
        # Example: save_personal_info_to_database(first_name, last_name, email, submission_id)
        
        # Create success response
        response_data = {
            'submissionId': submission_id,
            'message': f"Thank you {first_name}! Your personal information has been submitted successfully with ID: {submission_id}."
        }
        
        return create_success_response(event, response_data)
        
    except KeyError as e:
        logger.error(f'Missing required field: {str(e)}')
        return create_error_response(event, 400, f'Missing required field: {str(e)}')
    except Exception as e:
        logger.error(f"Error processing personal info submission: {str(e)}")
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
