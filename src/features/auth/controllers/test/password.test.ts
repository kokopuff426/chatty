/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { Password } from '@auth/controllers/password';
import { CustomError } from '@global/helpers/error-handler';
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/auth.mock';
import { authService } from '@service/db/auth.service';
import { emailQueue } from '@service/queues/email.queue';

const WRONG_EMAIL = 'test@email.com';
const CORRECT_EMAIL = 'george@gmail.com';
const INVALID_EMAIL = 'test';
const CORRECT_PASSWORD = 'password';

jest.mock('@service/queues/base.queue');
jest.mock('@service/queues/email.queue');
jest.mock('@service/db/auth.service');
jest.mock('@service/emails/mail.transport');

describe('Password', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('create', () => {
    it('Should throw an error if email is invalid', () => {
      const req: Request = authMockRequest(
        {},
        {
          email: INVALID_EMAIL
        }
      ) as Request;
      const res: Response = authMockResponse();
      Password.prototype.create(req, res).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual('Email must be valid');
      });
    });

    it('Should throw "Invalid credentials" if email does not exist', () => {
      const req: Request = authMockRequest(
        {},
        {
          email: WRONG_EMAIL
        }
      ) as Request;
      const res: Response = authMockResponse();

      jest.spyOn(authService, 'getAuthUserByEmail').mockResolvedValue(null as any);

      Password.prototype.create(req, res).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual('Invalid credentials');
      });
    });

    it('Should send correct json response', async () => {
      const req: Request = authMockRequest(
        {},
        {
          email: CORRECT_EMAIL
        }
      ) as Request;
      const res: Response = authMockResponse();

      jest.spyOn(authService, 'getAuthUserByEmail').mockResolvedValue(authMock);
      jest.spyOn(emailQueue, 'addEmailJob');

      await Password.prototype.create(req, res);
      expect(emailQueue.addEmailJob).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset email sent'
      });
    });
  });

  describe('update', () => {
    it('Should throw an error if password is empty', () => {
      const req: Request = authMockRequest(
        {},
        {
          password: ''
        }
      ) as Request;
      const res: Response = authMockResponse();

      Password.prototype.update(req, res).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual('Password is a required field');
      });
    });

    it('Should throw an error if password and confirmPassword are different', () => {
      const req: Request = authMockRequest(
        {},
        {
          password: CORRECT_PASSWORD,
          confirmPassword: `${CORRECT_PASSWORD}2`
        }
      ) as Request;
      const res: Response = authMockResponse();

      Password.prototype.update(req, res).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual('Passwords should match');
      });
    });

    it('Should throw an error if reset token has expired', () => {
      const req: Request = authMockRequest(
        {},
        {
          password: CORRECT_PASSWORD,
          confirmPassword: CORRECT_PASSWORD
        },
        null,
        {
          token: ''
        }
      ) as Request;
      const res: Response = authMockResponse();

      jest.spyOn(authService, 'getAuthUserByPasswordToken').mockResolvedValue(null as any);

      Password.prototype.update(req, res).catch((error: CustomError) => {
        expect(error.statusCode).toEqual(400);
        expect(error.serializeErrors().message).toEqual('Reset token has expired');
      });
    });

    it('Should send correct json response', async () => {
      const req: Request = authMockRequest(
        {},
        {
          password: CORRECT_PASSWORD,
          confirmPassword: CORRECT_PASSWORD
        },
        null,
        {
          token: '123456'
        }
      ) as Request;
      const res: Response = authMockResponse();

      jest.spyOn(authService, 'getAuthUserByPasswordToken').mockResolvedValue(authMock);
      jest.spyOn(emailQueue, 'addEmailJob');

      await Password.prototype.update(req, res);
      expect(emailQueue.addEmailJob).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password successfully updated'
      });
    });
  });
});
