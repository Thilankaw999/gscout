// /**
//  * Author: Insurance Portal Development Team
//  * Created on: 2024-12-19
//  * Description: GetUserUseCase Tests for customer profile retrieval
//  * Module: Insurance Property Portal Backend
//  * Copyright (c) 2024 Proper Insure All rights reserved.
//  */

// import { Test, TestingModule } from '@nestjs/testing';
// import { NotFoundException, UnauthorizedException } from '@nestjs/common';
// import { GetUserUseCase } from './get-user.usecase';
// import { UserContextService } from '@app/user-context';
// import { Logger } from '@app/logger';
// import { ItsSystemClientService } from '../../services/its-client.service';
// import { UserProfileTransformationService } from '../../services/user-profile-transformation.service';

// describe('GetUserUseCase', () => {
//   let useCase: GetUserUseCase;
//   let itsSystemClientService: jest.Mocked<ItsSystemClientService>;
//   let userProfileTransformationService: jest.Mocked<UserProfileTransformationService>;
//   let userContextService: jest.Mocked<UserContextService>;
//   let logger: jest.Mocked<Logger>;

//   const mockClientResponse = {
//     customerId: '1234567890',
//     name: 'Shannon Prunkl',
//     email: 'shannon@proper.insure',
//     phone: '(443) 798-8013',
//     address: {
//       address_line1: '3183 Orthello Way',
//       address_line2: '',
//       city: 'Santa Clara',
//       state: 'CA',
//       zip: '95051',
//       country: 'USA',
//     },
//   };

//   const mockUserContext = {
//     userId: 1,
//     email: 'shannon@proper.insure',
//     firstName: 'Shannon',
//     lastName: 'Prunkl',
//     role: 'customer',
//     isStaff: false,
//     mobileNumber: '(443) 798-8013',
//     cognitoKey: 'test-cognito-key',
//     cognitoUsername: 'shannon',
//     isActive: true,
//     preferredName: 'Shannon',
//     pronoun: 'She/Her',
//     lastLoggedIn: new Date('2024-01-01'),
//     federatedProviderType: 'cognito',
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         GetUserUseCase,
//         {
//           provide: ItsSystemClientService,
//           useValue: {
//             getUserProfile: jest.fn(),
//           },
//         },
//         {
//           provide: UserProfileTransformationService,
//           useValue: {
//             transformUserProfile: jest.fn(),
//             isValidUserProfile: jest.fn(),
//           },
//         },
//         {
//           provide: UserContextService,
//           useValue: {
//             getEmail: jest.fn(),
//           },
//         },
//         {
//           provide: Logger,
//           useValue: {
//             debug: jest.fn(),
//             info: jest.fn(),
//             warn: jest.fn(),
//             error: jest.fn(),
//           },
//         },
//       ],
//     }).compile();

//     useCase = module.get<GetUserUseCase>(GetUserUseCase);
//     itsSystemClientService = module.get(ItsSystemClientService);
//     userProfileTransformationService = module.get(UserProfileTransformationService);
//     userContextService = module.get(UserContextService);
//     logger = module.get(Logger);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('execute', () => {
//     it('should successfully retrieve user profile information', async () => {
//       // Arrange
//       const originalEnv = process.env.IS_OFFLINE;
//       process.env.IS_OFFLINE = 'true';
      
//       userContextService.getUserContext.mockReturnValue(mockUserContext);
//       properInsuranceClientService.getUserProfile.mockResolvedValue(mockClientResponse);

//       // Act
//       const result = await useCase.execute();

//       // Assert
//       expect(properInsuranceClientService.getUserProfile).toHaveBeenCalledWith(
//         'twidanagamage@mitrai.com', // This is the test email used when IS_OFFLINE is true
//         'Bearer mock-token-1'
//       );
//       expect(result).toEqual({
//         customerId: '1234567890',
//         name: 'Shannon Prunkl',
//         email: 'shannon@proper.insure',
//         phone: '(443) 798-8013',
//         address: {
//           line1: '3183 Orthello Way',
//           line2: '',
//           city: 'Santa Clara',
//           state: 'CA',
//           postalCode: '95051',
//           country: 'USA',
//         },
//       });

//       // Restore original environment
//       process.env.IS_OFFLINE = originalEnv;
//     });

//     it('should use production email when not in offline mode', async () => {
//       // Arrange
//       const originalEnv = process.env.IS_OFFLINE;
//       process.env.IS_OFFLINE = 'false';
      
//       userContextService.getUserContext.mockReturnValue(mockUserContext);
//       properInsuranceClientService.getUserProfile.mockResolvedValue(mockClientResponse);

//       // Act
//       const result = await useCase.execute();

//       // Assert
//              expect(properInsuranceClientService.getUserProfile).toHaveBeenCalledWith(
//          'shannon@proper.insure', // Should use the actual user email
//          'Bearer mock-token-1'
//        );
//       expect(result).toEqual({
//         customerId: '1234567890',
//         name: 'Shannon Prunkl',
//         email: 'shannon@proper.insure',
//         phone: '(443) 798-8013',
//         address: {
//           line1: '3183 Orthello Way',
//           line2: '',
//           city: 'Santa Clara',
//           state: 'CA',
//           postalCode: '95051',
//           country: 'USA',
//         },
//       });

//       // Restore original environment
//       process.env.IS_OFFLINE = originalEnv;
//     });

//     it('should handle client service errors gracefully', async () => {
//       // Arrange
//       const originalEnv = process.env.IS_OFFLINE;
//       process.env.IS_OFFLINE = 'true';
      
//       const clientError = new NotFoundException('User not found in client backend');
//       userContextService.getUserContext.mockReturnValue(mockUserContext);
//       properInsuranceClientService.getUserProfile.mockRejectedValue(clientError);

//       // Act & Assert
//       await expect(useCase.execute()).rejects.toThrow(NotFoundException);
//       expect(properInsuranceClientService.getUserProfile).toHaveBeenCalledWith(
//         'twidanagamage@mitrai.com',
//         'Bearer mock-token-1'
//       );

//       // Restore original environment
//       process.env.IS_OFFLINE = originalEnv;
//     });

//     it('should handle unauthorized errors from client service', async () => {
//       // Arrange
//       const originalEnv = process.env.IS_OFFLINE;
//       process.env.IS_OFFLINE = 'true';
      
//       const unauthorizedError = new UnauthorizedException('Unauthorized access to client backend');
//       userContextService.getUserContext.mockReturnValue(mockUserContext);
//       properInsuranceClientService.getUserProfile.mockRejectedValue(unauthorizedError);

//       // Act & Assert
//       await expect(useCase.execute()).rejects.toThrow(UnauthorizedException);
//       expect(properInsuranceClientService.getUserProfile).toHaveBeenCalledWith(
//         'twidanagamage@mitrai.com',
//         'Bearer mock-token-1'
//       );

//       // Restore original environment
//       process.env.IS_OFFLINE = originalEnv;
//     });

//     it('should handle missing line2 in address', async () => {
//       // Arrange
//       const responseWithoutLine2 = {
//         ...mockClientResponse,
//         address: {
//           ...mockClientResponse.address,
//           line2: undefined,
//         },
//       };
//       userContextService.getUserContext.mockReturnValue(mockUserContext);
//       properInsuranceClientService.getUserProfile.mockResolvedValue(responseWithoutLine2);

//       // Act
//       const result = await useCase.execute();

//       // Assert
//       expect(result.address.line2).toBe('');
//     });
//   });
// });
