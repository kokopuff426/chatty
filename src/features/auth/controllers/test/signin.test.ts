/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { SignIn } from '@auth/controllers/signin';
import { CustomError } from '@global/helpers/error-handler';
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/auth.mock';
import { authService } from '@service/db/auth.service';
import { Helpers } from '@global/helpers/helpers';
import { userService } from '@service/db/user.service';
import { mergedAuthAndUserData } from '@root/mocks/user.mock';

const USERNAME = 'Manny';
const PASSWORD = 'password';
const WRONG_USERNAME = 'ma';
const WRONG_PASSWORD = 'pa';
const LONG_PASSWORD = 'longpassword';
const LONG_USERNAME = 'longusername';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');

describe('SignIn', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Should throw an error if username is not avaliable', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        password: PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('Should throw an error if username length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: WRONG_USERNAME,
        password: PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if username length is greater than maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: LONG_USERNAME,
        password: PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if password is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: USERNAME,
        password: ''
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });

  it('Should throw an error if password length is less than minimum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: USERNAME,
        password: WRONG_PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw an error if password length is greater than maximum length', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: USERNAME,
        password: LONG_PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw "Invalid credentials" if username does not exist', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: USERNAME,
        password: PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValueOnce(null as any);

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(authService.getAuthUserByUsername).toHaveBeenCalledWith(Helpers.firstLetterUppercase(req.body.username));
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('Should throw "Invalid credentials" if password does not exist', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: USERNAME,
        password: PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValueOnce(null as any);

    SignIn.prototype.read(req, res).catch((error: CustomError) => {
      expect(authService.getAuthUserByUsername).toHaveBeenCalledWith(Helpers.firstLetterUppercase(req.body.username));
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('Should set session data for valid credentials and send correct json response', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: USERNAME,
        password: PASSWORD
      }
    ) as Request;
    const res: Response = authMockResponse();

    authMock.comparePassword = () => Promise.resolve(true);
    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValue(authMock);
    jest.spyOn(userService, 'getUserByAuthId').mockResolvedValue(mergedAuthAndUserData);

    await SignIn.prototype.read(req, res);
    expect(req.session?.jwt).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User login successfully',
      user: mergedAuthAndUserData,
      token: req.session?.jwt
    });
  });
});
