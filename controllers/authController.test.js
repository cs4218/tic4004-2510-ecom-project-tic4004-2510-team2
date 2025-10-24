import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userModel from '../models/userModel.js';
import { forgotPasswordController, loginController } from './authController.js';
import { hashPassword, comparePassword } from '../helpers/authHelper.js';
import jwt from 'jsonwebtoken';

const mockRes = () => {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
};

const mockReq = (body) => ({ body });

describe('forgotPasswordController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('when email is missing then should return status 400 with correct error message', async () => {
    const req = mockReq({});
    const res = mockRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Email is required' });
  });

  it('when answer is missing then should return status 400 with correct error message', async () => {
    const req = mockReq({ email: 'test@email.com' });
    const res = mockRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'answer is required' });
  });

  it('when newPassword is missing then should return status 400 with correct error message', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer' });
    const res = mockRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'New Password is required' });
  });

  it('when user not found then should return 404 with correct error message', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@email.com', answer: 'answer' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Wrong Email Or Answer',
    });
  });

  it('when user found then should return 200 and update password', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce({ _id: 'uid-123' });
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValueOnce({});

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@email.com', answer: 'answer' });

    const updateArgs = userModel.findByIdAndUpdate.mock.calls[0][1];
    const hashedPassword = updateArgs.password;

    const match = await comparePassword('newPassword', hashedPassword);
    expect(match).toBe(true);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Password Reset Successfully',
    });
  });

  it('when findOne throws error then should return status 500 with correct error message', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();
    jest.spyOn(userModel, 'findOne').mockRejectedValueOnce(new Error('Some Error'));

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Something went wrong',
        })
    );
  });

  it('when findByIdAndUpdate throws error then should return status 500 with correct error message', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();
    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce({ _id: 'uid-123' });
    jest.spyOn(userModel, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('Some Error'));

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Something went wrong',
        })
    );
  });
});

/* Login Controller Tests */
describe('loginController unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // test case: email field is empty
  it('should return 404 if email empty', async () => {
    const req = mockReq({ email: '', password: 'password123' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Invalid email or password',
      success: false,
     });
  });

  // test case: password field is empty
  it('should return 404 if password empty', async () => {
    const req = mockReq({ email: 'user@example.com', password: '' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Invalid email or password',
      success: false,
     });
  });

  // test case: email not registered
  it('should return 404 if email not registered', async () => {
    jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
    const req = mockReq({ email: 'user@example.com', password: 'password123' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Email is not registerd',
      success: false
     });
  });

  // test case: correct email but wrong password
  it('should return 200 if password does not match', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ email: 'user@example.com', password: hashedPassword });
    const req = mockReq({ email: 'user@example.com', password: 'wrongPassword' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Invalid Password',
      success: false
    });
  });

  // test case: invalid token
  it('should return 500 if token is invalid', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ email: 'user@example.com', password: hashedPassword });
    jest.spyOn(jwt, 'sign').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const req = mockReq({ email: 'user@example.com', password: 'correctPassword' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Error in login',
      success: false,
      error: new Error('Invalid token'),
    });
  });

  // test case: successful login
  it('should return 200 and token on successful login', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ 
      _id: '1', 
      name: 'Test User',
      email: 'user@example.com', 
      password: hashedPassword,
      phone: '12345678',
      address: '123 Test St',
      role: 0,
    });
    jest.spyOn(jwt, 'sign').mockReturnValue('mocktoken');
    const req = mockReq({ email: 'user@example.com', password: 'correctPassword' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'login successfully',
        token: 'mocktoken',
        user: expect.objectContaining({
          _id: '1', 
          name: 'Test User',
          email: 'user@example.com',
          phone: '12345678',
          address: '123 Test St',
          role: 0
        })
      })
    );
  });

});
