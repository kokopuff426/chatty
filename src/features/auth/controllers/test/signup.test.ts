/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';
import { SignUp } from '@auth/controllers/signup';
import { CustomError } from '@global/helpers/error-handler';
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/auth.mock';
import { authService } from '@service/db/auth.service';
import { UserCache } from '@service/redis/user.cache';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@global/helpers/cloudinary-upload');

describe('SignUp', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Should throw an error if username is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        email: 'manny@test.com',
        password: 'password',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('Should throw an error if username length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'ma',
        email: 'manny@test.com',
        password: 'password',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if username length is greater than maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'mathematics',
        email: 'manny@test.com',
        password: 'password',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if email is not valid', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Manny',
        email: 'random email',
        password: 'password',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email must be valid');
    });
  });

  it('Should throw an error if email is not avaliable', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Manny',
        email: '',
        password: 'password',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email is a required field');
    });
  });

  it('Should throw an error if password is not avaliable', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Manny',
        email: 'manny@test.com',
        password: '',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });

  it('Should throw an error if password is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Manny',
        email: 'manny@test.com',
        password: 'pa',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw an error if password is greater than maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Manny',
        email: 'manny@test.com',
        password: 'passwordtoolong',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw unauthorized error if user already exists', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Manny',
        email: 'manny@test.com',
        password: 'password',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(authMock);

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('Should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Manny',
        email: 'manny@test.com',
        password: 'password',
        avatarColor: 'red',
        avatarImage: 'https://res.cloudinary.com/alegria/image/upload/v1670684954/6394a11953b794232144cf75.jpg'
      }
    ) as Request;
    const res: Response = authMockResponse();

    const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache');
    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(null as any);
    jest.spyOn(cloudinaryUploads, 'uploads').mockImplementation((): any => Promise.resolve({ version: '123456789', public_id: '123456' }));

    await SignUp.prototype.create(req, res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt
    });
  });
});